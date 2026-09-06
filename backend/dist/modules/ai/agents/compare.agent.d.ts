import { IAIProvider } from '../interfaces/ai-provider.interface';
import { ComparisonsService } from '../../comparisons/comparisons.service';
import { SearchService } from '../../search/search.service';
import { AgentContext, IAgent } from './agent.types';
export declare class CompareAgent implements IAgent {
    private readonly aiProvider;
    private readonly comparisonsService;
    private readonly searchService;
    private readonly logger;
    constructor(aiProvider: IAIProvider, comparisonsService: ComparisonsService, searchService: SearchService);
    run(context: AgentContext): Promise<AgentContext>;
    private resolveProductIdsFromMessage;
    private findProductByName;
}
