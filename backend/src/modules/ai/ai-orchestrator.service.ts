import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AppLogger } from '../../common/logger/logger.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { RouterAgent } from './agents/router.agent';
import { SearchAgent } from './agents/search.agent';
import { CompareAgent } from './agents/compare.agent';
import { RankingAgent } from './agents/ranking.agent';
import { ResponseAgent } from './agents/response.agent';
import { AgentContext, RankedProduct } from './agents/agent.types';

/**
 * AiOrchestratorService — coordinates the multi-agent pipeline.
 *
 * Pipeline per turn:
 *   1. Load conversation history + extract previousSearchResults from last assistant turn
 *   2. RouterAgent        → classify intent (SEARCH / COMPARE / FOLLOWUP / GENERAL …)
 *   3a. PRODUCT_SEARCH / PRODUCT_DETAILS → SearchAgent → RankingAgent
 *   3b. FOLLOWUP_SEARCH  → RankingAgent (re-rank previous results, or SearchAgent if refined)
 *   3c. PRODUCT_COMPARE  → CompareAgent (with fallback to SearchAgent)
 *   3d. GENERAL / …      → ResponseAgent directly
 *   4. ResponseAgent      → write final text
 *   5. Persist messages + top-5 recommendations
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new AppLogger('AiOrchestrator');

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly recommendationsService: RecommendationsService,
    private readonly routerAgent: RouterAgent,
    private readonly searchAgent: SearchAgent,
    private readonly compareAgent: CompareAgent,
    private readonly rankingAgent: RankingAgent,
    private readonly responseAgent: ResponseAgent,
  ) {}

  async processMessage(userId: string, dto: ChatRequestDto) {
    const { message, conversationId } = dto;

    // ── Load or create conversation ──────────────────────────────────────────
    const conversation = conversationId
      ? await this.conversationsService.findById(conversationId, userId)
      : await this.conversationsService.create(userId, message);

    type StoredMessage = { role: string; content: string; timestamp: string };
    const storedMessages = conversation.messages as StoredMessage[];

    const history = storedMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ── Extract previous search results from conversation state ──────────────
    // The structured state stores the last ranked products so follow-up
    // messages like "which is best?" can reference them.
    const structuredState = (conversation.structuredState as Record<string, unknown>) ?? {};
    const previousSearchResults =
      (structuredState.lastRankedProducts as RankedProduct[] | undefined) ?? [];

    // ── Build initial context ────────────────────────────────────────────────
    let context: AgentContext = {
      userId,
      conversationId: conversation.id,
      originalMessage: message,
      history,
      previousSearchResults,
    };

    const pipelineTrace: string[] = [];

    try {
      // ── Step 1: Route ──────────────────────────────────────────────────────
      this.logger.debug(`[Pipeline] RouterAgent`);
      context = await this.routerAgent.run(context);
      pipelineTrace.push(`RouterAgent → ${context.intent}`);

      // ── Step 2: Data retrieval ─────────────────────────────────────────────
      switch (context.intent) {

        case 'PRODUCT_SEARCH':
        case 'PRODUCT_DETAILS':
          this.logger.debug(`[Pipeline] SearchAgent`);
          context = await this.searchAgent.run(context);
          pipelineTrace.push(`SearchAgent → found ${context.totalFound}, query: "${context.requirements?.query}"`);

          this.logger.debug(`[Pipeline] RankingAgent`);
          context = await this.rankingAgent.run(context);
          pipelineTrace.push(`RankingAgent → ranked ${context.rankedProducts?.length}, top: ${context.rankedProducts?.[0]?.score}`);
          break;

        case 'FOLLOWUP_SEARCH': {
          // The user is refining a previous search (e.g. "only ASUS", "which is best?")
          // Try to extract refined requirements and re-search, unless it's a pure
          // "pick from these" question that needs no new DB query.
          const needsNewSearch = this.followUpNeedsNewSearch(message);

          if (needsNewSearch) {
            this.logger.debug(`[Pipeline] FOLLOWUP — re-search with refinement`);
            context = await this.searchAgent.run(context);
            pipelineTrace.push(`SearchAgent (follow-up) → found ${context.totalFound}`);

            context = await this.rankingAgent.run(context);
            pipelineTrace.push(`RankingAgent → ranked ${context.rankedProducts?.length}`);
          } else {
            // Pure follow-up on existing results — no new DB query needed
            this.logger.debug(`[Pipeline] FOLLOWUP — using previous results`);
            pipelineTrace.push(`FOLLOWUP → using ${previousSearchResults.length} previous results`);
          }
          break;
        }

        case 'PRODUCT_COMPARE':
          this.logger.debug(`[Pipeline] CompareAgent`);
          context = await this.compareAgent.run(context);
          pipelineTrace.push(`CompareAgent → ${context.comparisonResult?.products.length ?? 0} products`);

          // CompareAgent may fall back to PRODUCT_SEARCH if names not resolved
          if (context.intent === 'PRODUCT_SEARCH') {
            context = await this.searchAgent.run(context);
            context = await this.rankingAgent.run(context);
            pipelineTrace.push(`CompareAgent fallback → SearchAgent+RankingAgent`);
          }
          break;

        case 'GENERAL':
        case 'WISHLIST':
        case 'RECOMMENDATIONS':
          pipelineTrace.push(`${context.intent} → ResponseAgent direct`);
          break;
      }

      // ── Step 3: Generate response ──────────────────────────────────────────
      this.logger.debug(`[Pipeline] ResponseAgent`);
      context = await this.responseAgent.run(context);
      pipelineTrace.push(`ResponseAgent → done`);

      // ── Step 4: Persist ranked products for next turn ──────────────────────
      const newRankedProducts = context.rankedProducts ?? previousSearchResults;
      if (newRankedProducts.length) {
        await this.conversationsService.updateStructuredState(conversation.id, {
          ...structuredState,
          lastRankedProducts: newRankedProducts.slice(0, 10),
          lastRequirements: context.requirements,
          lastIntent: context.intent,
        }).catch((err) =>
          this.logger.warn(`Failed to update structured state: ${(err as Error).message}`),
        );
      }

      // ── Step 5: Persist top recommendations to DB ──────────────────────────
      if (context.rankedProducts?.length) {
        await this.persistRecommendations(
          userId,
          conversation.id,
          context.rankedProducts,
        ).catch((err) =>
          this.logger.warn(`Failed to persist recommendations: ${(err as Error).message}`),
        );
      }

    } catch (err) {
      if (err instanceof HttpException) throw err;
      const msg = (err as Error).message ?? 'Unknown error';
      this.logger.error(`Pipeline failed: ${msg}`, (err as Error).stack);
      context.finalMessage = 'Sorry, something went wrong. Please try again.';
      context.rankedProducts = previousSearchResults; // keep showing previous results
      context.followUpQuestions = [];
    }

    // ── Persist conversation messages ────────────────────────────────────────
    await this.conversationsService.addMessage(conversation.id, 'user', message);
    await this.conversationsService.addMessage(
      conversation.id,
      'assistant',
      context.finalMessage ?? '',
    );

    // ── Build response ───────────────────────────────────────────────────────
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
      })),
      followUpQuestions: context.followUpQuestions ?? [],
      ...(isDev && { debug: { pipeline: pipelineTrace } }),
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Determine whether a follow-up message needs a new DB search
   * or can be answered from the already-retrieved previous results.
   *
   * "which is best?" → NO new search (answer from previous results)
   * "only ASUS"      → YES new search (filter by brand)
   * "increase budget to 90k" → YES new search
   * "compare these"  → NO new search
   */
  private followUpNeedsNewSearch(message: string): boolean {
    const lower = message.toLowerCase().trim();
    const needsNewSearch = [
      /only\s+\w+/,                   // "only ASUS"
      /increase.*(budget|price)/,      // "increase budget to 90k"
      /decrease.*(budget|price)/,
      /change.*(budget|price|range)/,
      /under\s+[\d,₹]+/,              // "under 70k"
      /above\s+[\d,₹]+/,
      /\b(add|include)\s+\w+\s+brand/, // "add Samsung"
    ];
    return needsNewSearch.some((p) => p.test(lower));
  }

  private async persistRecommendations(
    userId: string,
    conversationId: string,
    rankedProducts: RankedProduct[],
  ) {
    const top5 = rankedProducts.slice(0, 5);
    await Promise.all(
      top5.map((p) =>
        this.recommendationsService.saveRecommendation(
          userId,
          p.productId,
          p.score,
          p.matchedRequirements.length
            ? `Matches: ${p.matchedRequirements.join(', ')}`
            : 'Top match for your search',
          p.matchedRequirements,
          conversationId,
        ),
      ),
    );
  }
}
