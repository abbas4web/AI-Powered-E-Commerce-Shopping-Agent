import { AIToolCall } from '../interfaces/ai-provider.interface';
import { SearchService } from '../../search/search.service';
import { ProductsService } from '../../products/products.service';
import { ComparisonsService } from '../../comparisons/comparisons.service';
import { RecommendationsService } from '../../recommendations/recommendations.service';
import { WishlistService } from '../../wishlist/wishlist.service';
import { PreferencesService } from '../../preferences/preferences.service';
export declare class ToolDispatcherService {
    private readonly searchService;
    private readonly productsService;
    private readonly comparisonsService;
    private readonly recommendationsService;
    private readonly wishlistService;
    private readonly preferencesService;
    private readonly logger;
    constructor(searchService: SearchService, productsService: ProductsService, comparisonsService: ComparisonsService, recommendationsService: RecommendationsService, wishlistService: WishlistService, preferencesService: PreferencesService);
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
