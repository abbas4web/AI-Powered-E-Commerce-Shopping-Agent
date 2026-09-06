import { RankingEngineService } from '../../recommendations/ranking-engine.service';
import { AgentContext, IAgent } from './agent.types';
export declare class RankingAgent implements IAgent {
    private readonly rankingEngine;
    private readonly logger;
    constructor(rankingEngine: RankingEngineService);
    run(context: AgentContext): Promise<AgentContext>;
    private computeRequirementMatchScore;
    private computePerformanceScore;
    private buildMatchedRequirements;
    private buildWarnings;
}
