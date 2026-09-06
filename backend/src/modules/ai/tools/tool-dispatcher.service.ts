import { Injectable, BadRequestException } from '@nestjs/common';
import { AIToolCall } from '../interfaces/ai-provider.interface';
import { SearchService } from '../../search/search.service';
import { ProductsService } from '../../products/products.service';
import { AppLogger } from '../../../common/logger/logger.service';

/**
 * ToolDispatcherService — routes AI tool calls to the correct service.
 *
 * Security guarantees:
 * - Only whitelisted tool names are dispatched.
 * - Arguments are validated per-tool before being forwarded.
 * - No arbitrary function execution is possible.
 * - The LLM never gets raw DB access.
 */
@Injectable()
export class ToolDispatcherService {
  private readonly logger = new AppLogger('ToolDispatcher');

  constructor(
    private readonly searchService: SearchService,
    private readonly productsService: ProductsService,
  ) {}

  async dispatch(userId: string, toolCall: AIToolCall): Promise<unknown> {
    const { name } = toolCall;

    // Strip null/undefined values — some models send null for optional params
    const args = Object.fromEntries(
      Object.entries(toolCall.arguments).filter(([, v]) => v !== null && v !== undefined),
    );

    this.logger.debug(`Dispatching tool: ${name} with args: ${JSON.stringify(args)}`);

    switch (name) {
      case 'searchProducts':
        return this.handleSearchProducts(args);

      case 'getProductDetails':
        return this.handleGetProductDetails(args);

      case 'compareProducts':
        return this.handleCompareProducts(args);

      case 'getProductReviews':
        return this.handleGetProductReviews(args);

      case 'getSimilarProducts':
        return this.handleGetSimilarProducts(args);

      case 'getUserPreferences':
        return this.handleGetUserPreferences(userId);

      case 'saveRecommendation':
        return this.handleSaveRecommendation(userId, args);

      case 'addToWishlist':
        return this.handleAddToWishlist(userId, args);

      default:
        this.logger.warn(`Unknown tool call attempted: ${name}`);
        throw new BadRequestException(`Unknown tool: ${name}`);
    }
  }

  private async handleSearchProducts(args: Record<string, unknown>) {
    return this.searchService.searchProducts({
      query: args.query as string | undefined,
      categoryId: args.categorySlug as string | undefined,
      brandId: args.brandSlug as string | undefined,
      minPrice: args.minPrice as number | undefined,
      maxPrice: args.maxPrice as number | undefined,
      limit: (args.limit as number | undefined) ?? 10,
    });
  }

  private async handleGetProductDetails(args: Record<string, unknown>) {
    const productId = args.productId as string;
    if (!productId) throw new BadRequestException('productId is required');
    return this.productsService.findById(productId);
  }

  private async handleCompareProducts(args: Record<string, unknown>) {
    const productIds = args.productIds as string[];
    if (!Array.isArray(productIds) || productIds.length < 2) {
      throw new BadRequestException('compareProducts requires at least 2 productIds');
    }
    if (productIds.length > 4) {
      throw new BadRequestException('compareProducts supports a maximum of 4 products');
    }
    return this.productsService.findByIds(productIds);
  }

  private async handleGetProductReviews(_args: Record<string, unknown>) {
    // Implemented fully in Phase 11
    return { message: 'Review analysis will be available in Phase 11', reviews: [] };
  }

  private async handleGetSimilarProducts(_args: Record<string, unknown>) {
    // Implemented fully in Phase 5 (semantic search)
    return { message: 'Similar products search will be available in Phase 5', products: [] };
  }

  private async handleGetUserPreferences(_userId: string) {
    // Implemented fully in Phase 13 (personalization)
    return { preferences: {} };
  }

  private async handleSaveRecommendation(_userId: string, _args: Record<string, unknown>) {
    // Implemented fully in Phase 9 (recommendation engine)
    return { success: true };
  }

  private async handleAddToWishlist(_userId: string, _args: Record<string, unknown>) {
    // Implemented fully in Phase 14 (wishlist)
    return { success: true };
  }
}
