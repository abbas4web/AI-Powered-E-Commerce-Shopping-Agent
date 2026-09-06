import { ChatRequestDto } from './dto/chat-request.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { RouterAgent } from './agents/router.agent';
import { SearchAgent } from './agents/search.agent';
import { CompareAgent } from './agents/compare.agent';
import { RankingAgent } from './agents/ranking.agent';
import { ResponseAgent } from './agents/response.agent';
export declare class AiOrchestratorService {
    private readonly conversationsService;
    private readonly recommendationsService;
    private readonly routerAgent;
    private readonly searchAgent;
    private readonly compareAgent;
    private readonly rankingAgent;
    private readonly responseAgent;
    private readonly logger;
    constructor(conversationsService: ConversationsService, recommendationsService: RecommendationsService, routerAgent: RouterAgent, searchAgent: SearchAgent, compareAgent: CompareAgent, rankingAgent: RankingAgent, responseAgent: ResponseAgent);
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
        }[];
        followUpQuestions: string[];
    }>;
    private followUpNeedsNewSearch;
    private persistRecommendations;
}
