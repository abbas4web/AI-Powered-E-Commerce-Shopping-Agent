import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AgentContext, IAgent } from './agent.types';
export declare class ResponseAgent implements IAgent {
    private readonly aiProvider;
    private readonly logger;
    constructor(aiProvider: IAIProvider);
    run(context: AgentContext): Promise<AgentContext>;
    private handleSearchResponse;
    private handleCompareResponse;
    private handleDetailsResponse;
    private handleGeneralResponse;
    private buildNoResultsMessage;
    private buildFallbackMessage;
    private buildFollowUpQuestions;
}
