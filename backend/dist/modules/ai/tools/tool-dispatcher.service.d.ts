import { AIToolCall } from '../interfaces/ai-provider.interface';
import { SearchService } from '../../search/search.service';
import { ProductsService } from '../../products/products.service';
export declare class ToolDispatcherService {
    private readonly searchService;
    private readonly productsService;
    private readonly logger;
    constructor(searchService: SearchService, productsService: ProductsService);
    dispatch(userId: string, toolCall: AIToolCall): Promise<unknown>;
    private handleSearchProducts;
    private handleGetProductDetails;
    private handleCompareProducts;
    private handleGetProductReviews;
    private handleGetSimilarProducts;
    private handleGetUserPreferences;
    private handleSaveRecommendation;
    private handleAddToWishlist;
}
