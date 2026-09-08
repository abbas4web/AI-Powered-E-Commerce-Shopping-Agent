import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider } from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';
import { AgentContext, AgentIntent, IAgent } from './agent.types';

/**
 * RouterAgent — AI-first intent classification with full conversation context.
 *
 * Intents:
 *   PRODUCT_SEARCH     → find/buy products
 *   PRODUCT_COMPARE    → compare named products
 *   PRODUCT_DETAILS    → details about one product
 *   FOLLOWUP_SEARCH    → refine previous search
 *   CLARIFICATION      → agent needs to ask a question first
 *   WISHLIST_ADD       → "save this", "add to wishlist"
 *   WISHLIST_VIEW      → "show my wishlist"
 *   RECOMMENDATIONS    → "show my recommendations"
 *   GENERAL            → everything else
 */
@Injectable()
export class RouterAgent implements IAgent {
  private readonly logger = new AppLogger('RouterAgent');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
  ) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { originalMessage, history, previousSearchResults } = context;

    // Fast: detect wishlist commands without AI call
    const wishlistIntent = this.detectWishlistIntent(originalMessage);
    if (wishlistIntent) {
      context.intent = wishlistIntent;
      context.mentionedProductIds = this.extractUUIDs(originalMessage);
      this.logger.debug(`Wishlist intent: ${wishlistIntent}`);
      return context;
    }

    // Fast: detect if user is answering a clarification question
    // e.g. agent asked "What's your budget?" → user replies "under 1lakh"
    const isClarificationAnswer = this.detectClarificationAnswer(originalMessage, history);
    if (isClarificationAnswer) {
      context.intent = 'PRODUCT_SEARCH';
      this.logger.debug(`Clarification answer detected — routing to PRODUCT_SEARCH`);
      return context;
    }

    // Fast: detect obvious follow-ups
    const isFollowUp = this.detectFollowUp(originalMessage, history, previousSearchResults);
    if (isFollowUp) {
      context.intent = 'FOLLOWUP_SEARCH';
      context.mentionedProductIds = this.extractUUIDs(originalMessage);
      this.logger.debug(`Follow-up detected`);
      return context;
    }

    // AI classification
    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: this.buildPrompt(originalMessage, history) }],
        temperature: 0.1,
        maxTokens: 64,
      });

      const raw = (response.content ?? '').trim().toUpperCase();
      const intent = this.parseIntent(raw);
      this.logger.debug(`Intent: ${intent} for: "${originalMessage}"`);
      context.intent = intent;
    } catch (err) {
      this.logger.warn(`RouterAgent AI failed: ${(err as Error).message}`);
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

    return `You are a router for an AI shopping assistant. Classify the user's latest message into EXACTLY ONE category.

${recentHistory ? `CONVERSATION HISTORY:\n${recentHistory}\n` : ''}LATEST MESSAGE: "${message}"

CATEGORIES:
- PRODUCT_SEARCH: User wants to find/buy products. e.g. "best laptop under 80k", "I need a phone", "gaming laptop"
- PRODUCT_COMPARE: Compare specific named products. e.g. "ASUS vs Dell", "compare iPhone and Samsung"
- PRODUCT_DETAILS: Details about one product. e.g. "tell me more about MacBook", "specs of Dell XPS"
- FOLLOWUP_SEARCH: Refining previous results. e.g. "only ASUS", "increase budget", "which is cheapest?"
- CLARIFICATION: User's request is too vague to search meaningfully. e.g. "I need something good", "show me a laptop" with no other info
- WISHLIST_ADD: Save a product. e.g. "add to wishlist", "save this", "save the Dell one"
- WISHLIST_VIEW: View saved items. e.g. "show my wishlist", "what did I save?"
- RECOMMENDATIONS: View AI recommendations. e.g. "show my recommendations", "what did you recommend?"
- GENERAL: Greetings, general tech questions, anything else. e.g. "hi", "what specs should I look for?"

RULES:
- CLARIFICATION only when truly impossible to search (completely vague, no product type)
- If product type is mentioned (laptop, phone, etc.), use PRODUCT_SEARCH not CLARIFICATION
- For follow-ups on previous products, use FOLLOWUP_SEARCH
- Greetings are always GENERAL

Reply with ONLY the category name.`;
  }

  private parseIntent(raw: string): AgentIntent {
    const intents: AgentIntent[] = [
      'PRODUCT_SEARCH', 'PRODUCT_COMPARE', 'PRODUCT_DETAILS',
      'FOLLOWUP_SEARCH', 'CLARIFICATION',
      'WISHLIST_ADD', 'WISHLIST_VIEW',
      'RECOMMENDATIONS', 'GENERAL',
    ];
    return intents.find((i) => raw.includes(i)) ?? 'GENERAL';
  }

  /**
   * Detect when the user is answering a clarification question the agent asked.
   * e.g. Agent: "What's your budget?" → User: "under 1 lakh" → PRODUCT_SEARCH
   */
  private detectClarificationAnswer(
    message: string,
    history: AgentContext['history'],
  ): boolean {
    // Check if the last assistant message was a clarification question
    const lastAssistant = [...history].reverse().find((h) => h.role === 'assistant');
    if (!lastAssistant) return false;

    const lastMsg = lastAssistant.content.toLowerCase();
    const isClarificationQuestion =
      lastMsg.includes("what's your budget") ||
      lastMsg.includes("what is your budget") ||
      lastMsg.includes("budget for") ||
      lastMsg.includes("could you share") ||
      lastMsg.includes("what will you primarily use") ||
      lastMsg.includes("what would you use") ||
      lastMsg.includes("what type of") ||
      (lastMsg.includes('?') && lastMsg.length < 200 && lastMsg.includes('budget'));

    if (!isClarificationQuestion) return false;

    // Check if the user's reply looks like an answer (budget, use case, etc.)
    const lower = message.toLowerCase().trim();
    const looksLikeAnswer =
      /under|below|above|around|₹|rs\.|rupee|lakh|k\b|thousand|budget|no limit|any budget/i.test(lower) ||
      /gaming|design|coding|development|college|school|office|work|study|flutter|android/i.test(lower) ||
      /yes|no|okay|ok|sure|any|doesn't matter|not sure/i.test(lower);

    return looksLikeAnswer;
  }

  private detectWishlistIntent(message: string): AgentIntent | null {
    const lower = message.toLowerCase().trim();
    if (/show (my )?wishlist|view (my )?wishlist|what('s| is| did i) (in |in my |i )?save/i.test(lower)) {
      return 'WISHLIST_VIEW';
    }
    if (/(add|save|put).*(wishlist|wish list|later|saved)/i.test(lower) ||
        /^(save|add) (this|it|the (first|second|third|top))/i.test(lower)) {
      return 'WISHLIST_ADD';
    }
    return null;
  }

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

    // Use-case change → needs new search, not a simple follow-up
    const hasUseCaseChange = /for\s+(gaming|game|graphic[\s-]*design|web[\s-]*dev|development|coding|programming|video[\s-]*editing|photography|business|flutter|android|study|work|office)/i.test(lower);
    if (hasUseCaseChange) return false;

    const patterns = [
      /^(which|what).*(best|cheapest|expensive|recommended|good)/,
      /^(in these|among these|from these|out of these)/,
      /^(only|just|show only|filter).+(brand|asus|dell|lenovo|apple|samsung|sony|hp|acer|msi|oneplus|google)/,
      /^(increase|decrease|change).*(budget|price|range)/,
      /^(compare these|compare them|compare all)/,
      /^(tell me more|more details|details about).*(first|second|third|this|that)/,
      /^(sort|order|rank).*(price|rating|score)/,
      /^(what about|how about).*(first|second|third)/,
      /^(the (first|second|third) one)/,
      /^(show|give).*(cheaper|expensive|budget|premium)/,
    ];
    return patterns.some((p) => p.test(lower));
  }

  private keywordClassify(message: string): AgentIntent | null {
    const lower = message.toLowerCase().trim();
    if (/^(hi|hello|hey|how are you|what can you do|thanks|thank you)/.test(lower)) return 'GENERAL';
    if (/\bvs\b|\bversus\b|\bcompare\b|difference between/.test(lower)) return 'PRODUCT_COMPARE';
    if (/show (my )?wishlist/.test(lower)) return 'WISHLIST_VIEW';
    if (/(add|save).*(wishlist|later)/.test(lower)) return 'WISHLIST_ADD';
    if (/my recommendations|saved recommendations/.test(lower)) return 'RECOMMENDATIONS';
    if (/under|below|budget|₹|rs\.|rupee|laptop|phone|mobile|tablet|headphone|camera|tv|monitor|power.?bank/.test(lower) ||
        /need|want|buy|looking for|suggest|recommend|find me|show me|best/.test(lower)) {
      return 'PRODUCT_SEARCH';
    }
    return null;
  }

  private extractUUIDs(message: string): string[] {
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
    return message.match(uuidPattern) ?? [];
  }
}
