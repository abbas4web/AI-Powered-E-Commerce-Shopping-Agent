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
  | 'COMPARISON'
  | 'CLARIFICATION'
  | 'GENERAL';

export interface ProductRecommendation {
  productId: string;
  score: number; // 0–100
  reason: string;
  matchedRequirements: string[];
  warnings: string[];
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
}

/**
 * Structured requirement extraction — what the AI extracts from the user's message.
 * Used to feed the deterministic search pipeline.
 */
export interface ExtractedRequirements {
  category?: string;
  budgetMax?: number;
  budgetMin?: number;
  brand?: string;
  useCase?: string[];
  // Laptop-specific
  minRam?: number;
  minStorage?: number;
  minDisplaySize?: number;
  // Phone-specific
  minCameraMP?: number;
  minBatteryMah?: number;
  // General
  mustHaveFeatures?: string[];
  niceToHaveFeatures?: string[];
  dealBreakers?: string[];
}

/**
 * Conversation message — stored in the conversation history.
 */
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
