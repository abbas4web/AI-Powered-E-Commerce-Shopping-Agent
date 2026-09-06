import { IAIProvider } from '../interfaces/ai-provider.interface';
import { AgentContext, IAgent } from './agent.types';
export declare class RouterAgent implements IAgent {
    private readonly aiProvider;
    private readonly logger;
    constructor(aiProvider: IAIProvider);
    run(context: AgentContext): Promise<AgentContext>;
    private buildPrompt;
    private parseIntent;
    private detectFollowUp;
    private keywordClassify;
    private extractUUIDs;
}
