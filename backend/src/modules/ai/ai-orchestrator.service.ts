import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider, ChatMessage } from './interfaces/ai-provider.interface';
import { AppLogger } from '../../common/logger/logger.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ToolDispatcherService } from './tools/tool-dispatcher.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SearchService } from '../search/search.service';

/**
 * AiOrchestratorService — Two-phase pipeline:
 *
 * Phase 1: Use AI to extract structured requirements from user message (no tools)
 * Phase 2: Run deterministic search using extracted requirements
 * Phase 3: Use AI to generate a helpful recommendation from the real search results
 *
 * This approach avoids tool-calling entirely, which is unreliable on free-tier models.
 * The AI never touches the database — only the SearchService does.
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new AppLogger('AiOrchestrator');

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAIProvider,
    private readonly toolDispatcher: ToolDispatcherService,
    private readonly conversationsService: ConversationsService,
    private readonly searchService: SearchService,
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

    let finalResponse = '';
    let structuredData: Record<string, unknown> = {};

    try {
      // ── Phase 1: Extract requirements ──────────────────────────────
      const extractionPrompt = this.buildExtractionPrompt(message);
      const extractionResponse = await this.callAI(
        [{ role: 'user', content: extractionPrompt }],
        undefined,
      );

      let requirements: Record<string, unknown> = {};
      const isProductQuery = this.isProductQuery(message);

      if (isProductQuery) {
        try {
          const cleaned = (extractionResponse.content ?? '')
            .replace(/^```json\s*/im, '')
            .replace(/^```\s*/im, '')
            .replace(/```\s*$/im, '')
            .trim();
          if (cleaned.startsWith('{')) {
            requirements = JSON.parse(cleaned) as Record<string, unknown>;
          }
        } catch {
          this.logger.warn('Could not parse requirements — using keyword search');
          requirements = { query: message };
        }

        // ── Phase 2: Deterministic search ──────────────────────────
        const searchResults = await this.searchService.searchProducts({
          query: (requirements.query as string) ?? message,
          categoryId: requirements.categoryId as string | undefined,
          brandId: requirements.brandId as string | undefined,
          minPrice: requirements.minPrice as number | undefined,
          maxPrice: requirements.maxPrice as number | undefined,
          limit: 8,
        });

        this.logger.debug(`Search returned ${searchResults.total} products`);

        // ── Phase 3: Generate recommendation ───────────────────────
        const recommendationPrompt = this.buildRecommendationPrompt(
          message,
          history,
          searchResults,
          requirements,
        );

        const recommendationResponse = await this.callAI(
          [{ role: 'user', content: recommendationPrompt }],
          undefined,
        );

        finalResponse = recommendationResponse.content ?? '';
      } else {
        // General conversation — no search needed
        const chatMessages: ChatMessage[] = [
          ...history,
          { role: 'user', content: message },
        ];
        const chatResponse = await this.callAI(chatMessages, this.buildChatSystemPrompt());
        finalResponse = chatResponse.content ?? '';
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const errorMsg = (err as Error).message ?? 'Unknown error';
      const errorStack = (err as Error).stack ?? '';
      this.logger.error(`AI processing failed: ${errorMsg}`, errorStack);
      // Return the actual error message in development for easier debugging
      finalResponse = process.env.NODE_ENV === 'development'
        ? `Error: ${errorMsg}`
        : 'I encountered an issue processing your request. Please try again.';
    }

    // Parse structured JSON if present
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
      // Plain text — use as-is
    }

    // Persist
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

  private async callAI(messages: ChatMessage[], systemPrompt?: string) {
    return this.aiProvider
      .generate({ messages, systemPrompt, temperature: 0.4, maxTokens: 2048 })
      .catch((err: Error) => {
        if (err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
          throw new HttpException(
            'The AI is rate limited. Please wait a moment and try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw err;
      });
  }

  /** Detect if this is a product search query or just conversation */
  private isProductQuery(message: string): boolean {
    const keywords = [
      'need', 'want', 'buy', 'looking for', 'recommend', 'suggest', 'find',
      'laptop', 'phone', 'mobile', 'headphone', 'tablet', 'camera', 'tv',
      'under', 'budget', '₹', 'rs', 'rupee', 'cheap', 'best', 'good',
      'compare', 'difference', 'vs', 'which is better',
    ];
    const lower = message.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  }

  private buildExtractionPrompt(message: string): string {
    return `Extract shopping requirements from this user message and return ONLY valid JSON.

User message: "${message}"

Return JSON with these fields (omit fields that are not mentioned):
{
  "query": "keyword search terms",
  "categoryId": "one of: laptops, smartphones, tablets, monitors, headphones, cameras, televisions",
  "brandId": "brand name if mentioned",
  "minPrice": number or null,
  "maxPrice": number or null,
  "minRam": number in GB or null,
  "minStorage": number in GB or null,
  "useCase": "description of intended use"
}

Return ONLY the JSON object, no explanation.`;
  }

  private buildRecommendationPrompt(
    userMessage: string,
    history: ChatMessage[],
    searchResults: { items: unknown[]; total: number },
    requirements: Record<string, unknown>,
  ): string {
    const historyText = history.length > 0
      ? `\nConversation history:\n${history.map((m) => `${m.role}: ${m.content}`).join('\n')}\n`
      : '';

    const productsText = searchResults.items.length > 0
      ? JSON.stringify(searchResults.items, null, 2)
      : 'No products found matching the criteria.';

    return `You are SmartShop AI, a helpful shopping assistant for an Indian e-commerce platform.
${historyText}
User asked: "${userMessage}"

Extracted requirements: ${JSON.stringify(requirements)}

Real products from our database:
${productsText}

Based ONLY on the products above, provide helpful recommendations. 
- Never invent products or specifications not shown above
- Mention actual product names, prices, and specs from the data
- If no products match, explain why and suggest adjusting the budget or requirements
- Keep response conversational and helpful

Respond in this JSON format:
{
  "message": "Your helpful recommendation (2-3 paragraphs)",
  "intent": "PRODUCT_RECOMMENDATION",
  "products": [
    {
      "productId": "actual id from the products list",
      "score": 85,
      "reason": "Why this matches their needs",
      "matchedRequirements": ["budget", "use case"],
      "warnings": []
    }
  ],
  "followUpQuestions": ["Any clarifying questions if needed"]
}`;
  }

  private buildChatSystemPrompt(): string {
    return `You are SmartShop AI, a friendly shopping assistant for an Indian e-commerce platform.
Help users find the best products for their needs.
Keep responses concise and helpful.
If the user asks about products, ask them about their budget and requirements.`;
  }
}
