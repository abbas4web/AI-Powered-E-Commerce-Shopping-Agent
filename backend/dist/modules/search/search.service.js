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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const logger_service_1 = require("../../common/logger/logger.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const CATEGORY_KEYWORDS = {
    laptops: ['laptop', 'laptops', 'notebook', 'macbook', 'chromebook'],
    smartphones: ['phone', 'mobile', 'smartphone', 'iphone', 'android'],
    tablets: ['tablet', 'ipad'],
    headphones: ['headphone', 'earphone', 'earbuds', 'headset', 'airpods'],
    monitors: ['monitor', 'display', 'screen'],
    cameras: ['camera', 'dslr', 'mirrorless'],
    televisions: ['tv', 'television', 'smart tv'],
};
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new logger_service_1.AppLogger('SearchService');
    }
    async searchProducts(dto) {
        const { query, categoryId, categorySlug, brandId, brandName, minPrice, maxPrice, page = 1, limit = 20, } = dto;
        const where = { isActive: true };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        else if (categorySlug) {
            where.category = { slug: { equals: categorySlug, mode: 'insensitive' } };
        }
        else if (query) {
            const detectedSlug = this.detectCategorySlug(query);
            if (detectedSlug) {
                where.category = { slug: detectedSlug };
                this.logger.debug(`Auto-detected category: ${detectedSlug} from query: "${query}"`);
            }
        }
        if (brandId) {
            where.brandId = brandId;
        }
        else if (brandName) {
            where.brand = { name: { contains: brandName, mode: 'insensitive' } };
            this.logger.debug(`Brand filter: "${brandName}"`);
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined)
                where.price.gte = minPrice;
            if (maxPrice !== undefined)
                where.price.lte = maxPrice;
        }
        if (query && !where.category) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: { category: true, brand: true },
                orderBy: { rating: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        this.logger.debug(`Search for "${query}" returned ${total} results`);
        return (0, pagination_dto_1.paginate)(products, total, page, limit);
    }
    async searchProductsByName(query) {
        return this.prisma.product.findMany({
            where: {
                isActive: true,
                name: { contains: query, mode: 'insensitive' },
            },
            include: { category: true, brand: true },
            orderBy: { rating: 'desc' },
            take: 1,
        });
    }
    detectCategorySlug(query) {
        const lower = query.toLowerCase();
        for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some((k) => lower.includes(k))) {
                return slug;
            }
        }
        return null;
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map