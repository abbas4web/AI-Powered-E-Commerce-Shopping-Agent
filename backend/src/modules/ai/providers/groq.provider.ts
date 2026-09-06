import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import {
  AIResponse,
  AITool,
  AIToolCall,
  ChatMessage,
  GenerateOptions,
  IAIProvider,
} from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';

@Injectable()
export class GroqProvider implements IAIProvider {
  private readonly client: Groq;
  private readonly modelName: string;
  private readonly logger = new AppLogger('GroqProvider');

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.groq.apiKey');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY is not set. Groq provider will not work.');
    }
    this.client = new Groq({ apiKey: apiKey ?? '' });
    this.modelName =
      this.configService.get<string>('ai.groq.model') ?? 'llama-3.3-70b-versatile';
  }

  getProviderName(): string {
    return 'groq';
  }

  async generate(options: GenerateOptions): Promise<AIResponse> {
    const { messages, tools, systemPrompt, temperature = 0.3, maxTokens = 8192 } = options;

    // Build message array — Groq uses OpenAI-compatible format
    const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      groqMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      groqMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    // Build tools in OpenAI format
    const groqTools: Groq.Chat.ChatCompletionTool[] | undefined = tools?.length
      ? tools.map((t: AITool) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters as Record<string, unknown>,
          },
        }))
      : undefined;

    this.logger.debug(
      `Groq request: model=${this.modelName}, messages=${groqMessages.length}, tools=${tools?.length ?? 0}`,
    );

    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages: groqMessages,
      tools: groqTools,
      tool_choice: groqTools ? 'auto' : undefined,
      temperature,
      max_tokens: maxTokens,
    });

    const choice = completion.choices[0];
    const toolCalls: AIToolCall[] = [];
    let textContent: string | null = choice.message.content ?? null;

    if (choice.message.tool_calls?.length) {
      for (const tc of choice.message.tool_calls) {
        try {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
          });
        } catch {
          this.logger.warn(`Failed to parse tool call arguments for ${tc.function.name}`);
        }
      }
    }

    return {
      content: textContent,
      toolCalls,
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
      finishReason:
        choice.finish_reason === 'tool_calls'
          ? 'tool_calls'
          : choice.finish_reason === 'stop'
            ? 'stop'
            : 'stop',
    };
  }
}
