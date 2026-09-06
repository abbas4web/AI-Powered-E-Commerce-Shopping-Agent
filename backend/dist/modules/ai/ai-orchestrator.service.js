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
const tool_definitions_1 = require("./tools/tool-definitions");
const tool_dispatcher_service_1 = require("./tools/tool-dispatcher.service");
const conversations_service_1 = require("../conversations/conversations.service");
let AiOrchestratorService = class AiOrchestratorService {
    constructor(aiProvider, toolDispatcher, conversationsService) {
        this.aiProvider = aiProvider;
        this.toolDispatcher = toolDispatcher;
        this.conversationsService = conversationsService;
        this.logger = new logger_service_1.AppLogger('AiOrchestrator');
        this.MAX_TOOL_ROUNDS = 3;
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
        history.push({ role: 'user', content: message });
        const systemPrompt = this.buildSystemPrompt();
        const messages = [...history];
        let finalResponse = '';
        let structuredData = {};
        try {
            const firstResponse = await this.callAI(messages, systemPrompt, true);
            if (firstResponse.toolCalls.length > 0) {
                const toolResults = [];
                for (const toolCall of firstResponse.toolCalls) {
                    this.logger.debug(`Tool: ${toolCall.name}(${JSON.stringify(toolCall.arguments)})`);
                    try {
                        const result = await this.toolDispatcher.dispatch(userId, toolCall);
                        toolResults.push(`${toolCall.name} results: ${JSON.stringify(result)}`);
                    }
                    catch (err) {
                        this.logger.warn(`Tool ${toolCall.name} failed: ${err.message}`);
                        toolResults.push(`${toolCall.name} failed: no results found`);
                    }
                }
                const contextMessage = `Here are the search results from the database:\n\n${toolResults.join('\n\n')}\n\nNow provide your recommendation based on these real results.`;
                messages.push({ role: 'user', content: contextMessage });
                const secondResponse = await this.callAI(messages, systemPrompt, false);
                finalResponse = secondResponse.content ?? '';
            }
            else {
                finalResponse = firstResponse.content ?? '';
            }
        }
        catch (err) {
            if (err instanceof common_1.HttpException)
                throw err;
            this.logger.error(`AI processing failed: ${err.message}`);
            finalResponse = 'I encountered an issue processing your request. Please try again.';
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
    async callAI(messages, systemPrompt, withTools) {
        return this.aiProvider
            .generate({
            messages,
            tools: withTools ? tool_definitions_1.AI_TOOLS : undefined,
            systemPrompt,
            temperature: 0.4,
            maxTokens: 4096,
        })
            .catch((err) => {
            if (err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
                throw new common_1.HttpException('The AI is temporarily rate limited. Please wait a moment and try again.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            if (err.message?.includes('tool call validation') ||
                err.message?.includes('400') ||
                err.message?.includes('tool_use_failed')) {
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
    buildSystemPrompt() {
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
};
exports.AiOrchestratorService = AiOrchestratorService;
exports.AiOrchestratorService = AiOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, tool_dispatcher_service_1.ToolDispatcherService,
        conversations_service_1.ConversationsService])
], AiOrchestratorService);
//# sourceMappingURL=ai-orchestrator.service.js.map