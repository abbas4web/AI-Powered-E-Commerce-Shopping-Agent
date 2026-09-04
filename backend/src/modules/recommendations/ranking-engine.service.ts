import { Injectable } from '@nestjs/common';

/**
 * Deterministic Ranking Engine
 *
 * Final Score = weighted sum of:
 *   35% Requirement Match
 *   25% Performance Score (derived from specs)
 *   15% User Rating
 *   10% Price Value (how far under budget)
 *   10% Review Sentiment (0–1)
 *   5%  Popularity (review count, view count)
 *
 * Weights are configurable via RANKING_WEIGHTS.
 * The AI never drives this calculation — it is purely deterministic.
 */

export interface RankingWeights {
  requirementMatch: number; // 0–1
  performance: number;
  rating: number;
  priceValue: number;
  reviewSentiment: number;
  popularity: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  requirementMatch: 0.35,
  performance: 0.25,
  rating: 0.15,
  priceValue: 0.10,
  reviewSentiment: 0.10,
  popularity: 0.05,
};

export interface ProductRankingInput {
  productId: string;
  requirementMatchScore: number; // 0–100
  performanceScore: number;      // 0–100
  rating: number;                // 0–5
  price: number;
  budgetMax: number;
  reviewSentiment: number;       // 0–1
  reviewCount: number;
  viewCount: number;
}

export interface RankedProduct {
  productId: string;
  finalScore: number;            // 0–100
  breakdown: {
    requirementMatch: number;
    performance: number;
    rating: number;
    priceValue: number;
    reviewSentiment: number;
    popularity: number;
  };
}

@Injectable()
export class RankingEngineService {
  rank(
    products: ProductRankingInput[],
    weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
  ): RankedProduct[] {
    const maxReviewCount = Math.max(...products.map((p) => p.reviewCount), 1);
    const maxViewCount = Math.max(...products.map((p) => p.viewCount), 1);

    const ranked = products.map((p) => {
      const ratingScore = (p.rating / 5) * 100;

      // Price value: 100 if at budget, > 100 would be out of range (clamped to 0)
      const priceValueScore = p.budgetMax > 0
        ? Math.max(0, ((p.budgetMax - p.price) / p.budgetMax) * 100)
        : 50;

      const sentimentScore = p.reviewSentiment * 100;

      const popularityScore =
        ((p.reviewCount / maxReviewCount) * 0.6 + (p.viewCount / maxViewCount) * 0.4) * 100;

      const finalScore =
        p.requirementMatchScore * weights.requirementMatch +
        p.performanceScore * weights.performance +
        ratingScore * weights.rating +
        priceValueScore * weights.priceValue +
        sentimentScore * weights.reviewSentiment +
        popularityScore * weights.popularity;

      return {
        productId: p.productId,
        finalScore: Math.round(Math.min(100, Math.max(0, finalScore))),
        breakdown: {
          requirementMatch: Math.round(p.requirementMatchScore),
          performance: Math.round(p.performanceScore),
          rating: Math.round(ratingScore),
          priceValue: Math.round(priceValueScore),
          reviewSentiment: Math.round(sentimentScore),
          popularity: Math.round(popularityScore),
        },
      };
    });

    return ranked.sort((a, b) => b.finalScore - a.finalScore);
  }
}
