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
        const { originalMessage, history, previousSearchResults } = context;
        const isFollowUp = this.detectFollowUp(originalMessage, history, previousSearchResults);
        if (isFollowUp) {
            this.logger.debug(`Detected follow-up message — using FOLLOWUP_SEARCH`);
            context.intent = 'FOLLOWUP_SEARCH';
            context.mentionedProductIds = this.extractUUIDs(originalMessage);
            return context;
        }
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: this.buildPrompt(originalMessage, history) }],
                temperature: 0.1,
                maxTokens: 128,
            });
            const raw = (response.content ?? '').trim().toUpperCase();
            const intent = this.parseIntent(raw);
            this.logger.debug(`RouterAgent classified: "${intent}" for message: "${originalMessage}"`);
            context.intent = intent;
        }
        catch (err) {
            this.logger.warn(`RouterAgent AI failed, using keyword fallback: ${err.message}`);
            context.intent = this.keywordClassify(originalMessage) ?? 'GENERAL';
        }
        context.mentionedProductIds = this.extractUUIDs(originalMessage);
        return context;
    }
    buildPrompt(message, history) {
        const recentHistory = history.slice(-6)
            .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 120)}`)
            .join('\n');
        return `You are a router for an AI shopping assistant. Classify the user's latest message.

${recentHistory ? `CONVERSATION HISTORY (recent):\n${recentHistory}\n` : ''}

LATEST MESSAGE: "${message}"

INTENT CATEGORIES:
- PRODUCT_SEARCH: User wants to find or buy products. Includes: "best X", "under budget", "I need X", "show me phones", "laptop for coding"
- PRODUCT_COMPARE: User wants to compare specific named products. Includes: "X vs Y", "compare A and B", "difference between X and Y", "which is better X or Y"
- PRODUCT_DETAILS: User wants details about one specific product. Includes: "tell me more about X", "specs of X", "what is the battery life of X"
- FOLLOWUP_SEARCH: User is refining a PREVIOUS search in context. Includes: "only ASUS", "increase budget to 90k", "which is best?", "in these which one", "sort by price", "show cheaper ones"
- WISHLIST: User wants to manage wishlist. Includes: "add to wishlist", "save this", "show my wishlist"
- RECOMMENDATIONS: User wants saved recommendations. Includes: "my recommendations", "what did you recommend"
- GENERAL: Everything else — greetings, general questions about technology, how-to questions, questions not about shopping

IMPORTANT RULES:
- If the message is a follow-up on previous products discussed (like "which is best?" or "compare these"), use FOLLOWUP_SEARCH
- If no products or budget is mentioned and the history has no shopping context, use GENERAL
- For greetings like "hi", "hello", "how are you" — always use GENERAL

Reply with ONLY the intent name. Nothing else.`;
    }
    parseIntent(raw) {
        const intents = [
            'PRODUCT_SEARCH',
            'PRODUCT_COMPARE',
            'PRODUCT_DETAILS',
            'FOLLOWUP_SEARCH',
            'WISHLIST',
            'RECOMMENDATIONS',
            'GENERAL',
        ];
        return intents.find((i) => raw.includes(i)) ?? 'GENERAL';
    }
    detectFollowUp(message, history, previousResults) {
        if (!history.length && !previousResults?.length)
            return false;
        const lower = message.toLowerCase().trim();
        const hasRecentSearch = history.some((h) => h.role === 'assistant' && h.content.includes('₹'));
        if (!hasRecentSearch && !previousResults?.length)
            return false;
        const hasUseCaseChange = /for\s+(gaming|game|graphic[\s-]*design|web[\s-]*dev|development|coding|programming|video[\s-]*editing|photography|business|flutter|android|study|work|office)/i.test(lower);
        if (hasUseCaseChange)
            return false;
        const followUpPatterns = [
            /^(which|what).*(best|cheapest|expensive|recommended|good)/,
            /^(in these|among these|from these|out of these)/,
            /^(only|just|show only|filter).+(brand|asus|dell|lenovo|apple|samsung|sony)/,
            /^(increase|decrease|change).*(budget|price|range)/,
            /^(compare these|compare them|compare all)/,
            /^(tell me more|more details|details about).*(first|second|third|this|that)/,
            /^(sort|order|rank).*(price|rating|score)/,
            /^(add (the )?(first|second|third|this|that)|save (this|it))/,
            /^(what about|how about).*(first|second|third)/,
            /^(the (first|second|third) one)/,
        ];
        return followUpPatterns.some((p) => p.test(lower));
    }
    keywordClassify(message) {
        const lower = message.toLowerCase().trim();
        if (/^(hi|hello|hey|how are you|what can you do|thanks|thank you)/.test(lower)) {
            return 'GENERAL';
        }
        if (/\bvs\b|\bversus\b|\bcompare\b|difference between/.test(lower)) {
            return 'PRODUCT_COMPARE';
        }
        if (/wishlist|add to (my )?wish/.test(lower))
            return 'WISHLIST';
        if (/my recommendations|saved recommendations/.test(lower))
            return 'RECOMMENDATIONS';
        if (/under|below|budget|₹|rs\.|rupee|laptop|phone|mobile|tablet|headphone|camera|tv|monitor/.test(lower) ||
            /need|want|buy|looking for|suggest|recommend|find me|show me|best/.test(lower)) {
            return 'PRODUCT_SEARCH';
        }
        return null;
    }
    extractUUIDs(message) {
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