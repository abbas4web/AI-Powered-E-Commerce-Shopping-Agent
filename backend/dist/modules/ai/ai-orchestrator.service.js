"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("./interfaces/ai-provider.interface");
const logger_service_1 = require("../../common/logger/logger.service");
const tool_dispatcher_service_1 = require("./tools/tool-dispatcher.service");
const conversations_service_1 = require("../conversations/conversations.service");
const search_service_1 = require("../search/search.service");
let AiOrchestratorService = class AiOrchestratorService {
    constructor(aiProvider, toolDispatcher, conversationsService, searchService) {
        this.aiProvider = aiProvider;
        this.toolDispatcher = toolDispatcher;
        this.conversationsService = conversationsService;
        this.searchService = searchService;
        this.logger = new logger_service_1.AppLogger('AiOrchestrator');
    }
    async processMessage(userId, dto) {
        const { message, conversationId } = dto;
        const conversation = conversationId
            ? await this.conversationsService.findById(conversationId, userId)
            : await this.conversationsService.create(userId, message);
        const history = conversation.messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        let finalResponse = '';
        let structuredData = {};
        try {
            const extractionPrompt = this.buildExtractionPrompt(message);
            const extractionResponse = await this.callAI([{ role: 'user', content: extractionPrompt }], undefined);
            let requirements = {};
            const isProductQuery = this.isProductQuery(message);
            if (isProductQuery) {
                try {
                    const cleaned = (extractionResponse.content ?? '')
                        .replace(/^```json\s*/im, '')
                        .replace(/^```\s*/im, '')
                        .replace(/```\s*$/im, '')
                        .trim();
                    if (cleaned.startsWith('{')) {
                        requirements = JSON.parse(cleaned);
                    }
                }
                catch {
                    this.logger.warn('Could not parse requirements — using keyword search');
                    requirements = { query: message };
                }
                const searchResults = await this.searchService.searchProducts({
                    query: requirements.query ?? message,
                    categoryId: requirements.categoryId,
                    brandId: requirements.brandId,
                    minPrice: requirements.minPrice,
                    maxPrice: requirements.maxPrice,
                    limit: 8,
                });
                this.logger.debug(`Search returned ${searchResults.total} products`);
                const recommendationPrompt = this.buildRecommendationPrompt(message, history, searchResults, requirements);
                const recommendationResponse = await this.callAI([{ role: 'user', content: recommendationPrompt }], undefined);
                finalResponse = recommendationResponse.content ?? '';
            }
            else {
                const chatMessages = [
                    ...history,
                    { role: 'user', content: message },
                ];
                const chatResponse = await this.callAI(chatMessages, this.buildChatSystemPrompt());
                finalResponse = chatResponse.content ?? '';
            }
        }
        catch (err) {
            if (err instanceof common_1.HttpException)
                throw err;
            const errorMsg = err.message ?? 'Unknown error';
            const errorStack = err.stack ?? '';
            this.logger.error(`AI processing failed: ${errorMsg}`, errorStack);
            finalResponse = process.env.NODE_ENV === 'development'
                ? `Error: ${errorMsg}`
                : 'I encountered an issue processing your request. Please try again.';
        }
        try {
            const cleaned = finalResponse
                .replace(/^```json\s*/im, '')
                .replace(/^```\s*/im, '')
                .replace(/```\s*$/im, '')
                .trim();
            if (cleaned.startsWith('{')) {
                const parsed = JSON.parse(cleaned);
                finalResponse = parsed.message ?? finalResponse;
                structuredData = parsed;
            }
        }
        catch {
        }
        await this.conversationsService.addMessage(conversation.id, 'user', message);
        await this.conversationsService.addMessage(conversation.id, 'assistant', finalResponse);
        return {
            conversationId: conversation.id,
            message: finalResponse,
            intent: structuredData.intent ?? 'GENERAL',
            products: structuredData.products ?? [],
            followUpQuestions: structuredData.followUpQuestions ?? [],
        };
    }
    async callAI(messages, systemPrompt) {
        return this.aiProvider
            .generate({ messages, systemPrompt, temperature: 0.4, maxTokens: 2048 })
            .catch((err) => {
            if (err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
                throw new common_1.HttpException('The AI is rate limited. Please wait a moment and try again.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw err;
        });
    }
    isProductQuery(message) {
        const keywords = [
            'need', 'want', 'buy', 'looking for', 'recommend', 'suggest', 'find',
            'laptop', 'phone', 'mobile', 'headphone', 'tablet', 'camera', 'tv',
            'under', 'budget', '₹', 'rs', 'rupee', 'cheap', 'best', 'good',
            'compare', 'difference', 'vs', 'which is better',
        ];
        const lower = message.toLowerCase();
        return keywords.some((k) => lower.includes(k));
    }
    buildExtractionPrompt(message) {
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
    buildRecommendationPrompt(userMessage, history, searchResults, requirements) {
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
    buildChatSystemPrompt() {
        return `You are SmartShop AI, a friendly shopping assistant for an Indian e-commerce platform.
Help users find the best products for their needs.
Keep responses concise and helpful.
If the user asks about products, ask them about their budget and requirements.`;
    }
};
exports.AiOrchestratorService = AiOrchestratorService;
exports.AiOrchestratorService = AiOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, tool_dispatcher_service_1.ToolDispatcherService,
        conversations_service_1.ConversationsService,
        search_service_1.SearchService])
], AiOrchestratorService);
//# sourceMappingURL=ai-orchestrator.service.js.map