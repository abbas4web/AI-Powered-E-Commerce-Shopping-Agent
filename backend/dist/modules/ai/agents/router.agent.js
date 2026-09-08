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
        const wishlistIntent = this.detectWishlistIntent(originalMessage);
        if (wishlistIntent) {
            context.intent = wishlistIntent;
            context.mentionedProductIds = this.extractUUIDs(originalMessage);
            this.logger.debug(`Wishlist intent: ${wishlistIntent}`);
            return context;
        }
        const isClarificationAnswer = this.detectClarificationAnswer(originalMessage, history);
        if (isClarificationAnswer) {
            context.intent = 'PRODUCT_SEARCH';
            this.logger.debug(`Clarification answer detected — routing to PRODUCT_SEARCH`);
            return context;
        }
        const isFollowUp = this.detectFollowUp(originalMessage, history, previousSearchResults);
        if (isFollowUp) {
            context.intent = 'FOLLOWUP_SEARCH';
            context.mentionedProductIds = this.extractUUIDs(originalMessage);
            this.logger.debug(`Follow-up detected`);
            return context;
        }
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: this.buildPrompt(originalMessage, history) }],
                temperature: 0.1,
                maxTokens: 64,
            });
            const raw = (response.content ?? '').trim().toUpperCase();
            const intent = this.parseIntent(raw);
            this.logger.debug(`Intent: ${intent} for: "${originalMessage}"`);
            context.intent = intent;
        }
        catch (err) {
            this.logger.warn(`RouterAgent AI failed: ${err.message}`);
            context.intent = this.keywordClassify(originalMessage) ?? 'GENERAL';
        }
        context.mentionedProductIds = this.extractUUIDs(originalMessage);
        return context;
    }
    buildPrompt(message, history) {
        const recentHistory = history.slice(-6)
            .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 120)}`)
            .join('\n');
        return `You are a router for an AI shopping assistant. Classify the user's latest message into EXACTLY ONE category.

${recentHistory ? `CONVERSATION HISTORY:\n${recentHistory}\n` : ''}LATEST MESSAGE: "${message}"

CATEGORIES:
- PRODUCT_SEARCH: User wants to find/buy products. e.g. "best laptop under 80k", "I need a phone", "gaming laptop"
- PRODUCT_COMPARE: Compare specific named products. e.g. "ASUS vs Dell", "compare iPhone and Samsung"
- PRODUCT_DETAILS: Details about one product. e.g. "tell me more about MacBook", "specs of Dell XPS"
- FOLLOWUP_SEARCH: Refining previous results. e.g. "only ASUS", "increase budget", "which is cheapest?"
- CLARIFICATION: User's request is too vague to search meaningfully. e.g. "I need something good", "show me a laptop" with no other info
- WISHLIST_ADD: Save a product. e.g. "add to wishlist", "save this", "save the Dell one"
- WISHLIST_VIEW: View saved items. e.g. "show my wishlist", "what did I save?"
- RECOMMENDATIONS: View AI recommendations. e.g. "show my recommendations", "what did you recommend?"
- GENERAL: Greetings, general tech questions, anything else. e.g. "hi", "what specs should I look for?"

RULES:
- CLARIFICATION only when truly impossible to search (completely vague, no product type)
- If product type is mentioned (laptop, phone, etc.), use PRODUCT_SEARCH not CLARIFICATION
- For follow-ups on previous products, use FOLLOWUP_SEARCH
- Greetings are always GENERAL

Reply with ONLY the category name.`;
    }
    parseIntent(raw) {
        const intents = [
            'PRODUCT_SEARCH', 'PRODUCT_COMPARE', 'PRODUCT_DETAILS',
            'FOLLOWUP_SEARCH', 'CLARIFICATION',
            'WISHLIST_ADD', 'WISHLIST_VIEW',
            'RECOMMENDATIONS', 'GENERAL',
        ];
        return intents.find((i) => raw.includes(i)) ?? 'GENERAL';
    }
    detectClarificationAnswer(message, history) {
        const lastAssistant = [...history].reverse().find((h) => h.role === 'assistant');
        if (!lastAssistant)
            return false;
        const lastMsg = lastAssistant.content.toLowerCase();
        const isClarificationQuestion = lastMsg.includes("what's your budget") ||
            lastMsg.includes("what is your budget") ||
            lastMsg.includes("budget for") ||
            lastMsg.includes("could you share") ||
            lastMsg.includes("what will you primarily use") ||
            lastMsg.includes("what would you use") ||
            lastMsg.includes("what type of") ||
            (lastMsg.includes('?') && lastMsg.length < 200 && lastMsg.includes('budget'));
        if (!isClarificationQuestion)
            return false;
        const lower = message.toLowerCase().trim();
        const looksLikeAnswer = /under|below|above|around|₹|rs\.|rupee|lakh|k\b|thousand|budget|no limit|any budget/i.test(lower) ||
            /gaming|design|coding|development|college|school|office|work|study|flutter|android/i.test(lower) ||
            /yes|no|okay|ok|sure|any|doesn't matter|not sure/i.test(lower);
        return looksLikeAnswer;
    }
    detectWishlistIntent(message) {
        const lower = message.toLowerCase().trim();
        if (/show (my )?wishlist|view (my )?wishlist|what('s| is| did i) (in |in my |i )?save/i.test(lower)) {
            return 'WISHLIST_VIEW';
        }
        if (/(add|save|put).*(wishlist|wish list|later|saved)/i.test(lower) ||
            /^(save|add) (this|it|the (first|second|third|top))/i.test(lower)) {
            return 'WISHLIST_ADD';
        }
        return null;
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
        const patterns = [
            /^(which|what).*(best|cheapest|expensive|recommended|good)/,
            /^(in these|among these|from these|out of these)/,
            /^(only|just|show only|filter).+(brand|asus|dell|lenovo|apple|samsung|sony|hp|acer|msi|oneplus|google)/,
            /^(increase|decrease|change).*(budget|price|range)/,
            /^(compare these|compare them|compare all)/,
            /^(tell me more|more details|details about).*(first|second|third|this|that)/,
            /^(sort|order|rank).*(price|rating|score)/,
            /^(what about|how about).*(first|second|third)/,
            /^(the (first|second|third) one)/,
            /^(show|give).*(cheaper|expensive|budget|premium)/,
        ];
        return patterns.some((p) => p.test(lower));
    }
    keywordClassify(message) {
        const lower = message.toLowerCase().trim();
        if (/^(hi|hello|hey|how are you|what can you do|thanks|thank you)/.test(lower))
            return 'GENERAL';
        if (/\bvs\b|\bversus\b|\bcompare\b|difference between/.test(lower))
            return 'PRODUCT_COMPARE';
        if (/show (my )?wishlist/.test(lower))
            return 'WISHLIST_VIEW';
        if (/(add|save).*(wishlist|later)/.test(lower))
            return 'WISHLIST_ADD';
        if (/my recommendations|saved recommendations/.test(lower))
            return 'RECOMMENDATIONS';
        if (/under|below|budget|₹|rs\.|rupee|laptop|phone|mobile|tablet|headphone|camera|tv|monitor|power.?bank/.test(lower) ||
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