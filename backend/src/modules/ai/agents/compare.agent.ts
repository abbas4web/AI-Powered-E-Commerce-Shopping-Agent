import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider } from '../interfaces/ai-provider.interface';
import { ComparisonsService } from '../../comparisons/comparisons.service';
import { SearchService } from '../../search/search.service';
import { AppLogger } from '../../../common/logger/logger.service';
import { AgentContext, ComparisonResult, IAgent } from './agent.types';

/**
 * CompareAgent — handles product comparison requests.
 *
 * Responsibilities:
 * 1. If product IDs are known (from RouterAgent), call ComparisonsService.compare() directly
 * 2. If product names are mentioned (e.g. "ASUS vs Dell"), search for them first
 * 3. Build the comparison matrix
 * 4. Populate context.comparisonResult
 */
@Injectable()
export class CompareAgent implements IAgent {
  private readonly logger = new AppLogger('CompareAgent');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly comparisonsService: ComparisonsService,
    private readonly searchService: SearchService,
  ) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { originalMessage, mentionedProductIds } = context;

    let productIds = mentionedProductIds ?? [];

    // If no UUIDs found in message, search for the mentioned product names
    if (productIds.length < 2) {
      productIds = await this.resolveProductIdsFromMessage(originalMessage);
    }

    if (productIds.length < 2) {
      // Not enough products to compare — fall back to search
      this.logger.debug('CompareAgent: not enough products found, falling back to search');
      context.intent = 'PRODUCT_SEARCH';
      return context;
    }

    try {
      const result = await this.comparisonsService.compare(productIds.slice(0, 4));

      context.comparisonResult = {
        products: result.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          brand: typeof p.brand === 'object' && p.brand !== null
            ? (p.brand as { name: string }).name
            : String(p.brand ?? ''),
          rating: p.rating,
          imageUrl: p.imageUrl,
        })),
        matrix: result.comparisonMatrix.map((row) => ({
          attribute: row.attribute,
          values: row.values,
        })),
      } satisfies ComparisonResult;

      this.logger.debug(`Comparison built for ${productIds.length} products`);
    } catch (err) {
      this.logger.warn(`CompareAgent failed: ${(err as Error).message}`);
      context.intent = 'PRODUCT_SEARCH';
    }

    return context;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Extract product names from the message and search for their IDs.
   * e.g. "compare ASUS Vivobook vs Dell Inspiron"
   */
  private async resolveProductIdsFromMessage(message: string): Promise<string[]> {
    // Extract product name candidates using AI
    try {
      const response = await this.aiProvider.generate({
        messages: [{
          role: 'user',
          content: `Extract the product names being compared from this message.
Message: "${message}"
Return ONLY a JSON array of product names, e.g. ["ASUS Vivobook 16", "Dell Inspiron 15"]
Return [] if no specific products are named.`,
        }],
        temperature: 0.1,
        maxTokens: 128,
      });

      const raw = (response.content ?? '')
        .replace(/```json?\s*/gi, '')
        .replace(/```/g, '')
        .trim();

      if (raw.startsWith('[')) {
        const names = JSON.parse(raw) as string[];
        const ids: string[] = [];

        for (const name of names.slice(0, 4)) {
          // Use direct Prisma search by name — bypass category auto-detection
          const found = await this.findProductByName(name);
          if (found) ids.push(found);
        }

        return ids;
      }
    } catch (err) {
      this.logger.warn(`Product name resolution failed: ${(err as Error).message}`);
    }

    return [];
  }

  /** Search for a product by name fragments — bypasses category auto-detection */
  private async findProductByName(name: string): Promise<string | null> {
    // Use the 2-3 most distinctive words from the name
    const keywords = name
      .replace(/[()]/g, '')
      .split(' ')
      .filter((w) => w.length > 2)
      .slice(0, 3)
      .join(' ');

    const results = await this.searchService.searchProductsByName(keywords);
    type PrismaProduct = { id: string };
    return (results[0] as PrismaProduct)?.id ?? null;
  }
}
