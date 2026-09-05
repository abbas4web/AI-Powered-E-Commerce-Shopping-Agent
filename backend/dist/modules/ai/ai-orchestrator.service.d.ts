import { IAIProvider } from './interfaces/ai-provider.interface';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ToolDispatcherService } from './tools/tool-dispatcher.service';
import { ConversationsService } from '../conversations/conversations.service';
export declare class AiOrchestratorService {
    private readonly aiProvider;
    private readonly toolDispatcher;
    private readonly conversationsService;
    private readonly logger;
    private readonly MAX_TOOL_ROUNDS;
    constructor(aiProvider: IAIProvider, toolDispatcher: ToolDispatcherService, conversationsService: ConversationsService);
    processMessage(userId: string, dto: ChatRequestDto): Promise<{
        conversationId: string;
        message: string;
    }>;
    private buildSystemPrompt;
}
