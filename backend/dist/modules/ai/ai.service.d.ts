import { IAIProvider } from './interfaces/ai-provider.interface';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ChatRequestDto } from './dto/chat-request.dto';
export declare class AiService {
    private readonly aiProvider;
    private readonly orchestrator;
    private readonly logger;
    constructor(aiProvider: IAIProvider, orchestrator: AiOrchestratorService);
    chat(userId: string, dto: ChatRequestDto): Promise<{
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
}
