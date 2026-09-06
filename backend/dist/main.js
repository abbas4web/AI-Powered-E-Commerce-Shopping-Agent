"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const app_module_1 = require("./app.module");
const logger_service_1 = require("./common/logger/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    const configService = app.get(config_1.ConfigService);
    const logger = new logger_service_1.AppLogger('Bootstrap');
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.use(cookieParser());
    const frontendUrl = configService.get('app.frontendUrl') ?? 'http://localhost:3000';
    const isDev = configService.get('app.nodeEnv') !== 'production';
    const allowedOrigins = frontendUrl.split(',').map((o) => o.trim());
    app.enableCors({
        origin: isDev
            ? (origin, cb) => {
                if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
                    cb(null, true);
                }
                else {
                    cb(new Error(`CORS blocked: ${origin}`), false);
                }
            }
            : (origin, cb) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    cb(null, true);
                }
                else {
                    cb(new Error(`CORS blocked: ${origin}`), false);
                }
            },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    });
    const apiPrefix = configService.get('app.apiPrefix') ?? 'api';
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const port = configService.get('app.port') ?? 4000;
    if (configService.get('app.nodeEnv') !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('SmartShop AI API')
            .setDescription('AI-powered e-commerce shopping agent API')
            .setVersion('1.0')
            .addBearerAuth()
            .addTag('Auth', 'Authentication endpoints')
            .addTag('Users', 'User profile management')
            .addTag('Products', 'Product catalog')
            .addTag('Categories', 'Product categories')
            .addTag('Brands', 'Product brands')
            .addTag('Search', 'Product search and filtering')
            .addTag('AI', 'AI shopping assistant')
            .addTag('Recommendations', 'Personalized recommendations')
            .addTag('Comparisons', 'Product comparisons')
            .addTag('Reviews', 'Product reviews')
            .addTag('Wishlist', 'User wishlist')
            .addTag('Conversations', 'Conversation history')
            .addTag('Preferences', 'User preferences')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
        logger.log(`Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
    }
    await app.listen(port);
    logger.log(`SmartShop API running on http://localhost:${port}/${apiPrefix} [${configService.get('app.nodeEnv')}]`);
}
bootstrap();
//# sourceMappingURL=main.js.map