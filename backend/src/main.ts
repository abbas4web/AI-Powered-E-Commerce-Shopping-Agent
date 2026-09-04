import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const logger = new AppLogger('Bootstrap');

  // ─── Security ────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ─── CORS ────────────────────────────────────────────────────────────────
  const frontendUrl = configService.get<string>('app.frontendUrl') ?? 'http://localhost:3000';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  });

  // ─── Global prefix & versioning ──────────────────────────────────────────
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  // ─── Global validation pipe ──────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strip properties not in DTO
      forbidNonWhitelisted: false,
      transform: true,         // Auto-transform query params to typed values
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Start port ──────────────────────────────────────────────────────────
  const port = configService.get<number>('app.port') ?? 4000;

  // ─── Swagger / OpenAPI ───────────────────────────────────────────────────
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
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

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    logger.log(`Swagger docs: http://localhost:${port}/${apiPrefix}/docs`);
  }

  // ─── Start ───────────────────────────────────────────────────────────────
  await app.listen(port);

  logger.log(
    `SmartShop API running on http://localhost:${port}/${apiPrefix} [${configService.get<string>('app.nodeEnv')}]`,
  );
}

bootstrap();
