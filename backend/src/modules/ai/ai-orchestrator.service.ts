import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AppLogger } from '../../common/logger/logger.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { PreferencesService } from '../preferences/preferences.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { SearchService } from '../search/search.service';
import { RouterAgent } from './agents/router.agent';
import { ClarificationAgent } from './agents/clarification.agent';
import { SearchAgent } from './agents/search.agent';
import { CompareAgent } from './agents/compare.agent';
import { RankingAgent } from './agents/ranking.agent';
import { ResponseAgent } from './agents/response.agent';
import { AgentContext, RankedProduct } from './agents/agent.types';

/**
 * AiOrchestratorService — multi-agent pipeline coordinator.
 *
 * Pipeline per turn:
 *   1. Load conversation, preferences, previous results
 *   2. RouterAgent → classify intent
 *   3. ClarificationAgent → check if we need to ask a question first
 *   4a. PRODUCT_SEARCH/DETAILS → SearchAgent → RankingAgent
 *   4b. FOLLOWUP_SEARCH → SearchAgent (if refinement) or use previous
 *   4c. PRODUCT_COMPARE → CompareAgent
 *   4d. WISHLIST_ADD → WishlistService directly
 *   4e. CLARIFICATION/GENERAL → ResponseAgent directly
 *   5. ResponseAgent → write final text
 *   6. Persist conversation, recommendations, structured state
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new AppLogger('AiOrchestrator');

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly recommendationsService: RecommendationsService,
    private readonly preferencesService: PreferencesService,
    private readonly wishlistService: WishlistService,
    private readonly searchService: SearchService,
    private readonly routerAgent: RouterAgent,
    private readonly clarificationAgent: ClarificationAgent,
    private readonly searchAgent: SearchAgent,
    private readonly compareAgent: CompareAgent,
    private readonly rankingAgent: RankingAgent,
    private readonly responseAgent: ResponseAgent,
  ) {}

  async processMessage(userId: string, dto: ChatRequestDto) {
    const { message, conversationId } = dto;

    // ── Load conversation ────────────────────────────────────────────────────
    const conversation = conversationId
      ? await this.conversationsService.findById(conversationId, userId)
      : await this.conversationsService.create(userId, message);

    type StoredMessage = { role: string; content: string; timestamp: string };
    const history = (conversation.messages as StoredMessage[]).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const structuredState = (conversation.structuredState as Record<string, unknown>) ?? {};
    const previousSearchResults = (structuredState.lastRankedProducts as RankedProduct[]) ?? [];
    const previousRequirements = structuredState.lastRequirements as AgentContext['requirements'] | undefined;

    // ── Load user preferences ────────────────────────────────────────────────
    let userPreferences: AgentContext['userPreferences'] | undefined;
    try {
      const prefs = await this.preferencesService.get(userId);
      if (prefs) {
        userPreferences = {
          preferredBrands: prefs.preferredBrands ?? [],
          preferredCategories: prefs.preferredCategories ?? [],
          budgetMin: prefs.budgetMin,
          budgetMax: prefs.budgetMax,
          useCases: prefs.useCases ?? [],
        };
      }
    } catch {
      // Preferences are optional — don't fail the pipeline
    }

    let context: AgentContext = {
      userId,
      conversationId: conversation.id,
      originalMessage: message,
      history,
      previousSearchResults,
      previousRequirements,
      userPreferences,
    };

    const pipelineTrace: string[] = [];

    try {
      // ── Step 1: Route ──────────────────────────────────────────────────────
      context = await this.routerAgent.run(context);
      pipelineTrace.push(`Router → ${context.intent}`);

      // ── Step 2: Check if clarification needed ─────────────────────────────
      if (context.intent === 'PRODUCT_SEARCH') {
        context = await this.clarificationAgent.run(context);
        if (context.intent === 'CLARIFICATION') {
          pipelineTrace.push(`Clarification → ${context.clarificationQuestion}`);
        }
      }

      // ── Step 3: Execute pipeline ───────────────────────────────────────────
      if (context.intent !== 'CLARIFICATION') {
        switch (context.intent) {

          case 'PRODUCT_SEARCH':
          case 'PRODUCT_DETAILS':
            context = await this.searchAgent.run(context);
            pipelineTrace.push(`Search → ${context.totalFound} products, query: "${context.requirements?.query}"`);
            context = await this.rankingAgent.run(context);
            pipelineTrace.push(`Ranking → top: ${context.rankedProducts?.[0]?.name} (${context.rankedProducts?.[0]?.score})`);
            // Fetch similar products for the top result (shown in ResponseAgent)
            await this.loadSimilarProducts(context);
            break;

          case 'FOLLOWUP_SEARCH': {
            const needsNew = this.followUpNeedsNewSearch(message);
            const isBestPick = this.isBestPickQuestion(message);

            if (needsNew) {
              const isUseCaseChange = /for\s+(gaming|graphic[\s-]*design|web[\s-]*dev|video[\s-]*editing|photography|business)/i.test(message);
              if (isUseCaseChange) context.requirements = undefined;
              context = await this.searchAgent.run(context);
              context = await this.rankingAgent.run(context);
              pipelineTrace.push(`Search (follow-up) → ${context.totalFound} products`);
            } else {
              context.rankedProducts = previousSearchResults;
              pipelineTrace.push(`Follow-up → using ${previousSearchResults.length} previous results`);
            }

            if (isBestPick) {
              context.bestPickOnly = true;
              pipelineTrace.push(`bestPickOnly flag set`);
            }
            break;
          }

          case 'PRODUCT_COMPARE':
            context = await this.compareAgent.run(context);
            pipelineTrace.push(`Compare → ${context.comparisonResult?.products.length ?? 0} products`);
            if (context.intent === 'PRODUCT_SEARCH') {
              context = await this.searchAgent.run(context);
              context = await this.rankingAgent.run(context);
            }
            break;

          case 'WISHLIST_ADD':
            await this.handleWishlistAdd(context);
            pipelineTrace.push(`Wishlist add → attempted`);
            break;

          case 'WISHLIST_VIEW':
          case 'RECOMMENDATIONS':
          case 'GENERAL':
          default:
            pipelineTrace.push(`${context.intent} → direct to ResponseAgent`);
            break;
        }
      }

      // ── Step 4: Generate response ──────────────────────────────────────────
      context = await this.responseAgent.run(context);
      pipelineTrace.push(`Response → done`);

      // ── Step 5: Persist state ──────────────────────────────────────────────
      const newProducts = context.rankedProducts ?? previousSearchResults;
      if (newProducts.length && context.intent !== 'CLARIFICATION') {
        await this.conversationsService.updateStructuredState(conversation.id, {
          ...structuredState,
          lastRankedProducts: newProducts.slice(0, 10),
          lastRequirements: context.requirements ?? previousRequirements,
          lastIntent: context.intent,
        }).catch((err) =>
          this.logger.warn(`State update failed: ${(err as Error).message}`),
        );
      }

      // ── Step 6: Auto-save top recommendations ──────────────────────────────
      if (context.rankedProducts?.length) {
        await this.persistRecommendations(userId, conversation.id, context.rankedProducts)
          .catch((err) => this.logger.warn(`Recommendations persist failed: ${(err as Error).message}`));
      }

      // ── Step 7: Auto-update user preferences from this session ────────────
      await this.updatePreferencesFromContext(userId, context)
        .catch((err) => this.logger.warn(`Preference update failed: ${(err as Error).message}`));

    } catch (err) {
      if (err instanceof HttpException) throw err;
      const msg = (err as Error).message ?? 'Unknown';
      this.logger.error(`Pipeline failed: ${msg}`, (err as Error).stack);
      context.finalMessage = 'Sorry, something went wrong. Please try again.';
      context.rankedProducts = previousSearchResults;
      context.followUpQuestions = [];
    }

    // ── Persist messages ───────────────────────────────────────────────────
    await this.conversationsService.addMessage(conversation.id, 'user', message);
    await this.conversationsService.addMessage(conversation.id, 'assistant', context.finalMessage ?? '');

    // ── Build response ─────────────────────────────────────────────────────
    const isDev = process.env.NODE_ENV !== 'production';
    const productsToShow = context.rankedProducts ?? [];

    return {
      conversationId: conversation.id,
      message: context.finalMessage ?? '',
      intent: context.intent ?? 'GENERAL',
      products: productsToShow.map((p) => ({
        productId: p.productId,
        score: p.score,
        reason: p.matchedRequirements.length
          ? `Matches: ${p.matchedRequirements.join(', ')}`
          : `${p.name} is a great match`,
        matchedRequirements: p.matchedRequirements,
        warnings: p.warnings,
        breakdown: p.breakdown,
      })),
      followUpQuestions: context.followUpQuestions ?? [],
      bundleSuggestions: context.bundleSuggestions ?? [],
      similarProducts: (context.similarProducts ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        brand: p.brand,
        imageUrl: p.imageUrl,
        rating: p.rating,
      })),
      ...(isDev && { debug: { pipeline: pipelineTrace } }),
    };
  }

  // ─── Wishlist via chat ─────────────────────────────────────────────────────

  private async handleWishlistAdd(context: AgentContext): Promise<void> {
    const { userId, wishlistProductId, rankedProducts, previousSearchResults } = context;
    const products = rankedProducts?.length ? rankedProducts : previousSearchResults ?? [];

    // Determine which product to add
    let productId = wishlistProductId;
    if (!productId) {
      // Try to find product ID mentioned by ordinal ("save the first one")
      const lower = context.originalMessage.toLowerCase();
      const ordinalMatch = lower.match(/(first|1st|second|2nd|third|3rd|top)/);
      if (ordinalMatch) {
        const idx = ['first', '1st'].includes(ordinalMatch[1]) ? 0
          : ['second', '2nd'].includes(ordinalMatch[1]) ? 1 : 2;
        productId = products[idx]?.productId;
      } else {
        productId = products[0]?.productId; // default to top
      }
    }

    if (productId) {
      try {
        await this.wishlistService.addToWishlist(userId, productId);
        context.wishlistProductId = productId;
      } catch {
        // Already in wishlist or other error — ResponseAgent handles the message
      }
    }
  }

  // ─── Preference learning ──────────────────────────────────────────────────

  private async updatePreferencesFromContext(userId: string, context: AgentContext): Promise<void> {
    const { requirements } = context;
    if (!requirements) return;

    const updates: Record<string, unknown> = {};

    // Remember budget range if specified
    if (requirements.maxPrice && requirements.maxPrice > 0) {
      updates.budgetMax = requirements.maxPrice;
    }
    if (requirements.minPrice && requirements.minPrice > 0) {
      updates.budgetMin = requirements.minPrice;
    }

    // Remember use cases
    if (requirements.useCases?.length) {
      updates.useCases = requirements.useCases;
    }

    if (Object.keys(updates).length > 0) {
      await this.preferencesService.upsert(userId, updates as never);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private followUpNeedsNewSearch(message: string): boolean {
    const lower = message.toLowerCase().trim();

    const useCaseChange = [
      /for\s+(gaming|game|graphic\s*design|web\s*dev|development|coding|programming|video\s*editing|photography|business|flutter|android)/,
      /(gaming|graphic\s*design|web\s*dev|video\s*editing|photography)\s*(laptop|phone|pc)?/,
      /best\s+(gaming|design|coding|programming|developer)/,
    ];
    if (useCaseChange.some((p) => p.test(lower))) return true;

    const budgetChange = [
      /only\s+\w+/, /increase.*(budget|price)/, /decrease.*(budget|price)/,
      /change.*(budget|price|range)/, /under\s+[\d,₹]+/, /above\s+[\d,₹]+/,
      /\b(add|include)\s+\w+\s+brand/,
    ];
    return budgetChange.some((p) => p.test(lower));
  }

  private isBestPickQuestion(message: string): boolean {
    const lower = message.toLowerCase().trim();
    const hasUseCase = /for\s+(gaming|game|graphic|design|web|dev|coding|programming|video|photography|business|flutter|android|study|work|office)/i.test(lower);
    if (hasUseCase) return false;

    return [
      /^which (is |one is |laptop is |phone is )?(the )?best\??$/,
      /^(which|what) (one|should i (buy|get|pick|choose)|do you recommend)\??$/,
      /^recommend (one|me one|the best one)\??$/,
      /^(top pick|best one|pick one)\??$/,
    ].some((p) => p.test(lower));
  }

  private async loadSimilarProducts(context: AgentContext): Promise<void> {
    try {
      const top = context.rankedProducts?.[0];
      if (!top) return;

      // Find the categoryId from the search results
      type PrismaProduct = { id: string; categoryId: string };
      const topFull = context.searchResults?.find((p) => p.id === top.productId) as PrismaProduct | undefined;
      if (!topFull?.categoryId) return;

      const similar = await this.searchService.findSimilar(top.productId, topFull.categoryId, 4);

      type SimilarProduct = {
        id: string; name: string; price: number; originalPrice?: number | null;
        rating: number; reviewCount: number; viewCount: number;
        description: string; specifications: unknown; imageUrl?: string | null;
        brand?: { name: string }; category?: { name: string };
      };

      context.similarProducts = (similar as SimilarProduct[])
        .filter((p) => !context.rankedProducts?.some((r) => r.productId === p.id))
        .map((p) => ({
          id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
          brand: p.brand?.name ?? '', category: p.category?.name ?? '',
          rating: p.rating, reviewCount: p.reviewCount, viewCount: p.viewCount,
          description: (p.description ?? '').slice(0, 120),
          specifications: (p.specifications as Record<string, unknown>) ?? {},
          imageUrl: p.imageUrl,
        }));
    } catch (err) {
      this.logger.warn(`Similar products failed: ${(err as Error).message}`);
    }
  }

  private async persistRecommendations(userId: string, conversationId: string, products: RankedProduct[]) {
    const top5 = products.slice(0, 5);
    await Promise.all(
      top5.map((p) =>
        this.recommendationsService.saveRecommendation(
          userId, p.productId, p.score,
          p.matchedRequirements.length ? `Matches: ${p.matchedRequirements.join(', ')}` : 'Top match',
          p.matchedRequirements, conversationId,
        ),
      ),
    );
  }
}
