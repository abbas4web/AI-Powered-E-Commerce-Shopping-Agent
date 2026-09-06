import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AI_PROVIDER, IAIProvider, ChatMessage } from './interfaces/ai-provider.interface';
import { AppLogger } from '../../common/logger/logger.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ToolDispatcherService } from './tools/tool-dispatcher.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SearchService } from '../search/search.service';

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
      if (this.isProductQuery(message)) {
        // ── Phase 1: Extract requirements ────────────────────────────────
        const requirements = await this.extractRequirements(message);
        this.logger.debug(`Extracted requirements: ${JSON.stringify(requirements)}`);

        // ── Phase 2: Deterministic DB search (AI never touches the DB) ───
        const searchResults = await this.searchService.searchProducts({
          query: (requirements.query as string) ?? message,
          minPrice: requirements.minPrice as number | undefined,
          maxPrice: requirements.maxPrice as number | undefined,
          limit: 10,
        });
        this.logger.debug(`Search returned ${searchResults.total} products`);

        // ── Phase 3: AI generates recommendation from real data ──────────
        const prompt = this.buildRecommendationPrompt(
          message,
          history,
          searchResults,
          requirements,
        );

        // Use higher token limit for recommendation responses
        const aiResponse = await this.callAI(
          [{ role: 'user', content: prompt }],
          undefined,
          4000,
        );

        finalResponse = aiResponse.content ?? '';
      } else {
        // General conversation
        const aiResponse = await this.callAI(
          [...history, { role: 'user', content: message }],
          this.buildChatSystemPrompt(),
          1024,
        );
        finalResponse = aiResponse.content ?? '';
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const errorMsg = (err as Error).message ?? 'Unknown error';
      this.logger.error(`AI processing failed: ${errorMsg}`, (err as Error).stack);
      finalResponse = `Sorry, I encountered an issue: ${errorMsg}. Please try again.`;
    }

    // Parse structured JSON response from AI
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
    } catch (e) {
      this.logger.warn(`Failed to parse AI JSON response: ${(e as Error).message}`);
      // Plain text response — use as-is
    }

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

  // ── Private helpers ────────────────────────────────────────────────────────

  private async extractRequirements(message: string): Promise<Record<string, unknown>> {
    const prompt = `Extract shopping requirements from this message and return ONLY a JSON object.

Message: "${message}"

JSON fields to extract (only include what is mentioned):
- "query": string — product type + key specs as search keywords (e.g. "laptop", "smartphone camera")
- "maxPrice": number — maximum budget in INR (e.g. 80000)
- "minPrice": number — minimum price in INR if mentioned

Examples:
"I need laptop under 80k" → {"query":"laptop","maxPrice":80000}
"best phone under 40000 with good camera" → {"query":"smartphone","maxPrice":40000}
"headphones above 2000 under 5000" → {"query":"headphones","minPrice":2000,"maxPrice":5000}

Return ONLY the JSON, nothing else.`;

    try {
      const response = await this.callAI([{ role: 'user', content: prompt }], undefined, 256);
      const raw = (response.content ?? '').replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
      if (raw.startsWith('{')) {
        return JSON.parse(raw) as Record<string, unknown>;
      }
    } catch (e) {
      this.logger.warn(`Requirement extraction failed: ${(e as Error).message}`);
    }
    return { query: message };
  }

  private buildRecommendationPrompt(
    userMessage: string,
    history: ChatMessage[],
    searchResults: { items: unknown[]; total: number },
    requirements: Record<string, unknown>,
  ): string {
    const historyText = history.length > 0
      ? `Previous conversation:\n${history.slice(-4).map((m) => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : '';

    // Slim product objects — only fields the AI needs, no full nested objects
    type PrismaProduct = {
      id: string;
      name: string;
      price: number;
      originalPrice?: number | null;
      rating?: number;
      reviewCount?: number;
      description?: string;
      specifications?: unknown;
      brand?: { name: string };
      category?: { name: string };
    };

    const slimProducts = (searchResults.items as PrismaProduct[]).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      brand: p.brand?.name,
      category: p.category?.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      // Trim description to save tokens
      description: (p.description ?? '').slice(0, 120),
      // Only include key specs
      specs: p.specifications,
    }));

    const count = slimProducts.length;
    const productsJson = JSON.stringify(slimProducts, null, 2);

    return `${historyText}You are SmartShop AI. A user is shopping for products on an Indian e-commerce platform.

User request: "${userMessage}"
Budget: ${requirements.maxPrice ? `under ₹${requirements.maxPrice}` : 'not specified'}

Our database returned these ${count} matching products:
${productsJson}

Your task:
- Write a helpful shopping recommendation based ONLY on the products above
- Mention ALL ${count} products by name with their price
- Explain why each product is suitable for the user's needs
- Use actual specs from the data (RAM, processor, battery, etc.)
- Rank them from best match to least suitable

You MUST return valid JSON in exactly this format:
{
  "message": "Your recommendation text here — mention all ${count} products with names and prices",
  "intent": "PRODUCT_RECOMMENDATION",
  "products": [
    {"productId": "${slimProducts[0]?.id ?? 'id1'}", "score": 90, "reason": "reason", "matchedRequirements": ["budget"], "warnings": []},
    {"productId": "${slimProducts[1]?.id ?? 'id2'}", "score": 85, "reason": "reason", "matchedRequirements": ["budget"], "warnings": []}
  ],
  "followUpQuestions": ["One follow-up question"]
}

CRITICAL RULES:
1. The "products" array MUST have ${count} entries — one per product above
2. Use the exact "id" values from the product data
3. Return ONLY valid JSON — no text before or after the JSON`;
  }

  private buildChatSystemPrompt(): string {
    return `You are SmartShop AI, a helpful shopping assistant for an Indian e-commerce platform.
Answer questions helpfully and concisely.
If asked about products, ask for budget and requirements so you can search the catalog.`;
  }

  private async callAI(
    messages: ChatMessage[],
    systemPrompt?: string,
    maxTokens = 2048,
  ) {
    return this.aiProvider
      .generate({ messages, systemPrompt, temperature: 0.3, maxTokens })
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

  private isProductQuery(message: string): boolean {
    const keywords = [
      'need', 'want', 'buy', 'looking for', 'recommend', 'suggest', 'find',
      'laptop', 'phone', 'mobile', 'headphone', 'tablet', 'camera', 'tv',
      'under', 'above', 'budget', '₹', 'rs', 'rupee', 'cheap', 'best', 'good',
      'compare', 'difference', 'vs', 'which is better', 'show me',
    ];
    const lower = message.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  }
}
