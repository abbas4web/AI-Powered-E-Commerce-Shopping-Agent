import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider, ChatMessage } from './interfaces/ai-provider.interface';
import { AppLogger } from '../../common/logger/logger.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { AI_TOOLS } from './tools/tool-definitions';
import { ToolDispatcherService } from './tools/tool-dispatcher.service';
import { ConversationsService } from '../conversations/conversations.service';

/**
 * AiOrchestratorService — the brain of the AI pipeline.
 *
 * Responsibilities:
 * 1. Load conversation history.
 * 2. Build the system prompt.
 * 3. Call the AI provider with tool definitions.
 * 4. If the AI requests tool calls, dispatch them and loop.
 * 5. Parse and return the structured final response.
 *
 * The orchestrator is intentionally kept separate from business logic.
 * It never accesses the database directly.
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new AppLogger('AiOrchestrator');
  private readonly MAX_TOOL_ROUNDS = 5;

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
    const history: ChatMessage[] = (
      conversation.messages as StoredMessage[]
    ).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Append the new user message
    history.push({ role: 'user', content: message });

    const systemPrompt = this.buildSystemPrompt();

    let messages = [...history];
    let toolRound = 0;
    let finalResponse: string | null = null;

    // Agentic loop — the AI can call tools before giving a final answer
    while (toolRound < this.MAX_TOOL_ROUNDS) {
      this.logger.debug(`AI round ${toolRound + 1} — provider=${this.aiProvider.getProviderName()}`);

      const response = await this.aiProvider.generate({
        messages,
        tools: AI_TOOLS,
        systemPrompt,
        temperature: 0.3,
      });

      if (response.finishReason === 'stop' || response.toolCalls.length === 0) {
        finalResponse = response.content;
        break;
      }

      // Dispatch tool calls and build tool result messages
      const toolResultMessages: ChatMessage[] = [];
      for (const toolCall of response.toolCalls) {
        this.logger.debug(`Tool call: ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);
        const result = await this.toolDispatcher.dispatch(userId, toolCall);
        toolResultMessages.push({
          role: 'user',
          content: `Tool result for ${toolCall.name}: ${JSON.stringify(result)}`,
        });
      }

      messages = [...messages, ...toolResultMessages];
      toolRound++;
    }

    if (finalResponse === null) {
      this.logger.warn('Max tool rounds reached without final response');
      finalResponse = 'I was unable to complete the request. Please try again.';
    }

    // Persist the exchange
    await this.conversationsService.addMessage(conversation.id, 'user', message);
    await this.conversationsService.addMessage(conversation.id, 'assistant', finalResponse);

    return {
      conversationId: conversation.id,
      message: finalResponse,
    };
  }

  private buildSystemPrompt(): string {
    return `You are SmartShop AI, an expert shopping assistant for an Indian e-commerce platform.

Your job is to understand the user's shopping needs, extract structured requirements, and recommend the best products.

RULES:
1. Always extract structured requirements before searching (budget, category, specs, use case).
2. Use the available tools to search and retrieve product data. Never invent product information.
3. Apply hard constraints strictly (budget limits, minimum specs must be honored).
4. Explain your recommendations clearly — mention why each product matches the requirements.
5. Ask follow-up questions if the requirements are ambiguous.
6. Prices are in Indian Rupees (₹) unless stated otherwise.
7. Never fabricate product names, prices, or specifications.
8. If no products match, explain why and suggest relaxing a constraint.

When recommending products, structure your response as JSON matching this schema:
{
  "message": "string",
  "intent": "PRODUCT_RECOMMENDATION | PRODUCT_SEARCH | COMPARISON | CLARIFICATION | GENERAL",
  "products": [
    {
      "productId": "string",
      "score": number,
      "reason": "string",
      "matchedRequirements": ["string"],
      "warnings": ["string"]
    }
  ],
  "followUpQuestions": ["string"]
}`;
  }
}
