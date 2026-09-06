/**
 * Shared types for the multi-agent pipeline.
 *
 * Flow:
 *   User message
 *     → RouterAgent       (classifies intent)
 *     → SearchAgent       (extracts requirements + searches DB)
 *     → CompareAgent      (side-by-side comparison, if intent = COMPARE)
 *     → RankingAgent      (deterministic scoring)
 *     → ResponseAgent     (writes final human-readable text)
 */

// ─── Intent ──────────────────────────────────────────────────────────────────

export type AgentIntent =
  | 'PRODUCT_SEARCH'    // "I need a laptop under 80k"
  | 'PRODUCT_COMPARE'   // "Compare ASUS vs Dell"
  | 'PRODUCT_DETAILS'   // "Tell me more about the MacBook"
  | 'WISHLIST'          // "Add this to my wishlist"
  | 'RECOMMENDATIONS'   // "Show my saved recommendations"
  | 'GENERAL';          // Greetings, general questions

// ─── Requirements extracted from user message ─────────────────────────────

export interface ExtractedRequirements {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  brandName?: string;
  useCases?: string[];
  mustHaveFeatures?: string[];
}

// ─── Slim product type used across agents ────────────────────────────────────

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

// ─── Ranked product output from RankingAgent ──────────────────────────────

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

// ─── Comparison result from CompareAgent ──────────────────────────────────

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
    values: Array<{ productId: string; value: unknown }>;
  }>;
}

// ─── Pipeline context — passed between agents ─────────────────────────────

export interface AgentContext {
  userId: string;
  conversationId: string;
  originalMessage: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;

  // Set by RouterAgent
  intent?: AgentIntent;
  // Product IDs mentioned for compare/details
  mentionedProductIds?: string[];

  // Set by SearchAgent
  requirements?: ExtractedRequirements;
  searchResults?: SlimProduct[];
  totalFound?: number;

  // Set by CompareAgent
  comparisonResult?: ComparisonResult;

  // Set by RankingAgent
  rankedProducts?: RankedProduct[];

  // Set by ResponseAgent
  finalMessage?: string;
  followUpQuestions?: string[];
}

// ─── Agent interface ──────────────────────────────────────────────────────

export interface IAgent {
  run(context: AgentContext): Promise<AgentContext>;
}
