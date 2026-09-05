"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const config_2 = require("./config");
const prisma_module_1 = require("./database/prisma.module");
const logger_module_1 = require("./common/logger/logger.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const request_id_interceptor_1 = require("./common/interceptors/request-id.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const products_module_1 = require("./modules/products/products.module");
const categories_module_1 = require("./modules/categories/categories.module");
const brands_module_1 = require("./modules/brands/brands.module");
const search_module_1 = require("./modules/search/search.module");
const ai_module_1 = require("./modules/ai/ai.module");
const recommendations_module_1 = require("./modules/recommendations/recommendations.module");
const comparisons_module_1 = require("./modules/comparisons/comparisons.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const wishlist_module_1 = require("./modules/wishlist/wishlist.module");
const conversations_module_1 = require("./modules/conversations/conversations.module");
const preferences_module_1 = require("./modules/preferences/preferences.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [config_2.appConfig, config_2.databaseConfig, config_2.jwtConfig, config_2.redisConfig, config_2.aiConfig, config_2.storageConfig],
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'global',
                    ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10) * 1000,
                    limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
                },
            ]),
            logger_module_1.LoggerModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            brands_module_1.BrandsModule,
            search_module_1.SearchModule,
            ai_module_1.AiModule,
            recommendations_module_1.RecommendationsModule,
            comparisons_module_1.ComparisonsModule,
            reviews_module_1.ReviewsModule,
            wishlist_module_1.WishlistModule,
            conversations_module_1.ConversationsModule,
            preferences_module_1.PreferencesModule,
            analytics_module_1.AnalyticsModule,
        ],
        providers: [
            { provide: core_1.APP_FILTER, useClass: http_exception_filter_1.GlobalExceptionFilter },
            { provide: core_1.APP_INTERCEPTOR, useClass: request_id_interceptor_1.RequestIdInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: logging_interceptor_1.LoggingInterceptor },
            { provide: core_1.APP_INTERCEPTOR, useClass: transform_interceptor_1.TransformInterceptor },
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map