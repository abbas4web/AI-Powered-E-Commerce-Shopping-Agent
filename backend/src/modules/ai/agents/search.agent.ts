import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider } from '../interfaces/ai-provider.interface';
import { SearchService } from '../../search/search.service';
import { AppLogger } from '../../../common/logger/logger.service';
import {
  AgentContext,
  ExtractedRequirements,
  IAgent,
  SlimProduct,
} from './agent.types';

/**
 * SearchAgent — extracts structured requirements then queries the database.
 *
 * Responsibilities:
 * 1. Parse the user message into structured requirements (query, budget, brand)
 * 2. Call SearchService.searchProducts() — the only DB interaction in the pipeline
 * 3. Map raw Prisma results to SlimProduct[]
 * 4. Populate context.requirements and context.searchResults
 *
 * The AI is used ONLY for requirement extraction (short, focused call).
 * It never touches the database directly.
 */
@Injectable()
export class SearchAgent implements IAgent {
  private readonly logger = new AppLogger('SearchAgent');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly searchService: SearchService,
  ) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { originalMessage, history } = context;

    // ── Step 1: Extract structured requirements ──────────────────────────────
    const requirements = await this.extractRequirements(originalMessage, history);
    context.requirements = requirements;
    this.logger.debug(`Extracted: ${JSON.stringify(requirements)}`);

    // ── Step 2: Search the database deterministically ────────────────────────
    // For use-case queries like "gaming laptop", also pass the use-case as part
    // of the query so gaming-specific laptops (with "gaming" in name/description)
    // are included alongside category-filtered results.
    const useCaseQuery = requirements.useCases?.length
      ? `${requirements.query} ${requirements.useCases[0]}`
      : requirements.query;

    const result = await this.searchService.searchProducts({
      query: useCaseQuery,
      minPrice: requirements.minPrice,
      maxPrice: requirements.maxPrice,
      brandName: requirements.brandName,
      limit: 10,
    });

    this.logger.debug(`Found ${result.total} products for query: "${useCaseQuery}"`);

    // ── Step 3: Map to SlimProduct ───────────────────────────────────────────
    type PrismaProduct = {
      id: string;
      name: string;
      price: number;
      originalPrice?: number | null;
      rating: number;
      reviewCount: number;
      viewCount: number;
      description: string;
      specifications: unknown;
      imageUrl?: string | null;
      brand?: { name: string };
      category?: { name: string };
    };

    context.searchResults = (result.items as PrismaProduct[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      brand: p.brand?.name ?? 'Unknown',
      category: p.category?.name ?? 'Unknown',
      rating: p.rating,
      reviewCount: p.reviewCount,
      viewCount: p.viewCount,
      description: (p.description ?? '').slice(0, 200),
      specifications: (p.specifications as Record<string, unknown>) ?? {},
      imageUrl: p.imageUrl,
    }));

    context.totalFound = result.total;
    return context;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private async extractRequirements(
    message: string,
    history: AgentContext['history'],
  ): Promise<ExtractedRequirements> {
    // Include last 4 history turns — critical for answering clarifications
    // e.g. history has "i need laptop", current message is "under 1lakh"
    const recentHistory = history.slice(-4)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `Extract shopping requirements from this conversation and return ONLY a JSON object.

${recentHistory ? `Recent conversation:\n${recentHistory}\n` : ''}Current message: "${message}"

IMPORTANT: If the current message is answering a previous question (e.g. agent asked about budget and user replied "under 1 lakh"), combine the context from the conversation history with the current reply to extract complete requirements.

Return JSON (include only what is explicitly mentioned):
{
  "query": "product type as keywords (e.g. laptop, smartphone, headphones)",
  "maxPrice": number (max budget in INR — convert: 1 lakh = 100000, 80k = 80000),
  "minPrice": number (min price if mentioned),
  "brandName": "brand name if specified",
  "useCases": ["array of use cases if mentioned"],
  "mustHaveFeatures": ["key features if mentioned"]
}

Examples:
"I need laptop under 80k for Flutter" → {"query":"laptop","maxPrice":80000,"useCases":["Flutter development"]}
"under 1 lakh" (after "I need laptop") → {"query":"laptop","maxPrice":100000}
"under 50000" (after "I need phone") → {"query":"smartphone","maxPrice":50000}
"no budget limit" (after "I need gaming laptop") → {"query":"laptop","useCases":["gaming"]}

Return ONLY the JSON. No explanation.`;

    try {
      const response = await this.aiProvider.generate({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        maxTokens: 256,
      });

      const raw = (response.content ?? '')
        .replace(/```json\s*/gi, '')
        .replace(/```/g, '')
        .trim();

      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw) as Partial<ExtractedRequirements>;
        return {
          query: parsed.query ?? this.inferQueryFromHistory(message, history),
          minPrice: parsed.minPrice,
          maxPrice: parsed.maxPrice,
          brandName: parsed.brandName,
          useCases: parsed.useCases,
          mustHaveFeatures: parsed.mustHaveFeatures,
        };
      }
    } catch (err) {
      this.logger.warn(`Requirement extraction failed: ${(err as Error).message}`);
    }

    return { query: this.inferQueryFromHistory(message, history) };
  }

  /** When current message is just a budget/use-case answer, infer product type from history */
  private inferQueryFromHistory(message: string, history: AgentContext['history']): string {
    const productTypes = ['laptop', 'phone', 'smartphone', 'tablet', 'headphone', 'earbuds', 'camera', 'tv', 'monitor', 'power bank'];
    for (const turn of [...history].reverse()) {
      const lower = turn.content.toLowerCase();
      for (const type of productTypes) {
        if (lower.includes(type)) return type;
      }
    }
    return message;
  }
}
