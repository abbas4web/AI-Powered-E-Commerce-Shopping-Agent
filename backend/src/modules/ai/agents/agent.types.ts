/**
 * Shared types for the multi-agent pipeline.
 *
 * Flow:
 *   User message
 *     → RouterAgent       (classify intent + extract context)
 *     → ClarificationAgent (ask for missing info when needed)   [CLARIFICATION]
 *     → SearchAgent       (extract requirements + search DB)    [SEARCH/DETAILS]
 *     → CompareAgent      (side-by-side comparison)             [COMPARE]
 *     → RankingAgent      (deterministic scoring)               [SEARCH/DETAILS]
 *     → ResponseAgent     (write final human-readable text)
 */

// ─── Intent ──────────────────────────────────────────────────────────────────

export type AgentIntent =
  | 'PRODUCT_SEARCH'      // "I need a laptop under 80k"
  | 'PRODUCT_COMPARE'     // "ASUS vs Dell" / "compare these two"
  | 'PRODUCT_DETAILS'     // "Tell me more about the MacBook"
  | 'FOLLOWUP_SEARCH'     // "which is best?" / "only ASUS" (context-dependent)
  | 'CLARIFICATION'       // Agent asks ONE question before searching
  | 'WISHLIST_ADD'        // "save this", "add to wishlist", "add the first one"
  | 'WISHLIST_VIEW'       // "show my wishlist", "what have I saved?"
  | 'RECOMMENDATIONS'     // "show my recommendations", "what did you recommend?"
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

// ─── Bundle suggestion ─────────────────────────────────────────────────────

export interface BundleSuggestion {
  category: string;
  reason: string;
  examples: string[];
}

// ─── Pipeline context — passed between agents ─────────────────────────────

export interface AgentContext {
  userId: string;
  conversationId: string;
  originalMessage: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;

  // ── Router output ──────────────────────────────────────────────────────
  intent?: AgentIntent;
  mentionedProductIds?: string[];

  // ── Clarification ──────────────────────────────────────────────────────
  // When set, ResponseAgent returns this question and stops — no search done.
  clarificationQuestion?: string;
  // Missing requirement that triggered clarification
  missingRequirement?: 'budget' | 'useCase' | 'productType';

  // ── Conversation continuity ────────────────────────────────────────────
  previousSearchResults?: RankedProduct[];
  previousRequirements?: ExtractedRequirements;
  conversationSummary?: string;

  // ── User preferences (loaded from DB at start of turn) ────────────────
  userPreferences?: {
    preferredBrands: string[];
    preferredCategories: string[];
    budgetMin?: number | null;
    budgetMax?: number | null;
    useCases: string[];
  };

  // ── Search output ──────────────────────────────────────────────────────
  requirements?: ExtractedRequirements;
  searchResults?: SlimProduct[];
  totalFound?: number;

  // ── Similar products (populated by ResponseAgent for bundle suggestions) ─
  similarProducts?: SlimProduct[];
  bundleSuggestions?: BundleSuggestion[];

  // ── Compare output ─────────────────────────────────────────────────────
  comparisonResult?: ComparisonResult;

  // ── Ranking output ─────────────────────────────────────────────────────
  rankedProducts?: RankedProduct[];

  // ── Orchestrator flags ─────────────────────────────────────────────────
  bestPickOnly?: boolean;
  // Product ID the user wants to add to wishlist (parsed from message)
  wishlistProductId?: string;

  // ── Response output ────────────────────────────────────────────────────
  finalMessage?: string;
  followUpQuestions?: string[];
}

// ─── Agent interface ──────────────────────────────────────────────────────

export interface IAgent {
  run(context: AgentContext): Promise<AgentContext>;
}
