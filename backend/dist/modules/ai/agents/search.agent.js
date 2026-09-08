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
exports.SearchAgent = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("../interfaces/ai-provider.interface");
const search_service_1 = require("../../search/search.service");
const logger_service_1 = require("../../../common/logger/logger.service");
let SearchAgent = class SearchAgent {
    constructor(aiProvider, searchService) {
        this.aiProvider = aiProvider;
        this.searchService = searchService;
        this.logger = new logger_service_1.AppLogger('SearchAgent');
    }
    async run(context) {
        const { originalMessage, history } = context;
        const requirements = await this.extractRequirements(originalMessage, history);
        context.requirements = requirements;
        this.logger.debug(`Extracted: ${JSON.stringify(requirements)}`);
        const result = await this.searchService.searchProducts({
            query: requirements.query,
            minPrice: requirements.minPrice,
            maxPrice: requirements.maxPrice,
            brandName: requirements.brandName,
            limit: 10,
        });
        this.logger.debug(`Found ${result.total} products for query: "${requirements.query}"`);
        context.searchResults = result.items.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            brand: p.brand?.name ?? 'Unknown',
            category: p.category?.name ?? 'Unknown',
            rating: p.rating,
            reviewCount: p.reviewCount,
            viewCount: p.viewCount,
            description: (p.description ?? '').slice(0, 200),
            specifications: p.specifications ?? {},
            imageUrl: p.imageUrl,
        }));
        context.totalFound = result.total;
        return context;
    }
    async extractRequirements(message, history) {
        const recentHistory = history.slice(-4)
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n');
        const prompt = `Extract shopping requirements from this conversation and return ONLY a JSON object.

${recentHistory ? `Recent conversation:\n${recentHistory}\n` : ''}Current message: "${message}"

Return JSON (include only what is explicitly mentioned):
{
  "query": "product type as keywords (e.g. laptop, smartphone, headphones)",
  "maxPrice": number (max budget in INR, e.g. 80000),
  "minPrice": number (min price if mentioned),
  "brandName": "brand name if specified (e.g. ASUS, Samsung, Apple)",
  "useCases": ["array of use cases if mentioned (e.g. Flutter development, gaming, photography)"],
  "mustHaveFeatures": ["key features if mentioned (e.g. 16GB RAM, 5G, noise cancellation)"]
}

Examples:
"I need laptop under 80k for Flutter" → {"query":"laptop","maxPrice":80000,"useCases":["Flutter development"]}
"best phone under 40000 with good camera" → {"query":"smartphone","maxPrice":40000,"mustHaveFeatures":["good camera"]}
"only ASUS" (follow-up) → {"query":"laptop","maxPrice":80000,"brandName":"ASUS"} (carry forward from history)

Return ONLY the JSON. No explanation.`;
        try {
            const response = await this.aiProvider.generate({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                maxTokens: 256,
            });
            const raw = (response.content ?? '')
                .replace(/```json\s*/gi, '')
                .replace(/```/g, '')
                .trim();
            if (raw.startsWith('{')) {
                const parsed = JSON.parse(raw);
                return {
                    query: parsed.query ?? message,
                    minPrice: parsed.minPrice,
                    maxPrice: parsed.maxPrice,
                    brandName: parsed.brandName,
                    useCases: parsed.useCases,
                    mustHaveFeatures: parsed.mustHaveFeatures,
                };
            }
        }
        catch (err) {
            this.logger.warn(`Requirement extraction failed: ${err.message}`);
        }
        return { query: message };
    }
};
exports.SearchAgent = SearchAgent;
exports.SearchAgent = SearchAgent = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, search_service_1.SearchService])
], SearchAgent);
//# sourceMappingURL=search.agent.js.map