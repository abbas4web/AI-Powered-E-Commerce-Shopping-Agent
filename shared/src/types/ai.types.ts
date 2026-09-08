/**
 * AI Chat Contract
 *
 * These types define the contract between the frontend and backend
 * for all AI interactions. The frontend renders based on these types —
 * it never receives HTML from the AI.
 */

export type AiIntent =
  | 'PRODUCT_RECOMMENDATION'
  | 'PRODUCT_SEARCH'
  | 'PRODUCT_COMPARE'
  | 'PRODUCT_DETAILS'
  | 'FOLLOWUP_SEARCH'
  | 'CLARIFICATION'
  | 'WISHLIST_ADD'
  | 'WISHLIST_VIEW'
  | 'RECOMMENDATIONS'
  | 'GENERAL';

export interface ScoreBreakdown {
  requirementMatch: number; // 0–100
  performance: number;
  rating: number;
  priceValue: number;
  reviewSentiment: number;
  popularity: number;
}

export interface ProductRecommendation {
  productId: string;
  score: number;          // 0–100 final score
  reason: string;
  matchedRequirements: string[];
  warnings: string[];
  breakdown?: ScoreBreakdown;
}

export interface BundleSuggestion {
  category: string;
  reason: string;
  examples: string[];
}

export interface SimilarProductSummary {
  id: string;
  name: string;
  price: number;
  brand: string;
  imageUrl?: string | null;
  rating: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  intent?: AiIntent;
  products?: ProductRecommendation[];
  followUpQuestions?: string[];
  bundleSuggestions?: BundleSuggestion[];
  similarProducts?: SimilarProductSummary[];
}

/**
 * Structured requirement extraction — what the AI extracts from the user's message.
 */
export interface ExtractedRequirements {
  category?: string;
  budgetMax?: number;
  budgetMin?: number;
  brand?: string;
  useCase?: string[];
  minRam?: number;
  minStorage?: number;
  minDisplaySize?: number;
  minCameraMP?: number;
  minBatteryMah?: number;
  mustHaveFeatures?: string[];
  niceToHaveFeatures?: string[];
  dealBreakers?: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  structuredState: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
