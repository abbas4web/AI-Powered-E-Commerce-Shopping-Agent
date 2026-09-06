export type AgentIntent = 'PRODUCT_SEARCH' | 'PRODUCT_COMPARE' | 'PRODUCT_DETAILS' | 'FOLLOWUP_SEARCH' | 'WISHLIST' | 'RECOMMENDATIONS' | 'GENERAL';
export interface ExtractedRequirements {
    query: string;
    minPrice?: number;
    maxPrice?: number;
    brandName?: string;
    useCases?: string[];
    mustHaveFeatures?: string[];
}
export interface SlimProduct {
    id: string;
    name: string;
    price: number;
    originalPrice?: number | null;
    brand: string;
    category: string;
    rating: number;
    reviewCount: number;
    viewCount: number;
    description: string;
    specifications: Record<string, unknown>;
    imageUrl?: string | null;
}
export interface RankedProduct {
    productId: string;
    name: string;
    price: number;
    brand: string;
    imageUrl?: string | null;
    score: number;
    breakdown: {
        requirementMatch: number;
        performance: number;
        rating: number;
        priceValue: number;
        reviewSentiment: number;
        popularity: number;
    };
    matchedRequirements: string[];
    warnings: string[];
}
export interface ComparisonResult {
    products: Array<{
        id: string;
        name: string;
        price: number;
        brand: string;
        rating: number;
        imageUrl?: string | null;
    }>;
    matrix: Array<{
        attribute: string;
        values: Array<{
            productId: string;
            value: unknown;
        }>;
    }>;
}
export interface AgentContext {
    userId: string;
    conversationId: string;
    originalMessage: string;
    history: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    intent?: AgentIntent;
    mentionedProductIds?: string[];
    previousSearchResults?: RankedProduct[];
    conversationSummary?: string;
    requirements?: ExtractedRequirements;
    searchResults?: SlimProduct[];
    totalFound?: number;
    comparisonResult?: ComparisonResult;
    rankedProducts?: RankedProduct[];
    finalMessage?: string;
    followUpQuestions?: string[];
}
export interface IAgent {
    run(context: AgentContext): Promise<AgentContext>;
}
