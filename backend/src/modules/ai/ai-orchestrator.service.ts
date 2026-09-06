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

        if (searchResults.items.length === 0) {
          // No results — ask AI to respond gracefully
          const noResultPrompt = `You are SmartShop AI. A user searched for "${message}" but we found no matching products in our catalog. Politely inform them and suggest they broaden their search or adjust their budget. Keep it brief and helpful. Return plain text only.`;
          const noResultResponse = await this.callAI(
            [{ role: 'user', content: noResultPrompt }],
            undefined,
            512,
          );
          finalResponse = noResultResponse.content ?? 'No products found matching your criteria. Try adjusting your budget or search terms.';
          structuredData = { intent: 'PRODUCT_SEARCH', products: [], followUpQuestions: [] };
        } else {
          // ── Phase 3: AI writes recommendation TEXT only ───────────────
          // The products array is built deterministically — NOT by the AI
          const textPrompt = this.buildTextOnlyPrompt(message, history, searchResults, requirements);
          const aiResponse = await this.callAI(
            [{ role: 'user', content: textPrompt }],
            undefined,
            2048,
          );

          finalResponse = aiResponse.content ?? '';

          // ── Build products array deterministically from search results ─
          type PrismaProduct = { id: string; name: string; price: number; [key: string]: unknown };
          const maxPrice = requirements.maxPrice as number | undefined;

          const rankedProducts = (searchResults.items as PrismaProduct[])
            .filter((p) => !maxPrice || p.price <= maxPrice)
            .map((p, idx) => ({
              productId: p.id,
              score: Math.max(95 - idx * 5, 60),
              reason: `${p.name} matches your requirements`,
              matchedRequirements: [
                ...(maxPrice ? ['budget'] : []),
                'specifications',
              ],
              warnings: [] as string[],
            }));

          structuredData = {
            intent: 'PRODUCT_RECOMMENDATION',
            products: rankedProducts,
            followUpQuestions: [],
          };
        }
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
      finalResponse = 'Sorry, I encountered an issue. Please try again.';
    }

    // Strip any accidental JSON wrapping from AI text response
    try {
      const cleaned = finalResponse
        .replace(/^```json\s*/im, '')
        .replace(/^```\s*/im, '')
        .replace(/```\s*$/im, '')
        .trim();
      if (cleaned.startsWith('{')) {
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;
        // Only use message field if AI returned JSON — ignore its products array
        if (parsed.message) finalResponse = parsed.message as string;
      }
    } catch {
      // Plain text — use as-is
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

  private buildTextOnlyPrompt(
    userMessage: string,
    history: ChatMessage[],
    searchResults: { items: unknown[]; total: number },
    requirements: Record<string, unknown>,
  ): string {
    const historyText = history.length > 0
      ? `Previous conversation:\n${history.slice(-4).map((m) => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : '';

    type PrismaProduct = {
      id: string;
      name: string;
      price: number;
      originalPrice?: number | null;
      rating?: number;
      description?: string;
      specifications?: unknown;
      brand?: { name: string };
    };

    const productList = (searchResults.items as PrismaProduct[])
      .map((p, i) =>
        `${i + 1}. ${p.name} by ${p.brand?.name ?? 'Unknown'} — ₹${p.price.toLocaleString('en-IN')}` +
        ` (Rating: ${p.rating ?? 'N/A'}/5)\n   ${(p.description ?? '').slice(0, 150)}`,
      )
      .join('\n\n');

    return `${historyText}You are SmartShop AI, a helpful shopping assistant for an Indian e-commerce platform.

User asked: "${userMessage}"
${requirements.maxPrice ? `Budget: under ₹${(requirements.maxPrice as number).toLocaleString('en-IN')}` : ''}

Here are the matching products from our catalog:

${productList}

Write a helpful, conversational recommendation that:
1. Mentions ALL ${searchResults.items.length} products by name with their price
2. Explains what each is good for based on its specs/description
3. Suggests which is best overall for the user's needs
4. Is friendly and easy to read

Write in plain text — no JSON, no markdown headers. Just helpful paragraphs.`;
  }

  private buildRecommendationPrompt(
    userMessage: string,
    history: ChatMessage[],
    searchResults: { items: unknown[]; total: number },
    requirements: Record<string, unknown>,
  ): string {
    return this.buildTextOnlyPrompt(userMessage, history, searchResults, requirements);
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
