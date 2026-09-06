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
        const storedMessages = conversation.messages;
        const history = storedMessages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        const structuredState = conversation.structuredState ?? {};
        const previousSearchResults = structuredState.lastRankedProducts ?? [];
        let context = {
            userId,
            conversationId: conversation.id,
            originalMessage: message,
            history,
            previousSearchResults,
        };
        const pipelineTrace = [];
        try {
            this.logger.debug(`[Pipeline] RouterAgent`);
            context = await this.routerAgent.run(context);
            pipelineTrace.push(`RouterAgent → ${context.intent}`);
            switch (context.intent) {
                case 'PRODUCT_SEARCH':
                case 'PRODUCT_DETAILS':
                    this.logger.debug(`[Pipeline] SearchAgent`);
                    context = await this.searchAgent.run(context);
                    pipelineTrace.push(`SearchAgent → found ${context.totalFound}, query: "${context.requirements?.query}"`);
                    this.logger.debug(`[Pipeline] RankingAgent`);
                    context = await this.rankingAgent.run(context);
                    pipelineTrace.push(`RankingAgent → ranked ${context.rankedProducts?.length}, top: ${context.rankedProducts?.[0]?.score}`);
                    break;
                case 'FOLLOWUP_SEARCH': {
                    const needsNewSearch = this.followUpNeedsNewSearch(message);
                    if (needsNewSearch) {
                        this.logger.debug(`[Pipeline] FOLLOWUP — re-search with refinement`);
                        context = await this.searchAgent.run(context);
                        pipelineTrace.push(`SearchAgent (follow-up) → found ${context.totalFound}`);
                        context = await this.rankingAgent.run(context);
                        pipelineTrace.push(`RankingAgent → ranked ${context.rankedProducts?.length}`);
                    }
                    else {
                        this.logger.debug(`[Pipeline] FOLLOWUP — using previous results`);
                        pipelineTrace.push(`FOLLOWUP → using ${previousSearchResults.length} previous results`);
                    }
                    break;
                }
                case 'PRODUCT_COMPARE':
                    this.logger.debug(`[Pipeline] CompareAgent`);
                    context = await this.compareAgent.run(context);
                    pipelineTrace.push(`CompareAgent → ${context.comparisonResult?.products.length ?? 0} products`);
                    if (context.intent === 'PRODUCT_SEARCH') {
                        context = await this.searchAgent.run(context);
                        context = await this.rankingAgent.run(context);
                        pipelineTrace.push(`CompareAgent fallback → SearchAgent+RankingAgent`);
                    }
                    break;
                case 'GENERAL':
                case 'WISHLIST':
                case 'RECOMMENDATIONS':
                    pipelineTrace.push(`${context.intent} → ResponseAgent direct`);
                    break;
            }
            this.logger.debug(`[Pipeline] ResponseAgent`);
            context = await this.responseAgent.run(context);
            pipelineTrace.push(`ResponseAgent → done`);
            const newRankedProducts = context.rankedProducts ?? previousSearchResults;
            if (newRankedProducts.length) {
                await this.conversationsService.updateStructuredState(conversation.id, {
                    ...structuredState,
                    lastRankedProducts: newRankedProducts.slice(0, 10),
                    lastRequirements: context.requirements,
                    lastIntent: context.intent,
                }).catch((err) => this.logger.warn(`Failed to update structured state: ${err.message}`));
            }
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
            context.rankedProducts = previousSearchResults;
            context.followUpQuestions = [];
        }
        await this.conversationsService.addMessage(conversation.id, 'user', message);
        await this.conversationsService.addMessage(conversation.id, 'assistant', context.finalMessage ?? '');
        const isDev = process.env.NODE_ENV !== 'production';
        const productsToShow = context.rankedProducts ?? [];
        return {
            conversationId: conversation.id,
            message: context.finalMessage ?? '',
            intent: context.intent ?? 'GENERAL',
            products: productsToShow.map((p) => ({
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
    followUpNeedsNewSearch(message) {
        const lower = message.toLowerCase().trim();
        const needsNewSearch = [
            /only\s+\w+/,
            /increase.*(budget|price)/,
            /decrease.*(budget|price)/,
            /change.*(budget|price|range)/,
            /under\s+[\d,₹]+/,
            /above\s+[\d,₹]+/,
            /\b(add|include)\s+\w+\s+brand/,
        ];
        return needsNewSearch.some((p) => p.test(lower));
    }
    async persistRecommendations(userId, conversationId, rankedProducts) {
        const top5 = rankedProducts.slice(0, 5);
        await Promise.all(top5.map((p) => this.recommendationsService.saveRecommendation(userId, p.productId, p.score, p.matchedRequirements.length
            ? `Matches: ${p.matchedRequirements.join(', ')}`
            : 'Top match for your search', p.matchedRequirements, conversationId)));
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