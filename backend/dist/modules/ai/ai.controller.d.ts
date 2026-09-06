import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(user: JwtPayload, dto: ChatRequestDto): Promise<{
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
}
