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
exports.ResponseAgent = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("../interfaces/ai-provider.interface");
const logger_service_1 = require("../../../common/logger/logger.service");
function stripMarkdown(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, (m) => m.slice(1, -1))
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
        .replace(/^\|.*\|$/gm, (row) => row.replace(/\|/g, ' ').replace(/\s{2,}/g, ' ').trim())
        .replace(/^[\s-|:]+$/gm, '')
        .replace(/^>\s+/gm, '')
        .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '')
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
let ResponseAgent = class ResponseAgent {
    constructor(aiProvider) {
        this.aiProvider = aiProvider;
        this.logger = new logger_service_1.AppLogger('ResponseAgent');
        this.BUNDLE_MAP = {
            laptops: {
                category: 'Accessories',
                reason: 'Most laptop buyers also pick up these essentials',
                examples: ['Laptop bag/sleeve', 'USB-C hub', 'Wireless mouse', 'External SSD'],
            },
            smartphones: {
                category: 'Phone Accessories',
                reason: 'Complete your phone setup',
                examples: ['Screen protector', 'Phone case', 'Fast charger', 'TWS earbuds'],
            },
            headphones: {
                category: 'Audio Accessories',
                reason: 'Get the most from your headphones',
                examples: ['Carry case', 'Audio cable', 'Headphone stand'],
            },
        };
    }
    async run(context) {
        const result = await this.dispatch(context);
        if (result.finalMessage)
            result.finalMessage = stripMarkdown(result.finalMessage);
        return result;
    }
    async dispatch(context) {
        switch (context.intent) {
            case 'CLARIFICATION': return this.handleClarification(context);
            case 'PRODUCT_SEARCH': return this.handleSearchResponse(context);
            case 'FOLLOWUP_SEARCH': return this.handleFollowUpResponse(context);
            case 'PRODUCT_COMPARE': return this.handleCompareResponse(context);
            case 'PRODUCT_DETAILS': return this.handleDetailsResponse(context);
            case 'WISHLIST_ADD': return this.handleWishlistAdd(context);
            case 'WISHLIST_VIEW': return this.handleWishlistView(context);
            case 'RECOMMENDATIONS': return this.handleRecommendationsResponse(context);
            case 'GENERAL':
            default: return this.handleGeneralResponse(context);
        }
    }
    async handleClarification(context) {
        context.finalMessage = context.clarificationQuestion ?? 'Could you share a bit more about your requirements?';
        context.followUpQuestions = [];
        context.rankedProducts = [];
        return context;
    }
    async handleSearchResponse(context) {
        const { rankedProducts, requirements, originalMessage, history, userPreferences } = context;
        if (rankedProducts?.length) {
            context.finalMessage = await this.generateExpertRecommendation(originalMessage, rankedProducts, requirements, history, userPreferences);
            context.bundleSuggestions = this.getBundleSuggestions(rankedProducts[0]);
        }
        else {
            context.finalMessage = await this.generateNoResultsResponse(originalMessage, requirements, history);
        }
        context.followUpQuestions = this.buildSmartFollowUps(context);
        return context;
    }
    async handleFollowUpResponse(context) {
        const { rankedProducts, previousSearchResults, originalMessage, history } = context;
        const products = rankedProducts?.length ? rankedProducts : previousSearchResults ?? [];
        if (!products.length) {
            context.intent = 'GENERAL';
            return this.handleGeneralResponse(context);
        }
        const productList = products
            .map((p, i) => `${i + 1}. ${p.name} (${p.brand}) — ₹${p.price.toLocaleString('en-IN')} | Score: ${p.score}/100`)
            .join('\n');
        const recentHistory = history.slice(-4)
            .map((m) => `${m.role}: ${m.content.slice(0, 150)}`)
            .join('\n');
        const prompt = `You are SmartShop AI, a helpful Indian e-commerce expert.

Previous conversation:
${recentHistory}

Products being discussed:
${productList}

User's question: "${originalMessage}"

Answer naturally and helpfully. Be specific — use product names and prices.
If asked "which is best" → pick the top scored one and explain why clearly.
If asked to filter by brand → list only matching ones.
If asked to compare → highlight key differences.
Keep it under 150 words. Plain text only — no markdown, no bullet points.`;
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
                maxTokens: 384,
            });
            context.finalMessage = response.content ?? this.buildFallbackMessage(products);
        }
        catch {
            context.finalMessage = this.buildFallbackMessage(products);
        }
        if (!rankedProducts?.length && previousSearchResults?.length) {
            context.rankedProducts = previousSearchResults;
        }
        if (context.bestPickOnly && context.rankedProducts?.length) {
            context.rankedProducts = context.rankedProducts.slice(0, 1);
        }
        context.followUpQuestions = [];
        return context;
    }
    async handleCompareResponse(context) {
        const { comparisonResult, originalMessage, rankedProducts } = context;
        if (!comparisonResult?.products.length) {
            if ((rankedProducts?.length ?? 0) >= 2) {
                context.intent = 'FOLLOWUP_SEARCH';
                return this.handleFollowUpResponse(context);
            }
            context.finalMessage = "Please name the products you'd like to compare, e.g. 'Compare ASUS Vivobook vs Dell Inspiron'.";
            context.followUpQuestions = ['Which products would you like to compare?'];
            return context;
        }
        const productSummary = comparisonResult.products
            .map((p) => `${p.name} — ₹${p.price.toLocaleString('en-IN')} | Rating: ${p.rating}`)
            .join('\n');
        const keySpecs = comparisonResult.matrix.slice(0, 6)
            .map((row) => {
            const vals = row.values
                .map((v) => {
                const prod = comparisonResult.products.find((p) => p.id === v.productId);
                const val = v.value === null ? '—' : typeof v.value === 'object' ? JSON.stringify(v.value) : String(v.value);
                return `${prod?.name?.split(' ')[0]}: ${val}`;
            })
                .join(' vs ');
            return `${row.attribute}: ${vals}`;
        })
            .join('\n');
        const prompt = `You are SmartShop AI. Compare these products for the user.

User asked: "${originalMessage}"

Products:
${productSummary}

Key specs:
${keySpecs}

Write a clear, helpful comparison (under 180 words):
1. Highlight the main differences that matter for the user
2. State clearly which is better for which type of user
3. Give a definitive recommendation with a reason

Plain text only. Natural sentences. No markdown, no bullet points.`;
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
                maxTokens: 512,
            });
            context.finalMessage = response.content ?? `Comparing ${comparisonResult.products.map((p) => p.name).join(' and ')} — see the spec table below.`;
        }
        catch {
            context.finalMessage = `Here's a comparison of ${comparisonResult.products.map((p) => p.name).join(' and ')}. Check the spec table below.`;
        }
        context.followUpQuestions = ['Would you like to add one of these to your wishlist?', 'Want to see more similar options?'];
        return context;
    }
    async handleDetailsResponse(context) {
        const { rankedProducts, originalMessage } = context;
        if (!rankedProducts?.length) {
            context.finalMessage = await this.generateGeneralAnswer(originalMessage, context.history);
            context.followUpQuestions = [];
            return context;
        }
        const product = rankedProducts[0];
        const prompt = `You are SmartShop AI. The user wants details about a product.

User asked: "${originalMessage}"

Product: ${product.name} by ${product.brand}
Price: ₹${product.price.toLocaleString('en-IN')}
Score: ${product.score}/100
Strengths: ${product.matchedRequirements.join(', ') || 'good overall value'}
${product.warnings.length ? `Notes: ${product.warnings.join(', ')}` : ''}

Write a helpful, specific product overview (under 120 words).
- Focus on what makes this product good for its intended use
- Mention specific standout features
- Be honest about any limitations
Plain text only.`;
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
                maxTokens: 384,
            });
            context.finalMessage = response.content ?? `${product.name} by ${product.brand} — ₹${product.price.toLocaleString('en-IN')} (Score: ${product.score}/100)`;
        }
        catch {
            context.finalMessage = `${product.name} by ${product.brand} — ₹${product.price.toLocaleString('en-IN')}. Score: ${product.score}/100.`;
        }
        context.followUpQuestions = [
            'Would you like to compare this with similar products?',
            'Add this to your wishlist?',
        ];
        return context;
    }
    async handleWishlistAdd(context) {
        const { wishlistProductId, rankedProducts, previousSearchResults } = context;
        const products = rankedProducts?.length ? rankedProducts : previousSearchResults ?? [];
        const targetProduct = wishlistProductId
            ? products.find((p) => p.productId === wishlistProductId)
            : products[0];
        if (targetProduct) {
            context.finalMessage = `I've saved ${targetProduct.name} to your wishlist. You can view all saved items in the Wishlist section.`;
        }
        else {
            context.finalMessage = "To save a product, tap the heart icon on any product card. Or tell me which product you'd like to save and I'll help.";
        }
        context.followUpQuestions = ['Would you like to see similar products?'];
        return context;
    }
    async handleWishlistView(context) {
        context.finalMessage = "Your saved items are in the Wishlist section in the left sidebar. Tap it to see all your saved products and manage them.";
        context.followUpQuestions = ['Want me to find more products to add?'];
        return context;
    }
    async handleRecommendationsResponse(context) {
        context.finalMessage = "Your personalized recommendations are saved in the Recommendations section. They're updated every time the AI suggests products for you based on your conversations.";
        context.followUpQuestions = ['Want me to find new recommendations for you?'];
        return context;
    }
    async handleGeneralResponse(context) {
        context.finalMessage = await this.generateGeneralAnswer(context.originalMessage, context.history);
        context.followUpQuestions = [];
        return context;
    }
    async generateExpertRecommendation(message, products, requirements, history, userPreferences) {
        const recentHistory = history.slice(-3)
            .map((m) => `${m.role}: ${m.content.slice(0, 120)}`)
            .join('\n');
        const budget = requirements?.maxPrice
            ? `under ₹${requirements.maxPrice.toLocaleString('en-IN')}`
            : 'no specific budget';
        const useCases = requirements?.useCases?.join(', ') || '';
        const preferredBrand = userPreferences?.preferredBrands?.join(', ') || requirements?.brandName || '';
        const productList = products
            .map((p, i) => `${i + 1}. ${p.name} (${p.brand}) — ₹${p.price.toLocaleString('en-IN')} | Score: ${p.score}/100` +
            (p.matchedRequirements.length ? ` | Strengths: ${p.matchedRequirements.join(', ')}` : '') +
            (p.warnings.length ? ` | Watch out: ${p.warnings.join(', ')}` : ''))
            .join('\n');
        const prompt = `You are SmartShop AI, a trusted shopping advisor for Indian consumers.

${recentHistory ? `Context from conversation:\n${recentHistory}\n` : ''}User's request: "${message}"
Budget: ${budget}
${useCases ? `Use case: ${useCases}` : ''}
${preferredBrand ? `Preferred brand: ${preferredBrand}` : ''}

Products ranked by our system (best match first):
${productList}

Write a recommendation that sounds like advice from a trusted expert — not a product listing.

Guidelines:
- Open with a direct answer to what they asked
- Mention ALL ${products.length} products naturally (not as a bullet list)
- Explain WHY the top pick is best for their SPECIFIC situation
- Mention one standout feature per product that's relevant to their use case
- If a product has warnings, mention them honestly but constructively
- Close with a clear recommendation or next step
- Tone: helpful, confident, conversational — like a knowledgeable friend
- Length: 2-3 paragraphs, under 220 words

Plain text ONLY. No markdown. No bullet points. No headers. Natural prose.`;
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                maxTokens: 600,
            });
            return response.content ?? this.buildFallbackMessage(products);
        }
        catch (err) {
            this.logger.warn(`Expert recommendation failed: ${err.message}`);
            return this.buildFallbackMessage(products);
        }
    }
    async generateNoResultsResponse(message, requirements, history) {
        const query = requirements?.query ?? message;
        const budget = requirements?.maxPrice
            ? ` under ₹${requirements.maxPrice.toLocaleString('en-IN')}` : '';
        const prompt = `You are SmartShop AI. The user asked about "${message}" but we don't have ${query}${budget} in our catalog right now.

Be genuinely helpful — don't just say "not found":
1. Acknowledge what they're looking for
2. If relevant, share what to look for in ${query} (general buying guide)
3. Suggest checking back, adjusting budget, or trying a related search
4. If they asked a general question, answer it from general knowledge

Under 100 words. Plain text. Natural sentences.`;
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5,
                maxTokens: 256,
            });
            return response.content ?? `We don't have ${query}${budget} in our catalog right now. Try adjusting your search or check back later.`;
        }
        catch {
            return `We don't have ${query}${budget} right now. Try broadening your search.`;
        }
    }
    async generateGeneralAnswer(message, history) {
        const msgs = [];
        const recentHistory = history.slice(-6)
            .map((m) => `${m.role}: ${m.content.slice(0, 200)}`).join('\n');
        if (recentHistory)
            msgs.push({ role: 'user', content: recentHistory });
        msgs.push({ role: 'user', content: message });
        try {
            const response = await this.aiProvider.generate({
                messages: msgs,
                systemPrompt: `You are SmartShop AI, a knowledgeable Indian e-commerce shopping assistant.
Help with product questions, tech advice, buying guidance, and general shopping questions.
Use specific knowledge about Indian market pricing, popular brands, and value-for-money options.
Keep responses concise and genuinely useful.
Never invent specific product prices or model numbers — use approximate ranges when needed.
Plain text only — no markdown, no bullet points, natural sentences.`,
                temperature: 0.6,
                maxTokens: 384,
            });
            return response.content ?? "I'm SmartShop AI. Ask me anything about products and I'll help you find the best options!";
        }
        catch {
            return "I'm SmartShop AI, your shopping assistant. Tell me what you're looking for!";
        }
    }
    buildSmartFollowUps(context) {
        const { requirements, rankedProducts } = context;
        const questions = [];
        if (!rankedProducts?.length) {
            return ['Would you like to try a different search?', 'Can I help you find something similar?'];
        }
        if (requirements?.maxPrice && rankedProducts.some((p) => p.warnings.some((w) => w.includes('over budget')))) {
            questions.push('Would you like to increase your budget to see more options?');
        }
        if (!requirements?.useCases?.length) {
            const productType = requirements?.query ?? 'this';
            questions.push(`What will you mainly use ${productType === 'laptop' ? 'the laptop' : 'it'} for?`);
        }
        if (!requirements?.brandName && rankedProducts.length > 3) {
            questions.push('Do you prefer any particular brand?');
        }
        if (rankedProducts.length > 0 && rankedProducts[0].score >= 80) {
            questions.push(`Want to know more about the ${rankedProducts[0].name}?`);
        }
        if (rankedProducts.length >= 3) {
            questions.push(`Compare the top ${Math.min(rankedProducts.length, 3)} options?`);
        }
        return questions.slice(0, 2);
    }
    getBundleSuggestions(topProduct) {
        const category = topProduct.name.toLowerCase();
        if (/laptop|macbook|vivobook|inspiron|thinkpad|zenbook|ideapad|swift|pavilion/.test(category)) {
            return [this.BUNDLE_MAP.laptops];
        }
        if (/iphone|galaxy|pixel|redmi|oneplus|moto|narzo/.test(category)) {
            return [this.BUNDLE_MAP.smartphones];
        }
        if (/wh-|wf-|airpods|buds|rockerz|airdopes|boat|noise/.test(category)) {
            return [this.BUNDLE_MAP.headphones];
        }
        return [];
    }
    buildFallbackMessage(products) {
        if (!products.length)
            return "I couldn't find matching products. Try a different search.";
        return products
            .map((p, i) => `${i + 1}. ${p.name} by ${p.brand} — ₹${p.price.toLocaleString('en-IN')} (Score: ${p.score}/100)`)
            .join('\n');
    }
};
exports.ResponseAgent = ResponseAgent;
exports.ResponseAgent = ResponseAgent = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], ResponseAgent);
//# sourceMappingURL=response.agent.js.map