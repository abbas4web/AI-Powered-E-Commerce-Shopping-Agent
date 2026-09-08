import { ChatRequestDto } from './dto/chat-request.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { PreferencesService } from '../preferences/preferences.service';
import { WishlistService } from '../wishlist/wishlist.service';
import { SearchService } from '../search/search.service';
import { RouterAgent } from './agents/router.agent';
import { ClarificationAgent } from './agents/clarification.agent';
import { SearchAgent } from './agents/search.agent';
import { CompareAgent } from './agents/compare.agent';
import { RankingAgent } from './agents/ranking.agent';
import { ResponseAgent } from './agents/response.agent';
export declare class AiOrchestratorService {
    private readonly conversationsService;
    private readonly recommendationsService;
    private readonly preferencesService;
    private readonly wishlistService;
    private readonly searchService;
    private readonly routerAgent;
    private readonly clarificationAgent;
    private readonly searchAgent;
    private readonly compareAgent;
    private readonly rankingAgent;
    private readonly responseAgent;
    private readonly logger;
    constructor(conversationsService: ConversationsService, recommendationsService: RecommendationsService, preferencesService: PreferencesService, wishlistService: WishlistService, searchService: SearchService, routerAgent: RouterAgent, clarificationAgent: ClarificationAgent, searchAgent: SearchAgent, compareAgent: CompareAgent, rankingAgent: RankingAgent, responseAgent: ResponseAgent);
    processMessage(userId: string, dto: ChatRequestDto): Promise<{
        debug?: {
            pipeline: string[];
        } | undefined;
        conversationId: string;
        message: string;
        intent: import("./agents/agent.types").AgentIntent;
        products: {
            productId: string;
            score: number;
            reason: string;
            matchedRequirements: string[];
            warnings: string[];
            breakdown: {
                requirementMatch: number;
                performance: number;
                rating: number;
                priceValue: number;
                reviewSentiment: number;
                popularity: number;
            };
        }[];
        followUpQuestions: string[];
        bundleSuggestions: import("./agents/agent.types").BundleSuggestion[];
        similarProducts: {
            id: string;
            name: string;
            price: number;
            brand: string;
            imageUrl: string | null | undefined;
            rating: number;
        }[];
    }>;
    private handleWishlistAdd;
    private updatePreferencesFromContext;
    private followUpNeedsNewSearch;
    private isBestPickQuestion;
    private loadSimilarProducts;
    private persistRecommendations;
}
