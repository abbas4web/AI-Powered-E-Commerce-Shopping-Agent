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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const logger_service_1 = require("../../common/logger/logger.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new logger_service_1.AppLogger('AnalyticsService');
    }
    async trackProductView(userId, productId) {
        try {
            await this.prisma.analyticsEvent.create({
                data: {
                    event: 'PRODUCT_VIEW',
                    userId,
                    productId,
                    metadata: {},
                },
            });
        }
        catch (err) {
            this.logger.warn(`Failed to track product view: ${err.message}`);
        }
    }
    async trackSearch(userId, query, resultCount) {
        try {
            await this.prisma.analyticsEvent.create({
                data: {
                    event: 'PRODUCT_SEARCH',
                    userId,
                    metadata: { query, resultCount },
                },
            });
        }
        catch (err) {
            this.logger.warn(`Failed to track search: ${err.message}`);
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map