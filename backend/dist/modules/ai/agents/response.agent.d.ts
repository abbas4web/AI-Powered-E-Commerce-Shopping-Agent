import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AgentContext, IAgent } from './agent.types';
export declare class ResponseAgent implements IAgent {
    private readonly aiProvider;
    private readonly logger;
    private readonly BUNDLE_MAP;
    constructor(aiProvider: IAIProvider);
    run(context: AgentContext): Promise<AgentContext>;
    private dispatch;
    private handleClarification;
    private handleSearchResponse;
    private handleFollowUpResponse;
    private handleCompareResponse;
    private handleDetailsResponse;
    private handleWishlistAdd;
    private handleWishlistView;
    private handleRecommendationsResponse;
    private handleGeneralResponse;
    private generateExpertRecommendation;
    private generateNoResultsResponse;
    private generateGeneralAnswer;
    private buildSmartFollowUps;
    private getBundleSuggestions;
    private buildFallbackMessage;
}
