"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const search_service_1 = require("../../search/search.service");
const products_service_1 = require("../../products/products.service");
const comparisons_service_1 = require("../../comparisons/comparisons.service");
const recommendations_service_1 = require("../../recommendations/recommendations.service");
const wishlist_service_1 = require("../../wishlist/wishlist.service");
const preferences_service_1 = require("../../preferences/preferences.service");
const logger_service_1 = require("../../../common/logger/logger.service");
let ToolDispatcherService = class ToolDispatcherService {
    constructor(searchService, productsService, comparisonsService, recommendationsService, wishlistService, preferencesService) {
        this.searchService = searchService;
        this.productsService = productsService;
        this.comparisonsService = comparisonsService;
        this.recommendationsService = recommendationsService;
        this.wishlistService = wishlistService;
        this.preferencesService = preferencesService;
        this.logger = new logger_service_1.AppLogger('ToolDispatcher');
    }
    async dispatch(userId, toolCall) {
        const { name } = toolCall;
        const args = Object.fromEntries(Object.entries(toolCall.arguments).filter(([, v]) => v !== null && v !== undefined));
        this.logger.debug(`Tool: ${name} | Args: ${JSON.stringify(args)}`);
        switch (name) {
            case 'searchProducts': return this.handleSearchProducts(args);
            case 'getProductDetails': return this.handleGetProductDetails(args);
            case 'compareProducts': return this.handleCompareProducts(args);
            case 'getProductReviews': return this.handleGetProductReviews(args);
            case 'getSimilarProducts': return this.handleGetSimilarProducts(args);
            case 'getUserPreferences': return this.handleGetUserPreferences(userId);
            case 'saveRecommendation': return this.handleSaveRecommendation(userId, args);
            case 'addToWishlist': return this.handleAddToWishlist(userId, args);
            default:
                this.logger.warn(`Unknown tool: ${name}`);
                throw new common_1.BadRequestException(`Unknown tool: ${name}`);
        }
    }
    async handleSearchProducts(args) {
        return this.searchService.searchProducts({
            query: args.query,
            categoryId: args.categoryId,
            brandId: args.brandId,
            minPrice: args.minPrice,
            maxPrice: args.maxPrice,
            limit: args.limit ?? 10,
        });
    }
    async handleGetProductDetails(args) {
        const productId = args.productId;
        if (!productId)
            throw new common_1.BadRequestException('productId is required');
        return this.productsService.findById(productId);
    }
    async handleCompareProducts(args) {
        const productIds = args.productIds;
        if (!Array.isArray(productIds) || productIds.length < 2) {
            throw new common_1.BadRequestException('compareProducts requires at least 2 productIds');
        }
        if (productIds.length > 4) {
            throw new common_1.BadRequestException('compareProducts supports a maximum of 4 products');
        }
        return this.comparisonsService.compare(productIds);
    }
    async handleGetProductReviews(args) {
        const productId = args.productId;
        this.logger.debug(`getProductReviews called for ${productId} — Phase 11 stub`);
        return {
            productId,
            message: 'Review intelligence will be available in Phase 11.',
            reviews: [],
        };
    }
    async handleGetSimilarProducts(args) {
        const productId = args.productId;
        if (!productId)
            throw new common_1.BadRequestException('productId is required');
        const product = await this.productsService.findById(productId);
        return this.searchService.searchProducts({
            query: product.name.split(' ').slice(0, 3).join(' '),
            limit: args.limit ?? 5,
        });
    }
    async handleGetUserPreferences(userId) {
        const preferences = await this.preferencesService.get(userId);
        return preferences ?? { message: 'No preferences saved yet.' };
    }
    async handleSaveRecommendation(userId, args) {
        const productId = args.productId;
        const score = args.score ?? 80;
        const reason = args.reason ?? 'Recommended by AI';
        const matchedRequirements = args.matchedRequirements ?? [];
        if (!productId)
            throw new common_1.BadRequestException('productId is required');
        await this.recommendationsService.saveRecommendation(userId, productId, score, reason, matchedRequirements);
        return { success: true, productId };
    }
    async handleAddToWishlist(userId, args) {
        const productId = args.productId;
        if (!productId)
            throw new common_1.BadRequestException('productId is required');
        await this.wishlistService.addToWishlist(userId, productId);
        return { success: true, productId };
    }
};
exports.ToolDispatcherService = ToolDispatcherService;
exports.ToolDispatcherService = ToolDispatcherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        products_service_1.ProductsService,
        comparisons_service_1.ComparisonsService,
        recommendations_service_1.RecommendationsService,
        wishlist_service_1.WishlistService,
        preferences_service_1.PreferencesService])
], ToolDispatcherService);
//# sourceMappingURL=tool-dispatcher.service.js.map