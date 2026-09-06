import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AgentContext, IAgent } from './agent.types';
export declare class ResponseAgent implements IAgent {
    private readonly aiProvider;
    private readonly logger;
    constructor(aiProvider: IAIProvider);
    run(context: AgentContext): Promise<AgentContext>;
    private handleSearchResponse;
    private handleFollowUpResponse;
    private handleCompareResponse;
    private handleDetailsResponse;
    private handleWishlistResponse;
    private handleRecommendationsResponse;
    private handleGeneralResponse;
    private generateSearchResponse;
    private generateNoResultsResponse;
    private generateGeneralAnswer;
    private buildFallbackMessage;
    private buildFollowUps;
}
