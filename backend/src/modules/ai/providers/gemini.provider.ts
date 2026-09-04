import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  FunctionDeclaration,
  Tool,
} from '@google/generative-ai';
import {
  AIResponse,
  AITool,
  AIToolCall,
  GenerateOptions,
  IAIProvider,
} from '../interfaces/ai-provider.interface';
import { AppLogger } from '../../../common/logger/logger.service';

@Injectable()
export class GeminiProvider implements IAIProvider {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;
  private readonly logger = new AppLogger('GeminiProvider');

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.gemini.apiKey');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set. AI features will not work until it is configured.',
      );
    }
    this.client = new GoogleGenerativeAI(apiKey ?? '');
    this.modelName = this.configService.get<string>('ai.gemini.model') ?? 'gemini-1.5-pro';
  }

  getProviderName(): string {
    return 'gemini';
  }

  async generate(options: GenerateOptions): Promise<AIResponse> {
    const { messages, tools, systemPrompt, temperature = 0.3, maxTokens = 8192 } = options;

    const geminiTools: Tool[] | undefined = tools?.length
      ? [
          {
            functionDeclarations: tools.map(
              (t): FunctionDeclaration => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters as never,
              }),
            ),
          },
        ]
      : undefined;

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      tools: geminiTools,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Convert our neutral ChatMessage format to Gemini's history format
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });

    this.logger.debug(
      `Gemini request: model=${this.modelName}, messages=${messages.length}, tools=${tools?.length ?? 0}`,
    );

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;
    const candidate = response.candidates?.[0];

    const toolCalls: AIToolCall[] = [];
    let textContent: string | null = null;

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          textContent = (textContent ?? '') + part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `${part.functionCall.name}-${Date.now()}`,
            name: part.functionCall.name,
            arguments: (part.functionCall.args as Record<string, unknown>) ?? {},
          });
        }
      }
    }

    const usageMeta = response.usageMetadata;

    return {
      content: textContent,
      toolCalls,
      usage: {
        promptTokens: usageMeta?.promptTokenCount ?? 0,
        completionTokens: usageMeta?.candidatesTokenCount ?? 0,
        totalTokens: usageMeta?.totalTokenCount ?? 0,
      },
      finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
    };
  }
}
