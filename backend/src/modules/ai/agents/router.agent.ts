import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider } from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';
import { AgentContext, AgentIntent, IAgent } from './agent.types';

/**
 * RouterAgent — the pipeline's entry point.
 *
 * Responsibilities:
 * 1. Classify the user's intent into one of the AgentIntent types
 * 2. Extract any product IDs mentioned (for compare/details intents)
 * 3. Set context.intent so the orchestrator routes to the correct next agent
 *
 * Uses a very short, focused AI call (max 128 tokens) — no search, no tools.
 * Falls back to keyword matching if the AI call fails.
 */
@Injectable()
export class RouterAgent implements IAgent {
  private readonly logger = new AppLogger('RouterAgent');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
  ) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { originalMessage } = context;

    // Fast keyword pre-check — avoids an AI call for obvious cases
    const fastIntent = this.fastClassify(originalMessage);
    if (fastIntent) {
      this.logger.debug(`Fast-classified intent: ${fastIntent}`);
      context.intent = fastIntent;
      context.mentionedProductIds = this.extractProductIds(originalMessage);
      return context;
    }

    // AI classification for ambiguous messages
    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: this.buildPrompt(originalMessage) }],
        temperature: 0.1,
        maxTokens: 64,
      });

      const raw = (response.content ?? '').trim().toUpperCase();
      const intent = this.parseIntent(raw);
      this.logger.debug(`AI-classified intent: ${intent} (raw: "${raw}")`);
      context.intent = intent;
    } catch (err) {
      this.logger.warn(`RouterAgent AI call failed, using keyword fallback: ${(err as Error).message}`);
      context.intent = 'PRODUCT_SEARCH'; // safe default
    }

    context.mentionedProductIds = this.extractProductIds(originalMessage);
    return context;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private buildPrompt(message: string): string {
    return `Classify this shopping assistant message into exactly one category.

Message: "${message}"

Categories:
- PRODUCT_SEARCH: user wants to find/buy products (includes "best X", "under budget", "I need X")
- PRODUCT_COMPARE: user wants to compare specific products ("X vs Y", "compare X and Y", "difference between")
- PRODUCT_DETAILS: user asks about a specific named product ("tell me about X", "specs of X")
- WISHLIST: user wants to save/view wishlist ("add to wishlist", "show my wishlist")
- RECOMMENDATIONS: user asks for saved recommendations ("show my recommendations")
- GENERAL: greetings, help questions, everything else

Reply with ONLY the category name, nothing else.`;
  }

  private parseIntent(raw: string): AgentIntent {
    const validIntents: AgentIntent[] = [
      'PRODUCT_SEARCH',
      'PRODUCT_COMPARE',
      'PRODUCT_DETAILS',
      'WISHLIST',
      'RECOMMENDATIONS',
      'GENERAL',
    ];
    const found = validIntents.find((i) => raw.includes(i));
    return found ?? 'PRODUCT_SEARCH';
  }

  /** Fast keyword-based classification for obvious cases — saves AI tokens */
  private fastClassify(message: string): AgentIntent | null {
    const lower = message.toLowerCase().trim();

    // Greetings and general
    if (/^(hi|hello|hey|good\s*(morning|evening|afternoon)|how are you|what can you do|help)/.test(lower)) {
      return 'GENERAL';
    }

    // Compare intent
    if (/\bvs\b|\bversus\b|compare|difference between|which is better/.test(lower)) {
      return 'PRODUCT_COMPARE';
    }

    // Wishlist
    if (/wishlist|wish list|save (this|it)|add to (my )?wish/.test(lower)) {
      return 'WISHLIST';
    }

    // Recommendations
    if (/my recommendations|saved recommendations|show recommendations/.test(lower)) {
      return 'RECOMMENDATIONS';
    }

    // Product search — budget or product type mentioned
    if (
      /under|below|within|budget|₹|rs\.|rupee|laptop|phone|mobile|tablet|headphone|camera|tv|monitor/.test(lower) ||
      /need|want|buy|looking for|suggest|recommend|find me|show me|best/.test(lower)
    ) {
      return 'PRODUCT_SEARCH';
    }

    return null; // Let AI decide
  }

  /** Extract UUIDs or product names from the message for compare/details intent */
  private extractProductIds(message: string): string[] {
    // Match UUID v4 pattern
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
    return message.match(uuidPattern) ?? [];
  }
}
