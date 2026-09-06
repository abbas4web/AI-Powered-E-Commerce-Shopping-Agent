import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider, ChatMessage } from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';
import { AgentContext, IAgent, RankedProduct } from './agent.types';

/**
 * ResponseAgent — writes the final human-readable message.
 *
 * Design principles (per spec):
 * 1. Never say "not found" / "couldn't find" unless truly exhausted
 * 2. Use general LLM knowledge when DB has no matching data
 * 3. Handle follow-up questions using previousSearchResults context
 * 4. Ask clarification only when genuinely needed
 * 5. Combine DB results + general knowledge when useful
 * 6. Give concise answers for simple questions, detailed for complex ones
 */
@Injectable()
export class ResponseAgent implements IAgent {
  private readonly logger = new AppLogger('ResponseAgent');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
  ) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { intent } = context;

    switch (intent) {
      case 'PRODUCT_SEARCH':
        return this.handleSearchResponse(context);
      case 'FOLLOWUP_SEARCH':
        return this.handleFollowUpResponse(context);
      case 'PRODUCT_COMPARE':
        return this.handleCompareResponse(context);
      case 'PRODUCT_DETAILS':
        return this.handleDetailsResponse(context);
      case 'WISHLIST':
        return this.handleWishlistResponse(context);
      case 'RECOMMENDATIONS':
        return this.handleRecommendationsResponse(context);
      case 'GENERAL':
      default:
        return this.handleGeneralResponse(context);
    }
  }

  // ─── Intent handlers ──────────────────────────────────────────────────────

  private async handleSearchResponse(context: AgentContext): Promise<AgentContext> {
    const { rankedProducts, requirements, originalMessage, history } = context;

    if (rankedProducts?.length) {
      // DB has results — generate recommendation from real data
      context.finalMessage = await this.generateSearchResponse(
        originalMessage,
        rankedProducts,
        requirements,
        history,
      );
    } else {
      // DB has NO results — use general knowledge + helpful suggestion
      // Do NOT just say "not found"
      context.finalMessage = await this.generateNoResultsResponse(
        originalMessage,
        requirements,
        history,
      );
    }

    context.followUpQuestions = this.buildFollowUps(context);
    return context;
  }

  private async handleFollowUpResponse(context: AgentContext): Promise<AgentContext> {
    const {
      rankedProducts,
      previousSearchResults,
      comparisonResult,
      originalMessage,
      history,
      requirements,
    } = context;

    // Use current search results if available, fall back to previous turn's results
    const products = rankedProducts?.length ? rankedProducts : previousSearchResults ?? [];

    if (!products.length && !comparisonResult) {
      // No context at all — treat as a new search
      context.intent = 'PRODUCT_SEARCH';
      return this.handleGeneralResponse(context);
    }

    const productContext = products
      .map((p, i) =>
        `${i + 1}. ${p.name} (${p.brand}) — ₹${p.price.toLocaleString('en-IN')} | Score: ${p.score}/100`,
      )
      .join('\n');

    const recentHistory = history.slice(-6)
      .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
      .join('\n');

    const prompt = `You are SmartShop AI, a helpful Indian e-commerce shopping assistant.

CONVERSATION SO FAR:
${recentHistory}

CURRENT PRODUCTS IN CONTEXT:
${productContext}

USER'S FOLLOW-UP: "${originalMessage}"

Answer the follow-up question based on the products above.
- If asked "which is best" → recommend the highest scored one with reasons
- If asked to compare → compare key specs from the list
- If asked to filter (e.g. "only ASUS") → mention only matching products
- If asked to sort → list them in the requested order
- Be specific: mention product names, prices, specs
- Be concise and conversational
- Do NOT search for new products — answer using only the products listed above`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        maxTokens: 512,
      });
      context.finalMessage = response.content ?? this.buildFallbackMessage(products);
    } catch (err) {
      this.logger.warn(`Follow-up response failed: ${(err as Error).message}`);
      context.finalMessage = this.buildFallbackMessage(products);
    }

    // Keep showing previous products in the UI
    if (!rankedProducts?.length && previousSearchResults?.length) {
      context.rankedProducts = previousSearchResults;
    }

    context.followUpQuestions = [];
    return context;
  }

  private async handleCompareResponse(context: AgentContext): Promise<AgentContext> {
    const { comparisonResult, originalMessage, rankedProducts } = context;

    if (!comparisonResult?.products.length) {
      // Fallback: if we have ranked products, compare them as a follow-up
      if ((rankedProducts?.length ?? 0) >= 2) {
        context.intent = 'FOLLOWUP_SEARCH';
        return this.handleFollowUpResponse(context);
      }
      context.finalMessage = "Please mention the specific product names you'd like to compare, e.g. 'Compare ASUS Vivobook vs Dell Inspiron'.";
      context.followUpQuestions = ['Which products would you like to compare?'];
      return context;
    }

    const productList = comparisonResult.products
      .map((p) => `${p.name} (${p.brand}) — ₹${p.price.toLocaleString('en-IN')} | Rating: ${p.rating}`)
      .join('\n');

    const specRows = comparisonResult.matrix.slice(0, 8)
      .map((row) => {
        const vals = row.values
          .map((v) => {
            const prod = comparisonResult.products.find((p) => p.id === v.productId);
            const displayVal = v.value === null ? '—'
              : typeof v.value === 'object' ? JSON.stringify(v.value)
              : String(v.value);
            return `${prod?.name?.split(' ')[0]}: ${displayVal}`;
          })
          .join(' | ');
        return `${row.attribute}: ${vals}`;
      })
      .join('\n');

    const prompt = `You are SmartShop AI. The user wants to compare these products.

User asked: "${originalMessage}"

PRODUCTS:
${productList}

KEY SPECS COMPARISON:
${specRows}

Write a comparison response that:
1. Highlights the key differences (processor, RAM, display, battery, price)
2. Says which product is best for what type of user
3. Gives a clear final recommendation
4. Is conversational and easy to read (under 200 words)

Plain text only. No JSON.`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        maxTokens: 512,
      });
      context.finalMessage = response.content ?? `Here's a comparison of ${comparisonResult.products.map((p) => p.name).join(' vs ')}.`;
    } catch {
      context.finalMessage = `Comparing ${comparisonResult.products.map((p) => p.name).join(' and ')}. Check the comparison table below for full specs.`;
    }

    context.followUpQuestions = ['Would you like to add one of these to your wishlist?'];
    return context;
  }

  private async handleDetailsResponse(context: AgentContext): Promise<AgentContext> {
    const { rankedProducts, originalMessage } = context;

    if (!rankedProducts?.length) {
      context.finalMessage = await this.generateGeneralAnswer(originalMessage, context.history);
      context.followUpQuestions = [];
      return context;
    }

    const product = rankedProducts[0];
    const specs = JSON.stringify(product.breakdown, null, 2);

    const prompt = `You are SmartShop AI. Give detailed info about this product.

User asked: "${originalMessage}"

Product: ${product.name} by ${product.brand}
Price: ₹${product.price.toLocaleString('en-IN')}
Rating: ${product.score}/100
Matched requirements: ${product.matchedRequirements.join(', ') || 'general match'}
${product.warnings.length ? `Warnings: ${product.warnings.join(', ')}` : ''}

Write a detailed but concise product overview (under 150 words). Plain text only.`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        maxTokens: 384,
      });
      context.finalMessage = response.content ?? `${product.name} by ${product.brand} is priced at ₹${product.price.toLocaleString('en-IN')} with a score of ${product.score}/100.`;
    } catch {
      context.finalMessage = `${product.name} by ${product.brand} — ₹${product.price.toLocaleString('en-IN')}. Score: ${product.score}/100.`;
    }

    context.followUpQuestions = [
      'Would you like to compare this with similar products?',
      'Want to add this to your wishlist?',
    ];
    return context;
  }

  private async handleWishlistResponse(context: AgentContext): Promise<AgentContext> {
    context.finalMessage = "To add a product to your wishlist, tap the ❤ button on any product card. You can view your saved items in the Wishlist section.";
    context.followUpQuestions = [];
    return context;
  }

  private async handleRecommendationsResponse(context: AgentContext): Promise<AgentContext> {
    context.finalMessage = "Your personalized recommendations are in the Recommendations section. They're saved from your previous AI conversations.";
    context.followUpQuestions = [];
    return context;
  }

  private async handleGeneralResponse(context: AgentContext): Promise<AgentContext> {
    const { originalMessage, history } = context;

    context.finalMessage = await this.generateGeneralAnswer(originalMessage, history);
    context.followUpQuestions = [];
    return context;
  }

  // ─── AI call helpers ─────────────────────────────────────────────────────

  /**
   * Generate a recommendation response from real DB results.
   * AI writes the text — never decides which products to show.
   */
  private async generateSearchResponse(
    message: string,
    products: RankedProduct[],
    requirements: AgentContext['requirements'],
    history: AgentContext['history'],
  ): Promise<string> {
    const recentHistory = history.slice(-4)
      .map((m) => `${m.role}: ${m.content.slice(0, 150)}`)
      .join('\n');

    const productList = products
      .map((p, i) =>
        `${i + 1}. ${p.name} (${p.brand}) — ₹${p.price.toLocaleString('en-IN')} | Score: ${p.score}/100` +
        (p.matchedRequirements.length ? ` | Matches: ${p.matchedRequirements.join(', ')}` : '') +
        (p.warnings.length ? ` | ⚠ ${p.warnings.join(', ')}` : ''),
      )
      .join('\n');

    const budget = requirements?.maxPrice
      ? `Budget: under ₹${requirements.maxPrice.toLocaleString('en-IN')}`
      : '';

    const prompt = `You are SmartShop AI, a helpful Indian e-commerce shopping assistant.
${recentHistory ? `\nConversation context:\n${recentHistory}\n` : ''}
User asked: "${message}"
${budget}

Products found in our catalog (ranked by relevance):
${productList}

Write a helpful, natural response that:
1. Directly answers the user's question
2. Mentions ALL ${products.length} products by name and price
3. Highlights the top pick with a specific reason
4. Mentions key specs relevant to the user's use case
5. Is friendly and conversational (under 200 words)

Plain text only. No JSON. No markdown headers. No bullet dashes.`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 512,
      });
      return response.content ?? this.buildFallbackMessage(products);
    } catch (err) {
      this.logger.warn(`Search response generation failed: ${(err as Error).message}`);
      return this.buildFallbackMessage(products);
    }
  }

  /**
   * When DB has no results — use general LLM knowledge instead of "not found".
   * Per spec: "Do NOT unnecessarily show not found / couldn't find".
   */
  private async generateNoResultsResponse(
    message: string,
    requirements: AgentContext['requirements'],
    history: AgentContext['history'],
  ): Promise<string> {
    const query = requirements?.query ?? message;
    const budget = requirements?.maxPrice
      ? ` under ₹${requirements.maxPrice.toLocaleString('en-IN')}`
      : '';

    const prompt = `You are SmartShop AI, a helpful Indian e-commerce shopping assistant.

The user asked: "${message}"

Our product catalog doesn't currently have ${query}${budget} in stock.

However, DO NOT just say "not found". Instead:
1. Acknowledge what they're looking for
2. Share useful general knowledge about ${query} if relevant (e.g. what to look for, typical price range in India)
3. Suggest they broaden their search, adjust budget, or check back later
4. If the question is general (not product-specific), answer it using your knowledge
5. Be helpful and specific — not vague

Keep it under 120 words. Plain text only.`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 384,
      });
      return response.content ?? `We don't have ${query}${budget} right now, but I can help you find alternatives. Try adjusting your budget or search terms.`;
    } catch {
      return `We don't have ${query}${budget} in our catalog right now. Try broadening your search or adjusting the budget.`;
    }
  }

  /**
   * General purpose LLM answer — handles greetings, tech questions,
   * how-to questions, anything not product-specific.
   * Per spec: AI should use general knowledge freely.
   */
  private async generateGeneralAnswer(
    message: string,
    history: AgentContext['history'],
  ): Promise<string> {
    const recentHistory = history.slice(-6)
      .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
      .join('\n');

    const messages: ChatMessage[] = [];

    if (recentHistory) {
      messages.push({ role: 'user', content: recentHistory });
    }

    messages.push({ role: 'user', content: message });

    try {
      const response = await this.aiProvider.generate({
        messages,
        systemPrompt: `You are SmartShop AI, a friendly and knowledgeable shopping assistant for an Indian e-commerce platform.

You can:
- Answer general questions about technology, products, and shopping
- Help users decide what to buy based on their needs
- Explain technical specs in simple terms
- Give buying advice based on general knowledge
- Discuss product categories, trends, and recommendations

If the user asks about specific products in our catalog, ask them to use the search.
Keep responses concise and genuinely helpful.
Never make up specific product prices or specs — use general knowledge ranges only.`,
        temperature: 0.6,
        maxTokens: 384,
      });
      return response.content ?? "I'm SmartShop AI. How can I help you find the perfect product?";
    } catch {
      return "I'm SmartShop AI, your shopping assistant. Tell me what you're looking for and I'll find the best options!";
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private buildFallbackMessage(products: RankedProduct[]): string {
    if (!products.length) return "I couldn't find matching products. Try a different search.";
    const lines = products
      .map((p, i) => `${i + 1}. ${p.name} by ${p.brand} — ₹${p.price.toLocaleString('en-IN')} (Score: ${p.score}/100)`)
      .join('\n');
    return `Here are the best matching products:\n\n${lines}`;
  }

  private buildFollowUps(context: AgentContext): string[] {
    const { requirements, rankedProducts } = context;
    const questions: string[] = [];

    if (rankedProducts?.length && !requirements?.brandName) {
      questions.push('Do you have a preferred brand?');
    }
    if (rankedProducts?.length && !requirements?.useCases?.length) {
      questions.push('What will you primarily use this for?');
    }
    if (requirements?.maxPrice && rankedProducts?.some((p) => p.warnings.some((w) => w.includes('over budget')))) {
      questions.push('Would you like to increase your budget?');
    }

    return questions.slice(0, 2);
  }
}
