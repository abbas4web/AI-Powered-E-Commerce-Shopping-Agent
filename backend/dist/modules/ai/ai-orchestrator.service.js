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
            if (this.isProductQuery(message)) {
                const requirements = await this.extractRequirements(message);
                this.logger.debug(`Extracted requirements: ${JSON.stringify(requirements)}`);
                const searchResults = await this.searchService.searchProducts({
                    query: requirements.query ?? message,
                    minPrice: requirements.minPrice,
                    maxPrice: requirements.maxPrice,
                    limit: 10,
                });
                this.logger.debug(`Search returned ${searchResults.total} products`);
                if (searchResults.items.length === 0) {
                    const noResultPrompt = `You are SmartShop AI. A user searched for "${message}" but we found no matching products in our catalog. Politely inform them and suggest they broaden their search or adjust their budget. Keep it brief and helpful. Return plain text only.`;
                    const noResultResponse = await this.callAI([{ role: 'user', content: noResultPrompt }], undefined, 512);
                    finalResponse = noResultResponse.content ?? 'No products found matching your criteria. Try adjusting your budget or search terms.';
                    structuredData = { intent: 'PRODUCT_SEARCH', products: [], followUpQuestions: [] };
                }
                else {
                    const textPrompt = this.buildTextOnlyPrompt(message, history, searchResults, requirements);
                    const aiResponse = await this.callAI([{ role: 'user', content: textPrompt }], undefined, 2048);
                    finalResponse = aiResponse.content ?? '';
                    const maxPrice = requirements.maxPrice;
                    const rankedProducts = searchResults.items
                        .filter((p) => !maxPrice || p.price <= maxPrice)
                        .map((p, idx) => ({
                        productId: p.id,
                        score: Math.max(95 - idx * 5, 60),
                        reason: `${p.name} matches your requirements`,
                        matchedRequirements: [
                            ...(maxPrice ? ['budget'] : []),
                            'specifications',
                        ],
                        warnings: [],
                    }));
                    structuredData = {
                        intent: 'PRODUCT_RECOMMENDATION',
                        products: rankedProducts,
                        followUpQuestions: [],
                    };
                }
            }
            else {
                const aiResponse = await this.callAI([...history, { role: 'user', content: message }], this.buildChatSystemPrompt(), 1024);
                finalResponse = aiResponse.content ?? '';
            }
        }
        catch (err) {
            if (err instanceof common_1.HttpException)
                throw err;
            const errorMsg = err.message ?? 'Unknown error';
            this.logger.error(`AI processing failed: ${errorMsg}`, err.stack);
            finalResponse = 'Sorry, I encountered an issue. Please try again.';
        }
        try {
            const cleaned = finalResponse
                .replace(/^```json\s*/im, '')
                .replace(/^```\s*/im, '')
                .replace(/```\s*$/im, '')
                .trim();
            if (cleaned.startsWith('{')) {
                const parsed = JSON.parse(cleaned);
                if (parsed.message)
                    finalResponse = parsed.message;
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
    async extractRequirements(message) {
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
                return JSON.parse(raw);
            }
        }
        catch (e) {
            this.logger.warn(`Requirement extraction failed: ${e.message}`);
        }
        return { query: message };
    }
    buildTextOnlyPrompt(userMessage, history, searchResults, requirements) {
        const historyText = history.length > 0
            ? `Previous conversation:\n${history.slice(-4).map((m) => `${m.role}: ${m.content}`).join('\n')}\n\n`
            : '';
        const productList = searchResults.items
            .map((p, i) => `${i + 1}. ${p.name} by ${p.brand?.name ?? 'Unknown'} — ₹${p.price.toLocaleString('en-IN')}` +
            ` (Rating: ${p.rating ?? 'N/A'}/5)\n   ${(p.description ?? '').slice(0, 150)}`)
            .join('\n\n');
        return `${historyText}You are SmartShop AI, a helpful shopping assistant for an Indian e-commerce platform.

User asked: "${userMessage}"
${requirements.maxPrice ? `Budget: under ₹${requirements.maxPrice.toLocaleString('en-IN')}` : ''}

Here are the matching products from our catalog:

${productList}

Write a helpful, conversational recommendation that:
1. Mentions ALL ${searchResults.items.length} products by name with their price
2. Explains what each is good for based on its specs/description
3. Suggests which is best overall for the user's needs
4. Is friendly and easy to read

Write in plain text — no JSON, no markdown headers. Just helpful paragraphs.`;
    }
    buildRecommendationPrompt(userMessage, history, searchResults, requirements) {
        return this.buildTextOnlyPrompt(userMessage, history, searchResults, requirements);
    }
    buildChatSystemPrompt() {
        return `You are SmartShop AI, a helpful shopping assistant for an Indian e-commerce platform.
Answer questions helpfully and concisely.
If asked about products, ask for budget and requirements so you can search the catalog.`;
    }
    async callAI(messages, systemPrompt, maxTokens = 2048) {
        return this.aiProvider
            .generate({ messages, systemPrompt, temperature: 0.3, maxTokens })
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
            'under', 'above', 'budget', '₹', 'rs', 'rupee', 'cheap', 'best', 'good',
            'compare', 'difference', 'vs', 'which is better', 'show me',
        ];
        const lower = message.toLowerCase();
        return keywords.some((k) => lower.includes(k));
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