import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(user: JwtPayload, dto: ChatRequestDto): Promise<{
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
