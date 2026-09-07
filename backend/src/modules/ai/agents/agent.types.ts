/**
 * Shared types for the multi-agent pipeline.
 *
 * Flow:
 *   User message
 *     → RouterAgent       (classify intent + extract context)
 *     → SearchAgent       (extract requirements + search DB)  [SEARCH/DETAILS]
 *     → CompareAgent      (side-by-side comparison)           [COMPARE]
 *     → RankingAgent      (deterministic scoring)             [SEARCH/DETAILS]
 *     → ResponseAgent     (write final human-readable text)
 */

// ─── Intent ──────────────────────────────────────────────────────────────────

export type AgentIntent =
  | 'PRODUCT_SEARCH'      // "I need a laptop under 80k"
  | 'PRODUCT_COMPARE'     // "ASUS vs Dell" / "compare these two"
  | 'PRODUCT_DETAILS'     // "Tell me more about the MacBook"
  | 'FOLLOWUP_SEARCH'     // "which is best?" / "only ASUS" (context-dependent)
  | 'WISHLIST'            // "add to wishlist"
  | 'RECOMMENDATIONS'     // "show my recommendations"
  | 'GENERAL';            // greetings, general questions, anything else

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
  mentionedProductIds?: string[];

  // ── Conversation continuity ────────────────────────────────────────────
  // Products from the PREVIOUS turn — used for follow-up questions like
  // "which is best?" / "compare these" / "tell me more about the first one"
  previousSearchResults?: RankedProduct[];

  // A short plain-text summary of the conversation so far.
  // Injected by the orchestrator before each turn.
  conversationSummary?: string;

  // Set by SearchAgent
  requirements?: ExtractedRequirements;
  searchResults?: SlimProduct[];
  totalFound?: number;

  // Set by CompareAgent
  comparisonResult?: ComparisonResult;

  // Set by RankingAgent
  rankedProducts?: RankedProduct[];

  // Set by orchestrator for "which is best?" follow-ups — ResponseAgent should
  // trim rankedProducts to just the top 1 so only one card is shown in the UI.
  bestPickOnly?: boolean;

  // Set by ResponseAgent
  finalMessage?: string;
  followUpQuestions?: string[];
}

// ─── Agent interface ──────────────────────────────────────────────────────

export interface IAgent {
  run(context: AgentContext): Promise<AgentContext>;
}
