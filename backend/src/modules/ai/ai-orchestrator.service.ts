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
import { AgentContext } from './agents/agent.types';

/**
 * AiOrchestratorService — coordinates the multi-agent pipeline.
 *
 * Pipeline:
 *
 *   User message
 *     → RouterAgent      (classify intent)
 *     → SearchAgent      (extract requirements + search DB)  [SEARCH/DETAILS only]
 *     → CompareAgent     (fetch comparison matrix)           [COMPARE only]
 *     → RankingAgent     (deterministic scoring)             [SEARCH/DETAILS only]
 *     → ResponseAgent    (write final text)
 *
 * The orchestrator does NOT call the AI directly — each agent handles its own AI calls.
 * The orchestrator only manages flow, conversation persistence, and the final response shape.
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
    const history = (conversation.messages as StoredMessage[]).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // ── Build initial context ────────────────────────────────────────────────
    let context: AgentContext = {
      userId,
      conversationId: conversation.id,
      originalMessage: message,
      history,
    };

    const pipelineTrace: string[] = [];

    try {
      // ── Step 1: Route ──────────────────────────────────────────────────────
      this.logger.debug(`[Pipeline] Step 1 — RouterAgent`);
      context = await this.routerAgent.run(context);
      pipelineTrace.push(`RouterAgent → intent: ${context.intent}`);
      this.logger.debug(`[Pipeline] Intent: ${context.intent}`);

      // ── Step 2: Agent-specific pipeline ───────────────────────────────────
      switch (context.intent) {
        case 'PRODUCT_SEARCH':
        case 'PRODUCT_DETAILS':
          this.logger.debug(`[Pipeline] Step 2 — SearchAgent`);
          context = await this.searchAgent.run(context);
          pipelineTrace.push(`SearchAgent → found: ${context.totalFound} products, query: "${context.requirements?.query}"`);

          this.logger.debug(`[Pipeline] Step 3 — RankingAgent`);
          context = await this.rankingAgent.run(context);
          pipelineTrace.push(`RankingAgent → ranked: ${context.rankedProducts?.length}, top score: ${context.rankedProducts?.[0]?.score}`);
          break;

        case 'PRODUCT_COMPARE':
          this.logger.debug(`[Pipeline] Step 2 — CompareAgent`);
          context = await this.compareAgent.run(context);
          pipelineTrace.push(`CompareAgent → compared: ${context.comparisonResult?.products.length ?? 0} products`);

          if (context.intent === 'PRODUCT_SEARCH') {
            this.logger.debug(`[Pipeline] Compare fallback → SearchAgent`);
            pipelineTrace.push(`CompareAgent → fallback to SearchAgent`);
            context = await this.searchAgent.run(context);
            context = await this.rankingAgent.run(context);
            pipelineTrace.push(`RankingAgent → ranked: ${context.rankedProducts?.length}`);
          }
          break;

        case 'GENERAL':
        case 'WISHLIST':
        case 'RECOMMENDATIONS':
          pipelineTrace.push(`${context.intent} → no search needed`);
          break;
      }

      // ── Step 3: Generate response ──────────────────────────────────────────
      this.logger.debug(`[Pipeline] Step 4 — ResponseAgent`);
      context = await this.responseAgent.run(context);
      pipelineTrace.push(`ResponseAgent → message generated`);

      // ── Step 4: Persist top recommendations to DB ──────────────────────────
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
      context.rankedProducts = [];
      context.followUpQuestions = [];
    }

    // ── Persist conversation messages ────────────────────────────────────────
    await this.conversationsService.addMessage(conversation.id, 'user', message);
    await this.conversationsService.addMessage(
      conversation.id,
      'assistant',
      context.finalMessage ?? '',
    );

    // ── Build API response ───────────────────────────────────────────────────
    const isDev = process.env.NODE_ENV !== 'production';

    return {
      conversationId: conversation.id,
      message: context.finalMessage ?? '',
      intent: context.intent ?? 'GENERAL',
      products: (context.rankedProducts ?? []).map((p) => ({
        productId: p.productId,
        score: p.score,
        reason: p.matchedRequirements.length
          ? `Matches: ${p.matchedRequirements.join(', ')}`
          : `${p.name} is a great match`,
        matchedRequirements: p.matchedRequirements,
        warnings: p.warnings,
      })),
      followUpQuestions: context.followUpQuestions ?? [],
      // Pipeline trace — visible in dev mode so you can see which agents ran
      ...(isDev && { debug: { pipeline: pipelineTrace } }),
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async persistRecommendations(
    userId: string,
    conversationId: string,
    rankedProducts: AgentContext['rankedProducts'],
  ) {
    if (!rankedProducts?.length) return;

    // Save top 5 recommendations to DB
    const top5 = rankedProducts.slice(0, 5);
    await Promise.all(
      top5.map((p) =>
        this.recommendationsService.saveRecommendation(
          userId,
          p.productId,
          p.score,
          p.matchedRequirements.length
            ? `Matches: ${p.matchedRequirements.join(', ')}`
            : `Top match for your search`,
          p.matchedRequirements,
          conversationId,
        ),
      ),
    );
  }
}
