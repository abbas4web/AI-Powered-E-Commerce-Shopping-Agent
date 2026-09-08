import { AgentContext, IAgent } from './agent.types';
export declare class ClarificationAgent implements IAgent {
    private readonly logger;
    private readonly BUDGET_SENSITIVE_USES;
    private readonly BUDGET_SENSITIVE_PRODUCTS;
    run(context: AgentContext): Promise<AgentContext>;
    private extractProductType;
    private extractUseCase;
}
