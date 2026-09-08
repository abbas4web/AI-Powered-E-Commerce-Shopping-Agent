"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClarificationAgent = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../common/logger/logger.service");
let ClarificationAgent = class ClarificationAgent {
    constructor() {
        this.logger = new logger_service_1.AppLogger('ClarificationAgent');
        this.BUDGET_SENSITIVE_USES = [
            'gaming', 'game', 'graphic design', 'video editing', 'professional',
            'creator', 'developer', 'development', 'flutter', 'machine learning',
            'data science', '3d', 'animation',
        ];
        this.BUDGET_SENSITIVE_PRODUCTS = [
            'laptop', 'smartphone', 'phone', 'mobile', 'tablet', 'camera',
            'tv', 'television', 'monitor',
        ];
    }
    async run(context) {
        const { originalMessage, requirements, history } = context;
        if (requirements?.maxPrice || requirements?.minPrice)
            return context;
        const historyHasBudget = history.some((h) => h.role === 'user' && /₹|under|budget|k\b|thousand|lakh/i.test(h.content));
        if (historyHasBudget)
            return context;
        const lower = originalMessage.toLowerCase();
        const isCheapProduct = /earbuds|earphone|headphone|power.?bank|cable|charger|case|cover|mouse|keyboard/i.test(lower);
        if (isCheapProduct)
            return context;
        const mentionsBudgetSensitiveProduct = this.BUDGET_SENSITIVE_PRODUCTS.some((p) => lower.includes(p));
        const mentionsBudgetSensitiveUse = this.BUDGET_SENSITIVE_USES.some((u) => lower.includes(u));
        if (!mentionsBudgetSensitiveProduct && !mentionsBudgetSensitiveUse)
            return context;
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
    extractProductType(lower) {
        const types = ['laptop', 'phone', 'smartphone', 'tablet', 'camera', 'tv', 'monitor'];
        return types.find((t) => lower.includes(t)) ?? null;
    }
    extractUseCase(lower) {
        const uses = [
            'gaming', 'graphic design', 'video editing', 'development', 'coding',
            'photography', 'flutter', 'machine learning', 'professional work', 'college',
        ];
        return uses.find((u) => lower.includes(u)) ?? null;
    }
};
exports.ClarificationAgent = ClarificationAgent;
exports.ClarificationAgent = ClarificationAgent = __decorate([
    (0, common_1.Injectable)()
], ClarificationAgent);
//# sourceMappingURL=clarification.agent.js.map