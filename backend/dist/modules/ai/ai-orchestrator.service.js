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
const preferences_service_1 = require("../preferences/preferences.service");
const wishlist_service_1 = require("../wishlist/wishlist.service");
const search_service_1 = require("../search/search.service");
const router_agent_1 = require("./agents/router.agent");
const clarification_agent_1 = require("./agents/clarification.agent");
const search_agent_1 = require("./agents/search.agent");
const compare_agent_1 = require("./agents/compare.agent");
const ranking_agent_1 = require("./agents/ranking.agent");
const response_agent_1 = require("./agents/response.agent");
let AiOrchestratorService = class AiOrchestratorService {
    constructor(conversationsService, recommendationsService, preferencesService, wishlistService, searchService, routerAgent, clarificationAgent, searchAgent, compareAgent, rankingAgent, responseAgent) {
        this.conversationsService = conversationsService;
        this.recommendationsService = recommendationsService;
        this.preferencesService = preferencesService;
        this.wishlistService = wishlistService;
        this.searchService = searchService;
        this.routerAgent = routerAgent;
        this.clarificationAgent = clarificationAgent;
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
        const structuredState = conversation.structuredState ?? {};
        const previousSearchResults = structuredState.lastRankedProducts ?? [];
        const previousRequirements = structuredState.lastRequirements;
        let userPreferences;
        try {
            const prefs = await this.preferencesService.get(userId);
            if (prefs) {
                userPreferences = {
                    preferredBrands: prefs.preferredBrands ?? [],
                    preferredCategories: prefs.preferredCategories ?? [],
                    budgetMin: prefs.budgetMin,
                    budgetMax: prefs.budgetMax,
                    useCases: prefs.useCases ?? [],
                };
            }
        }
        catch {
        }
        let context = {
            userId,
            conversationId: conversation.id,
            originalMessage: message,
            history,
            previousSearchResults,
            previousRequirements,
            userPreferences,
        };
        const pipelineTrace = [];
        try {
            context = await this.routerAgent.run(context);
            pipelineTrace.push(`Router → ${context.intent}`);
            if (context.intent === 'PRODUCT_SEARCH') {
                context = await this.clarificationAgent.run(context);
                if (context.intent === 'CLARIFICATION') {
                    pipelineTrace.push(`Clarification → ${context.clarificationQuestion}`);
                }
            }
            if (context.intent !== 'CLARIFICATION') {
                switch (context.intent) {
                    case 'PRODUCT_SEARCH':
                    case 'PRODUCT_DETAILS':
                        context = await this.searchAgent.run(context);
                        pipelineTrace.push(`Search → ${context.totalFound} products, query: "${context.requirements?.query}"`);
                        context = await this.rankingAgent.run(context);
                        pipelineTrace.push(`Ranking → top: ${context.rankedProducts?.[0]?.name} (${context.rankedProducts?.[0]?.score})`);
                        await this.loadSimilarProducts(context);
                        break;
                    case 'FOLLOWUP_SEARCH': {
                        const needsNew = this.followUpNeedsNewSearch(message);
                        const isBestPick = this.isBestPickQuestion(message);
                        if (needsNew) {
                            const isUseCaseChange = /for\s+(gaming|graphic[\s-]*design|web[\s-]*dev|video[\s-]*editing|photography|business)/i.test(message);
                            if (isUseCaseChange)
                                context.requirements = undefined;
                            context = await this.searchAgent.run(context);
                            context = await this.rankingAgent.run(context);
                            pipelineTrace.push(`Search (follow-up) → ${context.totalFound} products`);
                        }
                        else {
                            context.rankedProducts = previousSearchResults;
                            pipelineTrace.push(`Follow-up → using ${previousSearchResults.length} previous results`);
                        }
                        if (isBestPick) {
                            context.bestPickOnly = true;
                            pipelineTrace.push(`bestPickOnly flag set`);
                        }
                        break;
                    }
                    case 'PRODUCT_COMPARE':
                        context = await this.compareAgent.run(context);
                        pipelineTrace.push(`Compare → ${context.comparisonResult?.products.length ?? 0} products`);
                        if (context.intent === 'PRODUCT_SEARCH') {
                            context = await this.searchAgent.run(context);
                            context = await this.rankingAgent.run(context);
                        }
                        break;
                    case 'WISHLIST_ADD':
                        await this.handleWishlistAdd(context);
                        pipelineTrace.push(`Wishlist add → attempted`);
                        break;
                    case 'WISHLIST_VIEW':
                    case 'RECOMMENDATIONS':
                    case 'GENERAL':
                    default:
                        pipelineTrace.push(`${context.intent} → direct to ResponseAgent`);
                        break;
                }
            }
            context = await this.responseAgent.run(context);
            pipelineTrace.push(`Response → done`);
            const newProducts = context.rankedProducts ?? previousSearchResults;
            if (newProducts.length && context.intent !== 'CLARIFICATION') {
                await this.conversationsService.updateStructuredState(conversation.id, {
                    ...structuredState,
                    lastRankedProducts: newProducts.slice(0, 10),
                    lastRequirements: context.requirements ?? previousRequirements,
                    lastIntent: context.intent,
                }).catch((err) => this.logger.warn(`State update failed: ${err.message}`));
            }
            if (context.rankedProducts?.length) {
                await this.persistRecommendations(userId, conversation.id, context.rankedProducts)
                    .catch((err) => this.logger.warn(`Recommendations persist failed: ${err.message}`));
            }
            await this.updatePreferencesFromContext(userId, context)
                .catch((err) => this.logger.warn(`Preference update failed: ${err.message}`));
        }
        catch (err) {
            if (err instanceof common_1.HttpException)
                throw err;
            const msg = err.message ?? 'Unknown';
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
                breakdown: p.breakdown,
            })),
            followUpQuestions: context.followUpQuestions ?? [],
            bundleSuggestions: context.bundleSuggestions ?? [],
            similarProducts: (context.similarProducts ?? []).map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                brand: p.brand,
                imageUrl: p.imageUrl,
                rating: p.rating,
            })),
            ...(isDev && { debug: { pipeline: pipelineTrace } }),
        };
    }
    async handleWishlistAdd(context) {
        const { userId, wishlistProductId, rankedProducts, previousSearchResults } = context;
        const products = rankedProducts?.length ? rankedProducts : previousSearchResults ?? [];
        let productId = wishlistProductId;
        if (!productId) {
            const lower = context.originalMessage.toLowerCase();
            const ordinalMatch = lower.match(/(first|1st|second|2nd|third|3rd|top)/);
            if (ordinalMatch) {
                const idx = ['first', '1st'].includes(ordinalMatch[1]) ? 0
                    : ['second', '2nd'].includes(ordinalMatch[1]) ? 1 : 2;
                productId = products[idx]?.productId;
            }
            else {
                productId = products[0]?.productId;
            }
        }
        if (productId) {
            try {
                await this.wishlistService.addToWishlist(userId, productId);
                context.wishlistProductId = productId;
            }
            catch {
            }
        }
    }
    async updatePreferencesFromContext(userId, context) {
        const { requirements } = context;
        if (!requirements)
            return;
        const updates = {};
        if (requirements.maxPrice && requirements.maxPrice > 0) {
            updates.budgetMax = requirements.maxPrice;
        }
        if (requirements.minPrice && requirements.minPrice > 0) {
            updates.budgetMin = requirements.minPrice;
        }
        if (requirements.useCases?.length) {
            updates.useCases = requirements.useCases;
        }
        if (Object.keys(updates).length > 0) {
            await this.preferencesService.upsert(userId, updates);
        }
    }
    followUpNeedsNewSearch(message) {
        const lower = message.toLowerCase().trim();
        const useCaseChange = [
            /for\s+(gaming|game|graphic\s*design|web\s*dev|development|coding|programming|video\s*editing|photography|business|flutter|android)/,
            /(gaming|graphic\s*design|web\s*dev|video\s*editing|photography)\s*(laptop|phone|pc)?/,
            /best\s+(gaming|design|coding|programming|developer)/,
        ];
        if (useCaseChange.some((p) => p.test(lower)))
            return true;
        const budgetChange = [
            /only\s+\w+/, /increase.*(budget|price)/, /decrease.*(budget|price)/,
            /change.*(budget|price|range)/, /under\s+[\d,₹]+/, /above\s+[\d,₹]+/,
            /\b(add|include)\s+\w+\s+brand/,
        ];
        return budgetChange.some((p) => p.test(lower));
    }
    isBestPickQuestion(message) {
        const lower = message.toLowerCase().trim();
        const hasUseCase = /for\s+(gaming|game|graphic|design|web|dev|coding|programming|video|photography|business|flutter|android|study|work|office)/i.test(lower);
        if (hasUseCase)
            return false;
        return [
            /^which (is |one is |laptop is |phone is )?(the )?best\??$/,
            /^(which|what) (one|should i (buy|get|pick|choose)|do you recommend)\??$/,
            /^recommend (one|me one|the best one)\??$/,
            /^(top pick|best one|pick one)\??$/,
        ].some((p) => p.test(lower));
    }
    async loadSimilarProducts(context) {
        try {
            const top = context.rankedProducts?.[0];
            if (!top)
                return;
            const topFull = context.searchResults?.find((p) => p.id === top.productId);
            if (!topFull?.categoryId)
                return;
            const similar = await this.searchService.findSimilar(top.productId, topFull.categoryId, 4);
            context.similarProducts = similar
                .filter((p) => !context.rankedProducts?.some((r) => r.productId === p.id))
                .map((p) => ({
                id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice,
                brand: p.brand?.name ?? '', category: p.category?.name ?? '',
                rating: p.rating, reviewCount: p.reviewCount, viewCount: p.viewCount,
                description: (p.description ?? '').slice(0, 120),
                specifications: p.specifications ?? {},
                imageUrl: p.imageUrl,
            }));
        }
        catch (err) {
            this.logger.warn(`Similar products failed: ${err.message}`);
        }
    }
    async persistRecommendations(userId, conversationId, products) {
        const top5 = products.slice(0, 5);
        await Promise.all(top5.map((p) => this.recommendationsService.saveRecommendation(userId, p.productId, p.score, p.matchedRequirements.length ? `Matches: ${p.matchedRequirements.join(', ')}` : 'Top match', p.matchedRequirements, conversationId)));
    }
};
exports.AiOrchestratorService = AiOrchestratorService;
exports.AiOrchestratorService = AiOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [conversations_service_1.ConversationsService,
        recommendations_service_1.RecommendationsService,
        preferences_service_1.PreferencesService,
        wishlist_service_1.WishlistService,
        search_service_1.SearchService,
        router_agent_1.RouterAgent,
        clarification_agent_1.ClarificationAgent,
        search_agent_1.SearchAgent,
        compare_agent_1.CompareAgent,
        ranking_agent_1.RankingAgent,
        response_agent_1.ResponseAgent])
], AiOrchestratorService);
//# sourceMappingURL=ai-orchestrator.service.js.map