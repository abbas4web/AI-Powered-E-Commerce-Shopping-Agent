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
exports.RankingAgent = void 0;
const common_1 = require("@nestjs/common");
const ranking_engine_service_1 = require("../../recommendations/ranking-engine.service");
const logger_service_1 = require("../../../common/logger/logger.service");
let RankingAgent = class RankingAgent {
    constructor(rankingEngine) {
        this.rankingEngine = rankingEngine;
        this.logger = new logger_service_1.AppLogger('RankingAgent');
    }
    async run(context) {
        const { searchResults, requirements } = context;
        if (!searchResults?.length) {
            context.rankedProducts = [];
            return context;
        }
        const budgetMax = requirements?.maxPrice ?? 0;
        const inputs = searchResults.map((product) => ({
            productId: product.id,
            requirementMatchScore: this.computeRequirementMatchScore(product, context),
            performanceScore: this.computePerformanceScore(product),
            rating: product.rating,
            price: product.price,
            budgetMax,
            reviewSentiment: 0.7,
            reviewCount: product.reviewCount,
            viewCount: product.viewCount,
        }));
        const ranked = this.rankingEngine.rank(inputs);
        context.rankedProducts = ranked.map((r) => {
            const product = searchResults.find((p) => p.id === r.productId);
            return {
                productId: r.productId,
                name: product.name,
                price: product.price,
                brand: product.brand,
                imageUrl: product.imageUrl,
                score: r.finalScore,
                breakdown: r.breakdown,
                matchedRequirements: this.buildMatchedRequirements(product, context),
                warnings: this.buildWarnings(product, context),
            };
        });
        this.logger.debug(`Ranked ${context.rankedProducts.length} products. Top: ${context.rankedProducts[0]?.name} (${context.rankedProducts[0]?.score})`);
        return context;
    }
    computeRequirementMatchScore(product, context) {
        const req = context.requirements;
        if (!req)
            return 70;
        let score = 60;
        const specs = product.specifications;
        const nameLower = product.name.toLowerCase();
        const descLower = product.description.toLowerCase();
        if (req.maxPrice && product.price <= req.maxPrice)
            score += 15;
        if (req.minPrice && product.price >= req.minPrice)
            score += 5;
        if (req.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
            score += 10;
        }
        const useCases = req.useCases ?? [];
        for (const useCase of useCases) {
            const uc = useCase.toLowerCase();
            if (nameLower.includes(uc) || descLower.includes(uc))
                score += 5;
        }
        const features = req.mustHaveFeatures ?? [];
        for (const feature of features) {
            const f = feature.toLowerCase();
            if (descLower.includes(f) ||
                nameLower.includes(f) ||
                JSON.stringify(specs).toLowerCase().includes(f)) {
                score += 5;
            }
        }
        return Math.min(100, score);
    }
    computePerformanceScore(product) {
        const specs = product.specifications;
        let score = 50;
        const ram = specs.ram;
        if (ram) {
            if (ram >= 32)
                score += 25;
            else if (ram >= 16)
                score += 20;
            else if (ram >= 8)
                score += 10;
        }
        const storage = specs.storage;
        if (storage) {
            if (storage >= 1000)
                score += 15;
            else if (storage >= 512)
                score += 10;
            else if (storage >= 256)
                score += 5;
        }
        const battery = specs.battery;
        if (battery?.life) {
            if (battery.life >= 12)
                score += 10;
            else if (battery.life >= 8)
                score += 7;
            else if (battery.life >= 6)
                score += 3;
        }
        if (product.rating >= 4.5)
            score += 5;
        else if (product.rating >= 4.0)
            score += 3;
        return Math.min(100, score);
    }
    buildMatchedRequirements(product, context) {
        const matched = [];
        const req = context.requirements;
        if (!req)
            return matched;
        if (req.maxPrice && product.price <= req.maxPrice)
            matched.push('budget');
        if (req.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
            matched.push('brand');
        }
        const specs = product.specifications;
        const descLower = product.description.toLowerCase();
        for (const useCase of req.useCases ?? []) {
            if (descLower.includes(useCase.toLowerCase()))
                matched.push(useCase);
        }
        for (const feature of req.mustHaveFeatures ?? []) {
            if (JSON.stringify(specs).toLowerCase().includes(feature.toLowerCase())) {
                matched.push(feature);
            }
        }
        if (specs.ram >= 16)
            matched.push('16GB RAM');
        if (product.rating >= 4.2)
            matched.push('high rating');
        return [...new Set(matched)];
    }
    buildWarnings(product, context) {
        const warnings = [];
        const req = context.requirements;
        if (!req)
            return warnings;
        if (req.maxPrice && product.price > req.maxPrice) {
            warnings.push(`₹${(product.price - req.maxPrice).toLocaleString('en-IN')} over budget`);
        }
        const specs = product.specifications;
        const battery = specs.battery;
        if (battery?.life && battery.life < 6) {
            warnings.push('short battery life (<6h)');
        }
        return warnings;
    }
};
exports.RankingAgent = RankingAgent;
exports.RankingAgent = RankingAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ranking_engine_service_1.RankingEngineService])
], RankingAgent);
//# sourceMappingURL=ranking.agent.js.map