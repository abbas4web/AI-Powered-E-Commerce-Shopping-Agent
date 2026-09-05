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
exports.ComparisonsService = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("../products/products.service");
const logger_service_1 = require("../../common/logger/logger.service");
let ComparisonsService = class ComparisonsService {
    constructor(productsService) {
        this.productsService = productsService;
        this.logger = new logger_service_1.AppLogger('ComparisonsService');
    }
    async compare(productIds) {
        if (productIds.length < 2 || productIds.length > 4) {
            throw new common_1.BadRequestException('Compare requires 2 to 4 product IDs');
        }
        const products = await this.productsService.findByIds(productIds);
        if (products.length !== productIds.length) {
            throw new common_1.BadRequestException('One or more products were not found');
        }
        const specKeys = new Set();
        for (const product of products) {
            const specs = product.specifications;
            Object.keys(specs ?? {}).forEach((k) => specKeys.add(k));
        }
        const comparisonMatrix = Array.from(specKeys).map((key) => ({
            attribute: key,
            values: products.map((p) => ({
                productId: p.id,
                value: p.specifications?.[key] ?? null,
            })),
        }));
        return {
            products: products.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                brand: p.brand,
                category: p.category,
                rating: p.rating,
                imageUrl: p.imageUrl,
            })),
            comparisonMatrix,
        };
    }
};
exports.ComparisonsService = ComparisonsService;
exports.ComparisonsService = ComparisonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ComparisonsService);
//# sourceMappingURL=comparisons.service.js.map