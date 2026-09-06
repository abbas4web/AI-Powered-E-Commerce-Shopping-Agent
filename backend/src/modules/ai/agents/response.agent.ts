import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider } from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';
import { AgentContext, IAgent, RankedProduct, SlimProduct } from './agent.types';

/**
 * ResponseAgent — writes the final human-readable message.
 *
 * Responsibilities:
 * 1. Receive fully ranked/compared data from previous agents
 * 2. Generate a friendly, accurate response
 * 3. Produce follow-up questions
 * 4. Populate context.finalMessage and context.followUpQuestions
 *
 * The AI here only writes text — it never decides which products to show.
 * All product selection and ranking has already been done deterministically.
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
      case 'PRODUCT_COMPARE':
        return this.handleCompareResponse(context);
      case 'PRODUCT_DETAILS':
        return this.handleDetailsResponse(context);
      case 'GENERAL':
        return this.handleGeneralResponse(context);
      default:
        return this.handleSearchResponse(context);
    }
  }

  // ─── Response handlers ─────────────────────────────────────────────────────

  private async handleSearchResponse(context: AgentContext): Promise<AgentContext> {
    const { rankedProducts, requirements, originalMessage } = context;

    if (!rankedProducts?.length) {
      context.finalMessage = this.buildNoResultsMessage(requirements?.query ?? originalMessage, requirements?.maxPrice);
      context.followUpQuestions = [
        'Would you like to increase your budget?',
        'Can I search for a different product type?',
      ];
      return context;
    }

    // Build a concise product summary for the AI to write about
    const productSummary = rankedProducts
      .map((p, i) =>
        `${i + 1}. ${p.name} (${p.brand}) — ₹${p.price.toLocaleString('en-IN')} | Score: ${p.score}/100\n` +
        `   Matched: ${p.matchedRequirements.join(', ') || 'general match'}\n` +
        `   ${p.warnings.length ? `⚠ ${p.warnings.join(', ')}` : ''}`,
      )
      .join('\n\n');

    const budget = requirements?.maxPrice
      ? `under ₹${requirements.maxPrice.toLocaleString('en-IN')}`
      : '';

    const prompt = `You are SmartShop AI, a helpful Indian e-commerce shopping assistant.

A user asked: "${originalMessage}"
${budget ? `Budget: ${budget}` : ''}

Here are the matching products (already ranked by our scoring system):

${productSummary}

Write a helpful, conversational response that:
1. Acknowledges the user's request
2. Briefly introduces ALL ${rankedProducts.length} products by name and price
3. Highlights the top recommendation with a reason
4. Mentions key specs/features that matter for their use case
5. Is friendly, concise, and easy to read

Keep it under 200 words. Write plain text only — no markdown, no JSON, no bullet points with dashes.`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        maxTokens: 512,
      });
      context.finalMessage = response.content ?? this.buildFallbackMessage(rankedProducts);
    } catch (err) {
      this.logger.warn(`ResponseAgent AI call failed: ${(err as Error).message}`);
      context.finalMessage = this.buildFallbackMessage(rankedProducts);
    }

    context.followUpQuestions = this.buildFollowUpQuestions(context);
    return context;
  }

  private async handleCompareResponse(context: AgentContext): Promise<AgentContext> {
    const { comparisonResult, originalMessage } = context;

    if (!comparisonResult?.products.length) {
      context.finalMessage = "I couldn't find the products you want to compare. Please mention the product names or IDs.";
      context.followUpQuestions = ['Which products would you like to compare?'];
      return context;
    }

    const productNames = comparisonResult.products.map((p) => `${p.name} — ₹${p.price.toLocaleString('en-IN')}`).join(', ');
    const keySpecs = comparisonResult.matrix.slice(0, 6)
      .map((row) => {
        const vals = row.values.map((v) => {
          const prod = comparisonResult.products.find((p) => p.id === v.productId);
          const val = typeof v.value === 'object' ? JSON.stringify(v.value) : String(v.value ?? '—');
          return `${prod?.name?.split(' ')[0]}: ${val}`;
        }).join(' | ');
        return `${row.attribute}: ${vals}`;
      })
      .join('\n');

    const prompt = `You are SmartShop AI. Compare these products for the user.

User asked: "${originalMessage}"

Products: ${productNames}

Key specs comparison:
${keySpecs}

Write a concise comparison (under 150 words) explaining:
1. The key differences between the products
2. Which is better for what use case
3. Your recommendation

Plain text only.`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        maxTokens: 384,
      });
      context.finalMessage = response.content ?? `Here's a comparison of ${productNames}.`;
    } catch {
      context.finalMessage = `I found ${comparisonResult.products.length} products to compare. Check the comparison table below.`;
    }

    context.followUpQuestions = ['Would you like to add one of these to your wishlist?'];
    return context;
  }

  private async handleDetailsResponse(context: AgentContext): Promise<AgentContext> {
    const { rankedProducts, originalMessage } = context;

    if (!rankedProducts?.length) {
      context.finalMessage = "I couldn't find that product. Could you give me more details or the product name?";
      return context;
    }

    const product = rankedProducts[0];
    context.finalMessage = `Here are the details for the **${product.name}** by ${product.brand}:\n\nPriced at ₹${product.price.toLocaleString('en-IN')} with a rating of ${product.score}/100 on our system. ${product.matchedRequirements.length ? `It matches: ${product.matchedRequirements.join(', ')}.` : ''}`;
    context.followUpQuestions = ['Would you like to compare this with similar products?', 'Want to add this to your wishlist?'];
    return context;
  }

  private async handleGeneralResponse(context: AgentContext): Promise<AgentContext> {
    const { originalMessage, history } = context;

    const recentHistory = history.slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: `${recentHistory ? recentHistory + '\n' : ''}user: ${originalMessage}` }],
        systemPrompt: `You are SmartShop AI, a friendly shopping assistant for an Indian e-commerce platform. 
Help users find products. If they ask about products, ask for their budget and requirements.
Keep responses concise and helpful. Never make up product information.`,
        temperature: 0.6,
        maxTokens: 256,
      });
      context.finalMessage = response.content ?? "Hello! I'm SmartShop AI. How can I help you find the perfect product today?";
    } catch {
      context.finalMessage = "Hello! I'm SmartShop AI. Tell me what you're looking for and I'll find the best options for you!";
    }

    context.followUpQuestions = [];
    return context;
  }

  // ─── Fallback message builders ────────────────────────────────────────────

  private buildNoResultsMessage(query: string, maxPrice?: number): string {
    const budgetText = maxPrice ? ` under ₹${maxPrice.toLocaleString('en-IN')}` : '';
    return `I couldn't find any ${query}${budgetText} in our catalog right now. You could try increasing your budget, searching for a similar product, or check back later as we add new products regularly.`;
  }

  private buildFallbackMessage(products: RankedProduct[]): string {
    const lines = products
      .map((p, i) => `${i + 1}. ${p.name} by ${p.brand} — ₹${p.price.toLocaleString('en-IN')} (Score: ${p.score}/100)`)
      .join('\n');
    return `Here are the best matching products:\n\n${lines}`;
  }

  private buildFollowUpQuestions(context: AgentContext): string[] {
    const questions: string[] = [];
    const { requirements, rankedProducts } = context;

    if (requirements?.maxPrice && rankedProducts?.some((p) => p.warnings.some((w) => w.includes('over budget')))) {
      questions.push(`Would you like to increase your budget?`);
    }

    if (!requirements?.brandName) {
      questions.push('Do you have a preferred brand?');
    }

    if (!requirements?.useCases?.length) {
      questions.push('What will you primarily use this for?');
    }

    return questions.slice(0, 2); // max 2 follow-up questions
  }
}
