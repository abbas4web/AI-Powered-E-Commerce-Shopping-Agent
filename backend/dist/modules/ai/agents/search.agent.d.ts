import { IAIProvider } from '../interfaces/ai-provider.interface';
import { SearchService } from '../../search/search.service';
import { AgentContext, IAgent } from './agent.types';
export declare class SearchAgent implements IAgent {
    private readonly aiProvider;
    private readonly searchService;
    private readonly logger;
    constructor(aiProvider: IAIProvider, searchService: SearchService);
    run(context: AgentContext): Promise<AgentContext>;
    private extractRequirements;
    private inferQueryFromHistory;
}
