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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const conversations_service_1 = require("../conversations/conversations.service");
const recommendations_service_1 = require("../recommendations/recommendations.service");
const router_agent_1 = require("./agents/router.agent");
const search_agent_1 = require("./agents/search.agent");
const compare_agent_1 = require("./agents/compare.agent");
const ranking_agent_1 = require("./agents/ranking.agent");
const response_agent_1 = require("./agents/response.agent");
let AiOrchestratorService = class AiOrchestratorService {
    constructor(conversationsService, recommendationsService, routerAgent, searchAgent, compareAgent, rankingAgent, responseAgent) {
        this.conversationsService = conversationsService;
        this.recommendationsService = recommendationsService;
        this.routerAgent = routerAgent;
        this.searchAgent = searchAgent;
        this.compareAgent = compareAgent;
        this.rankingAgent = rankingAgent;
        this.responseAgent = responseAgent;
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
        let context = {
            userId,
            conversationId: conversation.id,
            originalMessage: message,
            history,
        };
        const pipelineTrace = [];
        try {
            this.logger.debug(`[Pipeline] Step 1 — RouterAgent`);
            context = await this.routerAgent.run(context);
            pipelineTrace.push(`RouterAgent → intent: ${context.intent}`);
            this.logger.debug(`[Pipeline] Intent: ${context.intent}`);
            switch (context.intent) {
                case 'PRODUCT_SEARCH':
                case 'PRODUCT_DETAILS':
                    this.logger.debug(`[Pipeline] Step 2 — SearchAgent`);
                    context = await this.searchAgent.run(context);
                    pipelineTrace.push(`SearchAgent → found: ${context.totalFound} products, query: "${context.requirements?.query}"`);
                    this.logger.debug(`[Pipeline] Step 3 — RankingAgent`);
                    context = await this.rankingAgent.run(context);
                    pipelineTrace.push(`RankingAgent → ranked: ${context.rankedProducts?.length}, top score: ${context.rankedProducts?.[0]?.score}`);
                    break;
                case 'PRODUCT_COMPARE':
                    this.logger.debug(`[Pipeline] Step 2 — CompareAgent`);
                    context = await this.compareAgent.run(context);
                    pipelineTrace.push(`CompareAgent → compared: ${context.comparisonResult?.products.length ?? 0} products`);
                    if (context.intent === 'PRODUCT_SEARCH') {
                        this.logger.debug(`[Pipeline] Compare fallback → SearchAgent`);
                        pipelineTrace.push(`CompareAgent → fallback to SearchAgent`);
                        context = await this.searchAgent.run(context);
                        context = await this.rankingAgent.run(context);
                        pipelineTrace.push(`RankingAgent → ranked: ${context.rankedProducts?.length}`);
                    }
                    break;
                case 'GENERAL':
                case 'WISHLIST':
                case 'RECOMMENDATIONS':
                    pipelineTrace.push(`${context.intent} → no search needed`);
                    break;
            }
            this.logger.debug(`[Pipeline] Step 4 — ResponseAgent`);
            context = await this.responseAgent.run(context);
            pipelineTrace.push(`ResponseAgent → message generated`);
            if (context.rankedProducts?.length) {
                await this.persistRecommendations(userId, conversation.id, context.rankedProducts).catch((err) => this.logger.warn(`Failed to persist recommendations: ${err.message}`));
            }
        }
        catch (err) {
            if (err instanceof common_1.HttpException)
                throw err;
            const msg = err.message ?? 'Unknown error';
            this.logger.error(`Pipeline failed: ${msg}`, err.stack);
            context.finalMessage = 'Sorry, something went wrong. Please try again.';
            context.rankedProducts = [];
            context.followUpQuestions = [];
        }
        await this.conversationsService.addMessage(conversation.id, 'user', message);
        await this.conversationsService.addMessage(conversation.id, 'assistant', context.finalMessage ?? '');
        const isDev = process.env.NODE_ENV !== 'production';
        return {
            conversationId: conversation.id,
            message: context.finalMessage ?? '',
            intent: context.intent ?? 'GENERAL',
            products: (context.rankedProducts ?? []).map((p) => ({
                productId: p.productId,
                score: p.score,
                reason: p.matchedRequirements.length
                    ? `Matches: ${p.matchedRequirements.join(', ')}`
                    : `${p.name} is a great match`,
                matchedRequirements: p.matchedRequirements,
                warnings: p.warnings,
            })),
            followUpQuestions: context.followUpQuestions ?? [],
            ...(isDev && { debug: { pipeline: pipelineTrace } }),
        };
    }
    async persistRecommendations(userId, conversationId, rankedProducts) {
        if (!rankedProducts?.length)
            return;
        const top5 = rankedProducts.slice(0, 5);
        await Promise.all(top5.map((p) => this.recommendationsService.saveRecommendation(userId, p.productId, p.score, p.matchedRequirements.length
            ? `Matches: ${p.matchedRequirements.join(', ')}`
            : `Top match for your search`, p.matchedRequirements, conversationId)));
    }
};
exports.AiOrchestratorService = AiOrchestratorService;
exports.AiOrchestratorService = AiOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService,
        recommendations_service_1.RecommendationsService,
        router_agent_1.RouterAgent,
        search_agent_1.SearchAgent,
        compare_agent_1.CompareAgent,
        ranking_agent_1.RankingAgent,
        response_agent_1.ResponseAgent])
], AiOrchestratorService);
//# sourceMappingURL=ai-orchestrator.service.js.map