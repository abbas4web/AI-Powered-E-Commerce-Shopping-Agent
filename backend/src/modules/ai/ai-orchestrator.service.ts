import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider, ChatMessage } from './interfaces/ai-provider.interface';
import { AppLogger } from '../../common/logger/logger.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { AI_TOOLS } from './tools/tool-definitions';
import { ToolDispatcherService } from './tools/tool-dispatcher.service';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new AppLogger('AiOrchestrator');
  private readonly MAX_TOOL_ROUNDS = 3;

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly toolDispatcher: ToolDispatcherService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async processMessage(userId: string, dto: ChatRequestDto) {
    const { message, conversationId } = dto;

    // Load or create conversation
    const conversation = conversationId
      ? await this.conversationsService.findById(conversationId, userId)
      : await this.conversationsService.create(userId, message);

    type StoredMessage = { role: string; content: string; timestamp: string };
    const history: ChatMessage[] = (conversation.messages as StoredMessage[]).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Add the new user message
    history.push({ role: 'user', content: message });

    const systemPrompt = this.buildSystemPrompt();
    const messages: ChatMessage[] = [...history];
    let finalResponse = '';
    let structuredData: Record<string, unknown> = {};

    try {
      // Phase 1 — Call AI with tools to get search intent
      const firstResponse = await this.callAI(messages, systemPrompt, true);

      if (firstResponse.toolCalls.length > 0) {
        // AI wants to search — dispatch all tool calls
        const toolResults: string[] = [];

        for (const toolCall of firstResponse.toolCalls) {
          this.logger.debug(`Tool: ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);
          try {
            const result = await this.toolDispatcher.dispatch(userId, toolCall);
            toolResults.push(`${toolCall.name} results: ${JSON.stringify(result)}`);
          } catch (err) {
            this.logger.warn(`Tool ${toolCall.name} failed: ${(err as Error).message}`);
            toolResults.push(`${toolCall.name} failed: no results found`);
          }
        }

        // Phase 2 — Call AI again with tool results to generate final recommendation
        const contextMessage = `Here are the search results from the database:\n\n${toolResults.join('\n\n')}\n\nNow provide your recommendation based on these real results.`;

        messages.push({ role: 'user', content: contextMessage });

        const secondResponse = await this.callAI(messages, systemPrompt, false);
        finalResponse = secondResponse.content ?? '';
      } else {
        // No tools needed — direct response (greetings, clarifications, etc.)
        finalResponse = firstResponse.content ?? '';
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`AI processing failed: ${(err as Error).message}`);
      finalResponse = 'I encountered an issue processing your request. Please try again.';
    }

    // Parse structured JSON if AI returned it
    try {
      const cleaned = finalResponse
        .replace(/^```json\s*/im, '')
        .replace(/^```\s*/im, '')
        .replace(/```\s*$/im, '')
        .trim();

      if (cleaned.startsWith('{')) {
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;
        finalResponse = (parsed.message as string) ?? finalResponse;
        structuredData = parsed;
      }
    } catch {
      // Plain text response — use as-is
    }

    // Persist the exchange
    await this.conversationsService.addMessage(conversation.id, 'user', message);
    await this.conversationsService.addMessage(conversation.id, 'assistant', finalResponse);

    return {
      conversationId: conversation.id,
      message: finalResponse,
      intent: (structuredData.intent as string) ?? 'GENERAL',
      products: (structuredData.products as unknown[]) ?? [],
      followUpQuestions: (structuredData.followUpQuestions as string[]) ?? [],
    };
  }

  private async callAI(
    messages: ChatMessage[],
    systemPrompt: string,
    withTools: boolean,
  ) {
    return this.aiProvider
      .generate({
        messages,
        tools: withTools ? AI_TOOLS : undefined,
        systemPrompt,
        temperature: 0.4,
        maxTokens: 4096,
      })
      .catch((err: Error) => {
        if (err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
          throw new HttpException(
            'The AI is temporarily rate limited. Please wait a moment and try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        // Tool validation failed — retry without tools
        if (
          err.message?.includes('tool call validation') ||
          err.message?.includes('400') ||
          err.message?.includes('tool_use_failed')
        ) {
          this.logger.warn('Tool validation error — retrying without tools');
          return this.aiProvider.generate({
            messages,
            systemPrompt,
            temperature: 0.4,
            maxTokens: 4096,
          });
        }
        throw err;
      });
  }

  private buildSystemPrompt(): string {
    return `You are SmartShop AI, a helpful shopping assistant for an Indian e-commerce platform.

Your job:
1. Understand what the user wants to buy
2. Use the searchProducts tool to find matching products from the database
3. Recommend the best options with clear explanations

IMPORTANT RULES:
- Always use searchProducts to find real products before recommending
- Never invent product names, prices, or specifications  
- Prices are in Indian Rupees (₹)
- If the user says hello or asks a general question, respond conversationally without searching
- Keep responses clear and helpful

When you have search results, respond in this JSON format:
{
  "message": "Your helpful recommendation message here",
  "intent": "PRODUCT_RECOMMENDATION",
  "products": [
    {
      "productId": "the actual product id from search results",
      "score": 85,
      "reason": "Why this product is a good match",
      "matchedRequirements": ["budget", "RAM", "use case"],
      "warnings": []
    }
  ],
  "followUpQuestions": ["Any clarifying questions if needed"]
}

For greetings or general questions, respond with:
{
  "message": "Your conversational response",
  "intent": "GENERAL",
  "products": [],
  "followUpQuestions": []
}`;
  }
}
