import { Injectable } from '@nestjs/common';
import {
  AIResponse,
  GenerateOptions,
  IAIProvider,
} from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';

/**
 * GroqProvider — placeholder for future Groq integration.
 *
 * To activate: set AI_PROVIDER=groq in .env and install the Groq SDK.
 * The generate() method signature is identical to GeminiProvider,
 * so the orchestration layer requires zero changes.
 */
@Injectable()
export class GroqProvider implements IAIProvider {
  private readonly logger = new AppLogger('GroqProvider');

  getProviderName(): string {
    return 'groq';
  }

  async generate(_options: GenerateOptions): Promise<AIResponse> {
    this.logger.warn('GroqProvider is not yet implemented. Set AI_PROVIDER=gemini.');
    return {
      content: 'Groq provider is not yet configured.',
      toolCalls: [],
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: 'error',
    };
  }
}
