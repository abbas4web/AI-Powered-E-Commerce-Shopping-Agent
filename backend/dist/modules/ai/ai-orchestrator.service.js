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
        this.MAX_TOOL_ROUNDS = 5;
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
        let messages = [...history];
        let toolRound = 0;
        let finalResponse = null;
        while (toolRound < this.MAX_TOOL_ROUNDS) {
            this.logger.debug(`AI round ${toolRound + 1} — provider=${this.aiProvider.getProviderName()}`);
            const response = await this.aiProvider.generate({
                messages,
                tools: tool_definitions_1.AI_TOOLS,
                systemPrompt,
                temperature: 0.3,
            }).catch((err) => {
                if (err.message?.includes('429') || err.message?.includes('Too Many Requests')) {
                    throw new common_1.HttpException('The AI service is rate limited. Please wait a moment and try again.', common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                throw err;
            });
            if (response.finishReason === 'stop' || response.toolCalls.length === 0) {
                finalResponse = response.content;
                break;
            }
            const toolResultMessages = [];
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
        await this.conversationsService.addMessage(conversation.id, 'user', message);
        await this.conversationsService.addMessage(conversation.id, 'assistant', finalResponse);
        return {
            conversationId: conversation.id,
            message: finalResponse,
        };
    }
    buildSystemPrompt() {
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
};
exports.AiOrchestratorService = AiOrchestratorService;
exports.AiOrchestratorService = AiOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, tool_dispatcher_service_1.ToolDispatcherService,
        conversations_service_1.ConversationsService])
], AiOrchestratorService);
//# sourceMappingURL=ai-orchestrator.service.js.map