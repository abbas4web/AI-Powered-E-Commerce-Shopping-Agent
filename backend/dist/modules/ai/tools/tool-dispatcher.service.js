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
const logger_service_1 = require("../../../common/logger/logger.service");
let ToolDispatcherService = class ToolDispatcherService {
    constructor(searchService, productsService) {
        this.searchService = searchService;
        this.productsService = productsService;
        this.logger = new logger_service_1.AppLogger('ToolDispatcher');
    }
    async dispatch(userId, toolCall) {
        const { name } = toolCall;
        const args = Object.fromEntries(Object.entries(toolCall.arguments).filter(([, v]) => v !== null && v !== undefined));
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
                throw new common_1.BadRequestException(`Unknown tool: ${name}`);
        }
    }
    async handleSearchProducts(args) {
        return this.searchService.searchProducts({
            query: args.query,
            categoryId: args.categorySlug,
            brandId: args.brandSlug,
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
        return this.productsService.findByIds(productIds);
    }
    async handleGetProductReviews(_args) {
        return { message: 'Review analysis will be available in Phase 11', reviews: [] };
    }
    async handleGetSimilarProducts(_args) {
        return { message: 'Similar products search will be available in Phase 5', products: [] };
    }
    async handleGetUserPreferences(_userId) {
        return { preferences: {} };
    }
    async handleSaveRecommendation(_userId, _args) {
        return { success: true };
    }
    async handleAddToWishlist(_userId, _args) {
        return { success: true };
    }
};
exports.ToolDispatcherService = ToolDispatcherService;
exports.ToolDispatcherService = ToolDispatcherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_service_1.SearchService,
        products_service_1.ProductsService])
], ToolDispatcherService);
//# sourceMappingURL=tool-dispatcher.service.js.map