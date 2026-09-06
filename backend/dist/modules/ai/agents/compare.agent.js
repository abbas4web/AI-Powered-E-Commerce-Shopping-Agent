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
exports.CompareAgent = void 0;
const common_1 = require("@nestjs/common");
const ai_provider_interface_1 = require("../interfaces/ai-provider.interface");
const comparisons_service_1 = require("../../comparisons/comparisons.service");
const search_service_1 = require("../../search/search.service");
const logger_service_1 = require("../../../common/logger/logger.service");
let CompareAgent = class CompareAgent {
    constructor(aiProvider, comparisonsService, searchService) {
        this.aiProvider = aiProvider;
        this.comparisonsService = comparisonsService;
        this.searchService = searchService;
        this.logger = new logger_service_1.AppLogger('CompareAgent');
    }
    async run(context) {
        const { originalMessage, mentionedProductIds } = context;
        let productIds = mentionedProductIds ?? [];
        if (productIds.length < 2) {
            productIds = await this.resolveProductIdsFromMessage(originalMessage);
        }
        if (productIds.length < 2) {
            this.logger.debug('CompareAgent: not enough products found, falling back to search');
            context.intent = 'PRODUCT_SEARCH';
            return context;
        }
        try {
            const result = await this.comparisonsService.compare(productIds.slice(0, 4));
            context.comparisonResult = {
                products: result.products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    brand: typeof p.brand === 'object' && p.brand !== null
                        ? p.brand.name
                        : String(p.brand ?? ''),
                    rating: p.rating,
                    imageUrl: p.imageUrl,
                })),
                matrix: result.comparisonMatrix.map((row) => ({
                    attribute: row.attribute,
                    values: row.values,
                })),
            };
            this.logger.debug(`Comparison built for ${productIds.length} products`);
        }
        catch (err) {
            this.logger.warn(`CompareAgent failed: ${err.message}`);
            context.intent = 'PRODUCT_SEARCH';
        }
        return context;
    }
    async resolveProductIdsFromMessage(message) {
        try {
            const response = await this.aiProvider.generate({
                messages: [{
                        role: 'user',
                        content: `Extract the product names being compared from this message.
Message: "${message}"
Return ONLY a JSON array of product names, e.g. ["ASUS Vivobook 16", "Dell Inspiron 15"]
Return [] if no specific products are named.`,
                    }],
                temperature: 0.1,
                maxTokens: 128,
            });
            const raw = (response.content ?? '')
                .replace(/```json?\s*/gi, '')
                .replace(/```/g, '')
                .trim();
            if (raw.startsWith('[')) {
                const names = JSON.parse(raw);
                const ids = [];
                for (const name of names.slice(0, 4)) {
                    const result = await this.searchService.searchProducts({
                        query: name,
                        limit: 1,
                    });
                    const first = result.items[0];
                    if (first?.id)
                        ids.push(first.id);
                }
                return ids;
            }
        }
        catch (err) {
            this.logger.warn(`Product name resolution failed: ${err.message}`);
        }
        return [];
    }
};
exports.CompareAgent = CompareAgent;
exports.CompareAgent = CompareAgent = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_interface_1.AI_PROVIDER)),
    __metadata("design:paramtypes", [Object, comparisons_service_1.ComparisonsService,
        search_service_1.SearchService])
], CompareAgent);
//# sourceMappingURL=compare.agent.js.map