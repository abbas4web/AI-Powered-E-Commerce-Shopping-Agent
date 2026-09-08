import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiOrchestratorService } from './ai-orchestrator.service';

// Provider abstraction
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { AI_PROVIDER } from './interfaces/ai-provider.interface';

// Agents
import { RouterAgent } from './agents/router.agent';
import { ClarificationAgent } from './agents/clarification.agent';
import { SearchAgent } from './agents/search.agent';
import { CompareAgent } from './agents/compare.agent';
import { RankingAgent } from './agents/ranking.agent';
import { ResponseAgent } from './agents/response.agent';

// Tool layer
import { ToolDispatcherService } from './tools/tool-dispatcher.service';

// Feature modules
import { SearchModule } from '../search/search.module';
import { ProductsModule } from '../products/products.module';
import { ComparisonsModule } from '../comparisons/comparisons.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { WishlistModule } from '../wishlist/wishlist.module';
import { PreferencesModule } from '../preferences/preferences.module';

@Module({
  imports: [
    ConfigModule,
    SearchModule,
    ProductsModule,
    ComparisonsModule,
    RecommendationsModule,
    ConversationsModule,
    WishlistModule,
    PreferencesModule,
  ],
  controllers: [AiController],
  providers: [
    // Provider factory
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

    // Agents
    RouterAgent,
    ClarificationAgent,
    SearchAgent,
    CompareAgent,
    RankingAgent,
    ResponseAgent,

    // Services
    AiOrchestratorService,
    AiService,
    ToolDispatcherService,
  ],
  exports: [AiService],
})
export class AiModule {}
