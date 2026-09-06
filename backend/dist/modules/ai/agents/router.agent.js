"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterAgent = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("../interfaces/ai-provider.interface");
const logger_service_1 = require("../../../common/logger/logger.service");
let RouterAgent = class RouterAgent {
    constructor(aiProvider) {
        this.aiProvider = aiProvider;
        this.logger = new logger_service_1.AppLogger('RouterAgent');
    }
    async run(context) {
        const { originalMessage } = context;
        const fastIntent = this.fastClassify(originalMessage);
        if (fastIntent) {
            this.logger.debug(`Fast-classified intent: ${fastIntent}`);
            context.intent = fastIntent;
            context.mentionedProductIds = this.extractProductIds(originalMessage);
            return context;
        }
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: this.buildPrompt(originalMessage) }],
                temperature: 0.1,
                maxTokens: 64,
            });
            const raw = (response.content ?? '').trim().toUpperCase();
            const intent = this.parseIntent(raw);
            this.logger.debug(`AI-classified intent: ${intent} (raw: "${raw}")`);
            context.intent = intent;
        }
        catch (err) {
            this.logger.warn(`RouterAgent AI call failed, using keyword fallback: ${err.message}`);
            context.intent = 'PRODUCT_SEARCH';
        }
        context.mentionedProductIds = this.extractProductIds(originalMessage);
        return context;
    }
    buildPrompt(message) {
        return `Classify this shopping assistant message into exactly one category.

Message: "${message}"

Categories:
- PRODUCT_SEARCH: user wants to find/buy products (includes "best X", "under budget", "I need X")
- PRODUCT_COMPARE: user wants to compare specific products ("X vs Y", "compare X and Y", "difference between")
- PRODUCT_DETAILS: user asks about a specific named product ("tell me about X", "specs of X")
- WISHLIST: user wants to save/view wishlist ("add to wishlist", "show my wishlist")
- RECOMMENDATIONS: user asks for saved recommendations ("show my recommendations")
- GENERAL: greetings, help questions, everything else

Reply with ONLY the category name, nothing else.`;
    }
    parseIntent(raw) {
        const validIntents = [
            'PRODUCT_SEARCH',
            'PRODUCT_COMPARE',
            'PRODUCT_DETAILS',
            'WISHLIST',
            'RECOMMENDATIONS',
            'GENERAL',
        ];
        const found = validIntents.find((i) => raw.includes(i));
        return found ?? 'PRODUCT_SEARCH';
    }
    fastClassify(message) {
        const lower = message.toLowerCase().trim();
        if (/^(hi|hello|hey|good\s*(morning|evening|afternoon)|how are you|what can you do|help)/.test(lower)) {
            return 'GENERAL';
        }
        if (/\bvs\b|\bversus\b|compare|difference between|which is better/.test(lower)) {
            return 'PRODUCT_COMPARE';
        }
        if (/wishlist|wish list|save (this|it)|add to (my )?wish/.test(lower)) {
            return 'WISHLIST';
        }
        if (/my recommendations|saved recommendations|show recommendations/.test(lower)) {
            return 'RECOMMENDATIONS';
        }
        if (/under|below|within|budget|₹|rs\.|rupee|laptop|phone|mobile|tablet|headphone|camera|tv|monitor/.test(lower) ||
            /need|want|buy|looking for|suggest|recommend|find me|show me|best/.test(lower)) {
            return 'PRODUCT_SEARCH';
        }
        return null;
    }
    extractProductIds(message) {
        const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
        return message.match(uuidPattern) ?? [];
    }
};
exports.RouterAgent = RouterAgent;
exports.RouterAgent = RouterAgent = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], RouterAgent);
//# sourceMappingURL=router.agent.js.map