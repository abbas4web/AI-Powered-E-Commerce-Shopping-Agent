import { Injectable } from '@nestjs/common';
import {
  RankingEngineService,
  ProductRankingInput,
} from '../../recommendations/ranking-engine.service';
import { AppLogger } from '../../../common/logger/logger.service';
import {
  AgentContext,
  IAgent,
  RankedProduct,
  SlimProduct,
} from './agent.types';

/**
 * RankingAgent — deterministic product scoring.
 *
 * Responsibilities:
 * 1. Convert SlimProduct[] to ProductRankingInput[]
 * 2. Compute requirementMatchScore and performanceScore from product data
 * 3. Call RankingEngineService.rank() — pure math, no AI
 * 4. Enrich results with matchedRequirements and warnings
 * 5. Populate context.rankedProducts
 *
 * This agent NEVER calls an AI model.
 * All scores are derived deterministically from the data.
 */
@Injectable()
export class RankingAgent implements IAgent {
  private readonly logger = new AppLogger('RankingAgent');

  constructor(private readonly rankingEngine: RankingEngineService) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { searchResults, requirements } = context;

    if (!searchResults?.length) {
      context.rankedProducts = [];
      return context;
    }

    const budgetMax = requirements?.maxPrice ?? 0;

    // Build ranking inputs
    const inputs: ProductRankingInput[] = searchResults.map((product) => ({
      productId: product.id,
      requirementMatchScore: this.computeRequirementMatchScore(product, context),
      performanceScore: this.computePerformanceScore(product),
      rating: product.rating,
      price: product.price,
      budgetMax,
      reviewSentiment: 0.7, // Default until Phase 11 review intelligence
      reviewCount: product.reviewCount,
      viewCount: product.viewCount,
    }));

    const ranked = this.rankingEngine.rank(inputs);

    // Merge ranking results with product data
    context.rankedProducts = ranked.map((r) => {
      const product = searchResults.find((p) => p.id === r.productId)!;
      return {
        productId: r.productId,
        name: product.name,
        price: product.price,
        brand: product.brand,
        imageUrl: product.imageUrl,
        score: r.finalScore,
        breakdown: r.breakdown,
        matchedRequirements: this.buildMatchedRequirements(product, context),
        warnings: this.buildWarnings(product, context),
      } satisfies RankedProduct;
    });

    this.logger.debug(
      `Ranked ${context.rankedProducts.length} products. Top: ${context.rankedProducts[0]?.name} (${context.rankedProducts[0]?.score})`,
    );

    return context;
  }

  // ─── Scoring helpers ───────────────────────────────────────────────────────

  /**
   * Compute how well this product matches the user's stated requirements.
   * Score 0–100.
   */
  private computeRequirementMatchScore(
    product: SlimProduct,
    context: AgentContext,
  ): number {
    const req = context.requirements;
    if (!req) return 70; // default if no requirements

    let score = 60; // base score
    const specs = product.specifications;
    const nameLower = product.name.toLowerCase();
    const descLower = product.description.toLowerCase();

    // Budget compliance
    if (req.maxPrice && product.price <= req.maxPrice) score += 15;
    if (req.minPrice && product.price >= req.minPrice) score += 5;

    // Brand match
    if (req.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
      score += 10;
    }

    // Use case match (check name + description)
    const useCases = req.useCases ?? [];
    for (const useCase of useCases) {
      const uc = useCase.toLowerCase();
      if (nameLower.includes(uc) || descLower.includes(uc)) score += 5;
    }

    // Must-have features (check specs + description)
    const features = req.mustHaveFeatures ?? [];
    for (const feature of features) {
      const f = feature.toLowerCase();
      if (
        descLower.includes(f) ||
        nameLower.includes(f) ||
        JSON.stringify(specs).toLowerCase().includes(f)
      ) {
        score += 5;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Compute a performance score based on specs.
   * Higher specs → higher score.
   * Score 0–100.
   */
  private computePerformanceScore(product: SlimProduct): number {
    const specs = product.specifications as Record<string, unknown>;
    let score = 50; // base

    // RAM (laptops/phones)
    const ram = specs.ram as number | undefined;
    if (ram) {
      if (ram >= 32) score += 25;
      else if (ram >= 16) score += 20;
      else if (ram >= 8) score += 10;
    }

    // Storage
    const storage = specs.storage as number | undefined;
    if (storage) {
      if (storage >= 1000) score += 15;
      else if (storage >= 512) score += 10;
      else if (storage >= 256) score += 5;
    }

    // Battery life (Wh — laptops)
    const battery = specs.battery as { capacity?: number; life?: number } | undefined;
    if (battery?.life) {
      if (battery.life >= 12) score += 10;
      else if (battery.life >= 8) score += 7;
      else if (battery.life >= 6) score += 3;
    }

    // Rating bonus
    if (product.rating >= 4.5) score += 5;
    else if (product.rating >= 4.0) score += 3;

    return Math.min(100, score);
  }

  private buildMatchedRequirements(
    product: SlimProduct,
    context: AgentContext,
  ): string[] {
    const matched: string[] = [];
    const req = context.requirements;
    if (!req) return matched;

    if (req.maxPrice && product.price <= req.maxPrice) matched.push('budget');
    if (req.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
      matched.push('brand');
    }

    const specs = product.specifications as Record<string, unknown>;
    const descLower = product.description.toLowerCase();

    for (const useCase of req.useCases ?? []) {
      if (descLower.includes(useCase.toLowerCase())) matched.push(useCase);
    }

    for (const feature of req.mustHaveFeatures ?? []) {
      if (JSON.stringify(specs).toLowerCase().includes(feature.toLowerCase())) {
        matched.push(feature);
      }
    }

    // Generic matches
    if ((specs.ram as number) >= 16) matched.push('16GB RAM');
    if (product.rating >= 4.2) matched.push('high rating');

    return [...new Set(matched)]; // deduplicate
  }

  private buildWarnings(
    product: SlimProduct,
    context: AgentContext,
  ): string[] {
    const warnings: string[] = [];
    const req = context.requirements;
    if (!req) return warnings;

    if (req.maxPrice && product.price > req.maxPrice) {
      warnings.push(`₹${(product.price - req.maxPrice).toLocaleString('en-IN')} over budget`);
    }

    const specs = product.specifications as Record<string, unknown>;
    const battery = specs.battery as { life?: number } | undefined;
    if (battery?.life && battery.life < 6) {
      warnings.push('short battery life (<6h)');
    }

    return warnings;
  }
}
