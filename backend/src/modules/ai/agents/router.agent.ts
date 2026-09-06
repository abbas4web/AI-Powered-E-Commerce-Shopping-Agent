import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider } from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';
import { AgentContext, AgentIntent, IAgent } from './agent.types';

/**
 * RouterAgent — AI-first intent classification with full conversation context.
 *
 * Design principles:
 * - Uses the last 6 history turns to understand follow-up messages
 * - Understands "which is best?", "compare these", "tell me more" in context
 * - Falls back to keyword matching only on AI failure
 * - Never defaults to PRODUCT_SEARCH for ambiguous messages — uses GENERAL
 *   so the ResponseAgent can handle it with LLM general knowledge
 */
@Injectable()
export class RouterAgent implements IAgent {
  private readonly logger = new AppLogger('RouterAgent');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
  ) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { originalMessage, history, previousSearchResults } = context;

    // Detect obvious follow-up patterns before calling AI
    const isFollowUp = this.detectFollowUp(originalMessage, history, previousSearchResults);
    if (isFollowUp) {
      this.logger.debug(`Detected follow-up message — using FOLLOWUP_SEARCH`);
      context.intent = 'FOLLOWUP_SEARCH';
      context.mentionedProductIds = this.extractUUIDs(originalMessage);
      return context;
    }

    // Use AI for full context-aware classification
    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: this.buildPrompt(originalMessage, history) }],
        temperature: 0.1,
        maxTokens: 128,
      });

      const raw = (response.content ?? '').trim().toUpperCase();
      const intent = this.parseIntent(raw);
      this.logger.debug(`RouterAgent classified: "${intent}" for message: "${originalMessage}"`);
      context.intent = intent;
    } catch (err) {
      this.logger.warn(`RouterAgent AI failed, using keyword fallback: ${(err as Error).message}`);
      context.intent = this.keywordClassify(originalMessage) ?? 'GENERAL';
    }

    context.mentionedProductIds = this.extractUUIDs(originalMessage);
    return context;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private buildPrompt(message: string, history: AgentContext['history']): string {
    const recentHistory = history.slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 120)}`)
      .join('\n');

    return `You are a router for an AI shopping assistant. Classify the user's latest message.

${recentHistory ? `CONVERSATION HISTORY (recent):\n${recentHistory}\n` : ''}

LATEST MESSAGE: "${message}"

INTENT CATEGORIES:
- PRODUCT_SEARCH: User wants to find or buy products. Includes: "best X", "under budget", "I need X", "show me phones", "laptop for coding"
- PRODUCT_COMPARE: User wants to compare specific named products. Includes: "X vs Y", "compare A and B", "difference between X and Y", "which is better X or Y"
- PRODUCT_DETAILS: User wants details about one specific product. Includes: "tell me more about X", "specs of X", "what is the battery life of X"
- FOLLOWUP_SEARCH: User is refining a PREVIOUS search in context. Includes: "only ASUS", "increase budget to 90k", "which is best?", "in these which one", "sort by price", "show cheaper ones"
- WISHLIST: User wants to manage wishlist. Includes: "add to wishlist", "save this", "show my wishlist"
- RECOMMENDATIONS: User wants saved recommendations. Includes: "my recommendations", "what did you recommend"
- GENERAL: Everything else — greetings, general questions about technology, how-to questions, questions not about shopping

IMPORTANT RULES:
- If the message is a follow-up on previous products discussed (like "which is best?" or "compare these"), use FOLLOWUP_SEARCH
- If no products or budget is mentioned and the history has no shopping context, use GENERAL
- For greetings like "hi", "hello", "how are you" — always use GENERAL

Reply with ONLY the intent name. Nothing else.`;
  }

  private parseIntent(raw: string): AgentIntent {
    const intents: AgentIntent[] = [
      'PRODUCT_SEARCH',
      'PRODUCT_COMPARE',
      'PRODUCT_DETAILS',
      'FOLLOWUP_SEARCH',
      'WISHLIST',
      'RECOMMENDATIONS',
      'GENERAL',
    ];
    return intents.find((i) => raw.includes(i)) ?? 'GENERAL';
  }

  /**
   * Detect obvious follow-up messages based on patterns and history.
   * Avoids an AI call for common follow-up phrases.
   */
  private detectFollowUp(
    message: string,
    history: AgentContext['history'],
    previousResults?: AgentContext['previousSearchResults'],
  ): boolean {
    if (!history.length && !previousResults?.length) return false;

    const lower = message.toLowerCase().trim();
    const hasRecentSearch = history.some(
      (h) => h.role === 'assistant' && h.content.includes('₹'),
    );

    if (!hasRecentSearch && !previousResults?.length) return false;

    // Follow-up patterns
    const followUpPatterns = [
      /^(which|what).*(best|cheapest|expensive|recommended|good)/,
      /^(in these|among these|from these|out of these)/,
      /^(only|just|show only|filter).+(brand|asus|dell|lenovo|apple|samsung|sony)/,
      /^(increase|decrease|change).*(budget|price|range)/,
      /^(compare these|compare them|compare all)/,
      /^(tell me more|more details|details about).*(first|second|third|this|that)/,
      /^(sort|order|rank).*(price|rating|score)/,
      /^(add (the )?(first|second|third|this|that)|save (this|it))/,
      /^(what about|how about).*(first|second|third)/,
      /^(the (first|second|third) one)/,
    ];

    return followUpPatterns.some((p) => p.test(lower));
  }

  /** Fast keyword classification — used only as fallback */
  private keywordClassify(message: string): AgentIntent | null {
    const lower = message.toLowerCase().trim();

    if (/^(hi|hello|hey|how are you|what can you do|thanks|thank you)/.test(lower)) {
      return 'GENERAL';
    }
    if (/\bvs\b|\bversus\b|\bcompare\b|difference between/.test(lower)) {
      return 'PRODUCT_COMPARE';
    }
    if (/wishlist|add to (my )?wish/.test(lower)) return 'WISHLIST';
    if (/my recommendations|saved recommendations/.test(lower)) return 'RECOMMENDATIONS';
    if (
      /under|below|budget|₹|rs\.|rupee|laptop|phone|mobile|tablet|headphone|camera|tv|monitor/.test(lower) ||
      /need|want|buy|looking for|suggest|recommend|find me|show me|best/.test(lower)
    ) {
      return 'PRODUCT_SEARCH';
    }
    return null;
  }

  private extractUUIDs(message: string): string[] {
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
    return message.match(uuidPattern) ?? [];
  }
}
