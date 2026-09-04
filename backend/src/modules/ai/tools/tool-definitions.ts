import { AITool } from '../interfaces/ai-provider.interface';

/**
 * Controlled tool definitions exposed to the LLM.
 *
 * The LLM can only call these functions.
 * It cannot execute arbitrary code, SQL, or shell commands.
 * Each tool maps to a specific service method via ToolDispatcherService.
 */
export const AI_TOOLS: AITool[] = [
  {
    name: 'searchProducts',
    description:
      'Search the product catalog using structured filters. Use this to find products matching the user requirements.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword search query' },
        categorySlug: {
          type: 'string',
          description: 'Product category slug (e.g. "laptops", "smartphones")',
        },
        brandSlug: { type: 'string', description: 'Brand slug (e.g. "apple", "samsung")' },
        minPrice: { type: 'number', description: 'Minimum price in INR' },
        maxPrice: { type: 'number', description: 'Maximum price in INR' },
        minRam: { type: 'number', description: 'Minimum RAM in GB (for laptops/phones)' },
        minStorage: { type: 'number', description: 'Minimum storage in GB' },
        limit: { type: 'number', description: 'Max results to return (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'getProductDetails',
    description: 'Get full specifications, pricing, and availability for a specific product by ID.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The product ID' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'compareProducts',
    description: 'Compare two or more products side by side across key specifications.',
    parameters: {
      type: 'object',
      properties: {
        productIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of product IDs to compare (2–4 products)',
        },
      },
      required: ['productIds'],
    },
  },
  {
    name: 'getProductReviews',
    description: 'Retrieve and summarize reviews for a product to understand user sentiment.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The product ID' },
        limit: { type: 'number', description: 'Number of reviews to analyze (default 20)' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'getSimilarProducts',
    description: 'Find products similar to a given product based on category and specifications.',
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'The reference product ID' },
        limit: { type: 'number', description: 'Number of similar products to return (default 5)' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'getUserPreferences',
    description: "Retrieve the current user's stored preferences (preferred brands, budget, etc.).",
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'saveRecommendation',
    description: "Save a product recommendation to the user's recommendation history.",
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID being recommended' },
        score: { type: 'number', description: 'Recommendation score 0-100' },
        reason: { type: 'string', description: 'Explanation for the recommendation' },
        matchedRequirements: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which user requirements this product satisfies',
        },
      },
      required: ['productId', 'score', 'reason'],
    },
  },
  {
    name: 'addToWishlist',
    description: "Add a product to the user's wishlist.",
    parameters: {
      type: 'object',
      properties: {
        productId: { type: 'string', description: 'Product ID to add to wishlist' },
      },
      required: ['productId'],
    },
  },
];
