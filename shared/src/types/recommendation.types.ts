import { ProductSummary } from './product.types';

export interface Recommendation {
  id: string;
  userId: string;
  productId: string;
  score: number;
  reason: string;
  matchedRequirements: string[];
  conversationId: string | null;
  product: ProductSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RankingBreakdown {
  requirementMatch: number;
  performance: number;
  rating: number;
  priceValue: number;
  reviewSentiment: number;
  popularity: number;
}
