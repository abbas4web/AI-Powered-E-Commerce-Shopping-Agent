import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ToolDispatcherService } from './tools/tool-dispatcher.service';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { AI_PROVIDER } from './interfaces/ai-provider.interface';
import { SearchModule } from '../search/search.module';
import { ProductsModule } from '../products/products.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [ConfigModule, SearchModule, ProductsModule, RecommendationsModule, ConversationsModule],
  controllers: [AiController],
  providers: [
    GeminiProvider,
    GroqProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, GeminiProvider, GroqProvider],
      useFactory: (config: ConfigService, gemini: GeminiProvider, groq: GroqProvider) => {
        const provider = config.get<string>('ai.provider') ?? 'gemini';
        return provider === 'groq' ? groq : gemini;
      },
    },
    AiService,
    AiOrchestratorService,
    ToolDispatcherService,
  ],
  exports: [AiService],
})
export class AiModule {}
