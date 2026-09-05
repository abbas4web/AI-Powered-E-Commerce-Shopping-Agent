export interface RankingWeights {
    requirementMatch: number;
    performance: number;
    rating: number;
    priceValue: number;
    reviewSentiment: number;
    popularity: number;
}
export declare const DEFAULT_RANKING_WEIGHTS: RankingWeights;
export interface ProductRankingInput {
    productId: string;
    requirementMatchScore: number;
    performanceScore: number;
    rating: number;
    price: number;
    budgetMax: number;
    reviewSentiment: number;
    reviewCount: number;
    viewCount: number;
}
export interface RankedProduct {
    productId: string;
    finalScore: number;
    breakdown: {
        requirementMatch: number;
        performance: number;
        rating: number;
        priceValue: number;
        reviewSentiment: number;
        popularity: number;
    };
}
export declare class RankingEngineService {
    rank(products: ProductRankingInput[], weights?: RankingWeights): RankedProduct[];
}
