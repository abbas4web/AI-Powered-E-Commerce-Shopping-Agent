import { Injectable } from '@nestjs/common';
import { AppLogger } from '../../../common/logger/logger.service';
import { AgentContext, IAgent } from './agent.types';

/**
 * ClarificationAgent — decides whether to ask a question before searching.
 *
 * Rules:
 * - If the user mentioned a product type (laptop, phone) but NO budget → ask budget
 * - If the user is asking for a high-cost use case (gaming, professional) and has
 *   no budget → ask budget so we don't return random products
 * - If we have enough to search → let it through (never block unnecessarily)
 *
 * This agent sets context.clarificationQuestion if clarification is needed.
 * The orchestrator checks this and skips search/ranking.
 *
 * This agent NEVER calls an AI model — all logic is deterministic.
 */
@Injectable()
export class ClarificationAgent implements IAgent {
  private readonly logger = new AppLogger('ClarificationAgent');

  // Use cases that strongly benefit from knowing the budget
  private readonly BUDGET_SENSITIVE_USES = [
    'gaming', 'game', 'graphic design', 'video editing', 'professional',
    'creator', 'developer', 'development', 'flutter', 'machine learning',
    'data science', '3d', 'animation',
  ];

  // Product types where budget matters a lot
  private readonly BUDGET_SENSITIVE_PRODUCTS = [
    'laptop', 'smartphone', 'phone', 'mobile', 'tablet', 'camera',
    'tv', 'television', 'monitor',
  ];

  async run(context: AgentContext): Promise<AgentContext> {
    const { originalMessage, requirements, history } = context;

    // Don't ask clarification if:
    // 1. Budget is already provided
    // 2. History has a budget from previous turns
    // 3. This is a very simple/cheap product (earbuds, power banks)
    if (requirements?.maxPrice || requirements?.minPrice) return context;

    const historyHasBudget = history.some(
      (h) => h.role === 'user' && /₹|under|budget|k\b|thousand|lakh/i.test(h.content),
    );
    if (historyHasBudget) return context;

    const lower = originalMessage.toLowerCase();
    const isCheapProduct = /earbuds|earphone|headphone|power.?bank|cable|charger|case|cover|mouse|keyboard/i.test(lower);
    if (isCheapProduct) return context;

    const mentionsBudgetSensitiveProduct = this.BUDGET_SENSITIVE_PRODUCTS.some(
      (p) => lower.includes(p),
    );
    const mentionsBudgetSensitiveUse = this.BUDGET_SENSITIVE_USES.some(
      (u) => lower.includes(u),
    );

    if (!mentionsBudgetSensitiveProduct && !mentionsBudgetSensitiveUse) return context;

    // Build a focused single question
    const productType = this.extractProductType(lower) ?? 'this';
    const useCase = this.extractUseCase(lower);

    const question = useCase
      ? `What's your budget for a ${productType} for ${useCase}? (e.g. under ₹50,000 or under ₹1,00,000)`
      : `What's your budget for ${productType === 'this' ? 'this' : 'the ' + productType}? (e.g. under ₹50,000 or no limit)`;

    this.logger.debug(`Asking clarification: ${question}`);
    context.clarificationQuestion = question;
    context.missingRequirement = 'budget';
    context.intent = 'CLARIFICATION';

    return context;
  }

  private extractProductType(lower: string): string | null {
    const types = ['laptop', 'phone', 'smartphone', 'tablet', 'camera', 'tv', 'monitor'];
    return types.find((t) => lower.includes(t)) ?? null;
  }

  private extractUseCase(lower: string): string | null {
    const uses = [
      'gaming', 'graphic design', 'video editing', 'development', 'coding',
      'photography', 'flutter', 'machine learning', 'professional work', 'college',
    ];
    return uses.find((u) => lower.includes(u)) ?? null;
  }
}
