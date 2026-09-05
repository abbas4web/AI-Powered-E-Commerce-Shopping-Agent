"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingEngineService = exports.DEFAULT_RANKING_WEIGHTS = void 0;
const common_1 = require("@nestjs/common");
exports.DEFAULT_RANKING_WEIGHTS = {
    requirementMatch: 0.35,
    performance: 0.25,
    rating: 0.15,
    priceValue: 0.10,
    reviewSentiment: 0.10,
    popularity: 0.05,
};
let RankingEngineService = class RankingEngineService {
    rank(products, weights = exports.DEFAULT_RANKING_WEIGHTS) {
        const maxReviewCount = Math.max(...products.map((p) => p.reviewCount), 1);
        const maxViewCount = Math.max(...products.map((p) => p.viewCount), 1);
        const ranked = products.map((p) => {
            const ratingScore = (p.rating / 5) * 100;
            const priceValueScore = p.budgetMax > 0
                ? Math.max(0, ((p.budgetMax - p.price) / p.budgetMax) * 100)
                : 50;
            const sentimentScore = p.reviewSentiment * 100;
            const popularityScore = ((p.reviewCount / maxReviewCount) * 0.6 + (p.viewCount / maxViewCount) * 0.4) * 100;
            const finalScore = p.requirementMatchScore * weights.requirementMatch +
                p.performanceScore * weights.performance +
                ratingScore * weights.rating +
                priceValueScore * weights.priceValue +
                sentimentScore * weights.reviewSentiment +
                popularityScore * weights.popularity;
            return {
                productId: p.productId,
                finalScore: Math.round(Math.min(100, Math.max(0, finalScore))),
                breakdown: {
                    requirementMatch: Math.round(p.requirementMatchScore),
                    performance: Math.round(p.performanceScore),
                    rating: Math.round(ratingScore),
                    priceValue: Math.round(priceValueScore),
                    reviewSentiment: Math.round(sentimentScore),
                    popularity: Math.round(popularityScore),
                },
            };
        });
        return ranked.sort((a, b) => b.finalScore - a.finalScore);
    }
};
exports.RankingEngineService = RankingEngineService;
exports.RankingEngineService = RankingEngineService = __decorate([
    (0, common_1.Injectable)()
], RankingEngineService);
//# sourceMappingURL=ranking-engine.service.js.map