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
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const logger_service_1 = require("../../common/logger/logger.service");
let RecommendationsService = class RecommendationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new logger_service_1.AppLogger('RecommendationsService');
    }
    async getUserRecommendations(userId) {
        return this.prisma.recommendation.findMany({
            where: { userId },
            include: { product: { include: { category: true, brand: true } } },
            orderBy: { score: 'desc' },
            take: 20,
        });
    }
    async saveRecommendation(userId, productId, score, reason, matchedRequirements, conversationId) {
        return this.prisma.recommendation.upsert({
            where: { userId_productId: { userId, productId } },
            update: { score, reason, matchedRequirements, conversationId },
            create: { userId, productId, score, reason, matchedRequirements, conversationId },
        });
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map