import { IAIProvider } from './interfaces/ai-provider.interface';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ToolDispatcherService } from './tools/tool-dispatcher.service';
import { ConversationsService } from '../conversations/conversations.service';
import { SearchService } from '../search/search.service';
export declare class AiOrchestratorService {
    private readonly aiProvider;
    private readonly toolDispatcher;
    private readonly conversationsService;
    private readonly searchService;
    private readonly logger;
    constructor(aiProvider: IAIProvider, toolDispatcher: ToolDispatcherService, conversationsService: ConversationsService, searchService: SearchService);
    processMessage(userId: string, dto: ChatRequestDto): Promise<{
        conversationId: string;
        message: string;
        intent: string;
        products: unknown[];
        followUpQuestions: string[];
    }>;
    private extractRequirements;
    private buildRecommendationPrompt;
    private buildChatSystemPrompt;
    private callAI;
    private isProductQuery;
}
