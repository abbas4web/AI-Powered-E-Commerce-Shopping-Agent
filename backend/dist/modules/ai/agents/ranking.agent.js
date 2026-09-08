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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingAgent = void 0;
const common_1 = require("@nestjs/common");
const ranking_engine_service_1 = require("../../recommendations/ranking-engine.service");
const logger_service_1 = require("../../../common/logger/logger.service");
let RankingAgent = class RankingAgent {
    constructor(rankingEngine) {
        this.rankingEngine = rankingEngine;
        this.logger = new logger_service_1.AppLogger('RankingAgent');
        this.USE_CASE_SIGNALS = {
            gaming: {
                nameKeywords: ['gaming', 'game', 'gamer', 'rog', 'legion', 'nitro', 'g15', 'g16', 'omen', 'titan'],
                descKeywords: ['gaming', 'game', 'rtx', 'gtx', 'esport', 'fps', 'refresh rate', '144hz', '165hz', '240hz'],
                specChecks: [
                    (s) => !!s.gpu?.toLowerCase().includes('rtx'),
                    (s) => !!s.gpu?.toLowerCase().includes('gtx'),
                    (s) => {
                        const display = s.display;
                        return display?.refreshRate >= 120;
                    },
                ],
                scoreBonus: 25,
            },
            'graphic design': {
                nameKeywords: ['xps', 'macbook', 'pro', 'zenbook', 'spectre', 'razer'],
                descKeywords: ['design', 'creative', 'color', 'oled', 'retina', 'xdr', 'srgb', 'dci-p3', '4k', 'professional', 'creator'],
                specChecks: [
                    (s) => {
                        const display = s.display;
                        return ['oled', 'retina', 'xdr', 'mini-led'].some((t) => display?.panelType?.toLowerCase().includes(t));
                    },
                    (s) => {
                        const display = s.display;
                        const res = display?.resolution ?? '';
                        const [w] = res.split('x').map(Number);
                        return w >= 2560;
                    },
                ],
                scoreBonus: 25,
            },
            'video editing': {
                nameKeywords: ['macbook', 'pro', 'xps', 'zenbook', 'legion', 'razer'],
                descKeywords: ['video', 'editing', 'creator', 'render', 'creative', 'gpu', '4k'],
                specChecks: [
                    (s) => s.ram >= 16,
                    (s) => s.storage >= 512,
                    (s) => !!s.gpu?.length,
                ],
                scoreBonus: 20,
            },
            development: {
                nameKeywords: ['thinkpad', 'xps', 'macbook', 'zenbook', 'ideapad', 'surface'],
                descKeywords: ['developer', 'development', 'coding', 'programming', 'flutter', 'android studio'],
                specChecks: [
                    (s) => s.ram >= 16,
                    (s) => s.storage >= 512,
                    (s) => {
                        const battery = s.battery;
                        return battery?.life >= 8;
                    },
                ],
                scoreBonus: 20,
            },
            'flutter development': {
                nameKeywords: ['macbook', 'thinkpad', 'xps', 'ideapad', 'zenbook'],
                descKeywords: ['developer', 'development', 'flutter', 'android', 'battery'],
                specChecks: [
                    (s) => s.ram >= 16,
                    (s) => {
                        const battery = s.battery;
                        return battery?.life >= 10;
                    },
                ],
                scoreBonus: 20,
            },
            photography: {
                nameKeywords: ['macbook', 'xps', 'zenbook', 'spectre'],
                descKeywords: ['photography', 'photo', 'color', 'display', 'creative', 'oled'],
                specChecks: [
                    (s) => {
                        const display = s.display;
                        return ['oled', 'retina', 'xdr'].some((t) => display?.panelType?.toLowerCase().includes(t));
                    },
                ],
                scoreBonus: 20,
            },
            business: {
                nameKeywords: ['thinkpad', 'latitude', 'elitebook', 'surface', 'xps', 'vostro'],
                descKeywords: ['business', 'professional', 'enterprise', 'security', 'vpro', 'prosupport'],
                specChecks: [
                    (s) => {
                        const battery = s.battery;
                        return battery?.life >= 8;
                    },
                ],
                scoreBonus: 15,
            },
        };
    }
    async run(context) {
        const { searchResults, requirements } = context;
        if (!searchResults?.length) {
            context.rankedProducts = [];
            return context;
        }
        const budgetMax = requirements?.maxPrice ?? 0;
        const inputs = searchResults.map((product) => ({
            productId: product.id,
            requirementMatchScore: this.computeRequirementMatchScore(product, context),
            performanceScore: this.computePerformanceScore(product, context),
            rating: product.rating,
            price: product.price,
            budgetMax,
            reviewSentiment: 0.7,
            reviewCount: product.reviewCount,
            viewCount: product.viewCount,
        }));
        const ranked = this.rankingEngine.rank(inputs);
        context.rankedProducts = ranked.map((r) => {
            const product = searchResults.find((p) => p.id === r.productId);
            return {
                productId: r.productId,
                name: product.name,
                price: product.price,
                brand: product.brand,
                imageUrl: product.imageUrl,
                score: r.finalScore,
                breakdown: r.breakdown,
                matchedRequirements: this.buildMatchedRequirements(product, context),
                warnings: this.buildWarnings(product, context),
            };
        });
        this.logger.debug(`Ranked ${context.rankedProducts.length} products for use cases: [${requirements?.useCases?.join(', ') ?? 'none'}]`);
        this.logger.debug(`Top 3: ${context.rankedProducts.slice(0, 3).map((p) => `${p.name}(${p.score})`).join(', ')}`);
        return context;
    }
    computeRequirementMatchScore(product, context) {
        const req = context.requirements;
        if (!req)
            return 65;
        let score = 50;
        const specs = product.specifications;
        const nameLower = product.name.toLowerCase();
        const descLower = product.description.toLowerCase();
        const specsStr = JSON.stringify(specs).toLowerCase();
        if (req.maxPrice) {
            if (product.price <= req.maxPrice)
                score += 20;
            else
                score -= 20;
        }
        if (req.minPrice && product.price >= req.minPrice)
            score += 5;
        if (req.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
            score += 15;
        }
        const useCases = (req.useCases ?? []).map((u) => u.toLowerCase());
        for (const useCase of useCases) {
            const signalKey = Object.keys(this.USE_CASE_SIGNALS).find((k) => useCase.includes(k) || k.includes(useCase));
            if (signalKey) {
                const signals = this.USE_CASE_SIGNALS[signalKey];
                let useCaseScore = 0;
                if (signals.nameKeywords.some((kw) => nameLower.includes(kw))) {
                    useCaseScore += signals.scoreBonus;
                }
                const descMatches = signals.descKeywords.filter((kw) => descLower.includes(kw));
                useCaseScore += Math.min(descMatches.length * 5, signals.scoreBonus * 0.6);
                const specMatches = signals.specChecks.filter((fn) => {
                    try {
                        return fn(specs);
                    }
                    catch {
                        return false;
                    }
                });
                useCaseScore += specMatches.length * 8;
                score += Math.round(useCaseScore);
            }
            else {
                if (nameLower.includes(useCase) || descLower.includes(useCase))
                    score += 10;
            }
        }
        for (const feature of req.mustHaveFeatures ?? []) {
            const f = feature.toLowerCase();
            if (descLower.includes(f) || nameLower.includes(f) || specsStr.includes(f)) {
                score += 8;
            }
        }
        return Math.min(100, Math.max(0, score));
    }
    computePerformanceScore(product, context) {
        const specs = product.specifications;
        const useCases = (context.requirements?.useCases ?? []).map((u) => u.toLowerCase());
        const isGaming = useCases.some((u) => u.includes('gaming') || u.includes('game'));
        const isDesign = useCases.some((u) => u.includes('design') || u.includes('video') || u.includes('photo') || u.includes('creative'));
        let score = 40;
        const ram = specs.ram;
        if (ram) {
            if (ram >= 64)
                score += 25;
            else if (ram >= 32)
                score += 20;
            else if (ram >= 16)
                score += 15;
            else if (ram >= 8)
                score += 8;
        }
        const storage = specs.storage;
        if (storage) {
            if (storage >= 2000)
                score += 15;
            else if (storage >= 1000)
                score += 12;
            else if (storage >= 512)
                score += 8;
            else if (storage >= 256)
                score += 4;
        }
        const gpu = (specs.gpu ?? '').toLowerCase();
        if (gpu) {
            if (gpu.includes('rtx 4090') || gpu.includes('rtx 4080'))
                score += 30;
            else if (gpu.includes('rtx 4070'))
                score += 25;
            else if (gpu.includes('rtx 4060'))
                score += 20;
            else if (gpu.includes('rtx 3080') || gpu.includes('rtx 3070'))
                score += 18;
            else if (gpu.includes('rtx') || gpu.includes('rx 6'))
                score += 12;
            else if (gpu.includes('arc') || gpu.includes('iris'))
                score += 5;
            else if (gpu.includes('m3') || gpu.includes('m2') || gpu.includes('m1'))
                score += 15;
        }
        const display = specs.display;
        if (display) {
            const panel = (display.panelType ?? '').toLowerCase();
            const refreshRate = display.refreshRate;
            const res = (display.resolution ?? '').split('x').map(Number);
            const width = res[0] ?? 0;
            if (isDesign) {
                if (['oled', 'mini-led', 'retina', 'xdr'].some((p) => panel.includes(p)))
                    score += 15;
                else if (panel.includes('ips'))
                    score += 8;
                if (width >= 3840)
                    score += 10;
                else if (width >= 2560)
                    score += 7;
            }
            if (isGaming) {
                if ((refreshRate ?? 0) >= 240)
                    score += 15;
                else if ((refreshRate ?? 0) >= 165)
                    score += 12;
                else if ((refreshRate ?? 0) >= 144)
                    score += 8;
                else if ((refreshRate ?? 0) >= 120)
                    score += 4;
            }
        }
        const battery = specs.battery;
        if (battery?.life && !isGaming) {
            if (battery.life >= 18)
                score += 10;
            else if (battery.life >= 12)
                score += 7;
            else if (battery.life >= 8)
                score += 4;
        }
        if (product.rating >= 4.7)
            score += 6;
        else if (product.rating >= 4.5)
            score += 4;
        else if (product.rating >= 4.0)
            score += 2;
        return Math.min(100, Math.max(0, score));
    }
    buildMatchedRequirements(product, context) {
        const matched = [];
        const req = context.requirements;
        const specs = product.specifications;
        const descLower = product.description.toLowerCase();
        const nameLower = product.name.toLowerCase();
        if (req?.maxPrice && product.price <= req.maxPrice)
            matched.push('budget');
        if (req?.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
            matched.push('brand');
        }
        for (const useCase of req?.useCases ?? []) {
            const uc = useCase.toLowerCase();
            const signalKey = Object.keys(this.USE_CASE_SIGNALS).find((k) => uc.includes(k) || k.includes(uc));
            if (signalKey) {
                const signals = this.USE_CASE_SIGNALS[signalKey];
                if (signals.nameKeywords.some((k) => nameLower.includes(k)) ||
                    signals.descKeywords.some((k) => descLower.includes(k))) {
                    matched.push(useCase);
                }
            }
        }
        for (const feature of req?.mustHaveFeatures ?? []) {
            if (JSON.stringify(specs).toLowerCase().includes(feature.toLowerCase())) {
                matched.push(feature);
            }
        }
        const gpu = specs.gpu ?? '';
        if (gpu.toLowerCase().includes('rtx'))
            matched.push('dedicated GPU');
        const ram = specs.ram;
        if (ram && ram >= 16)
            matched.push(`${ram}GB RAM`);
        if (product.rating >= 4.5)
            matched.push('top rated');
        return [...new Set(matched)];
    }
    buildWarnings(product, context) {
        const warnings = [];
        const req = context.requirements;
        const specs = product.specifications;
        if (req?.maxPrice && product.price > req.maxPrice) {
            warnings.push(`₹${(product.price - req.maxPrice).toLocaleString('en-IN')} over budget`);
        }
        const battery = specs.battery;
        const useCases = (req?.useCases ?? []).map((u) => u.toLowerCase());
        const isDev = useCases.some((u) => u.includes('develop') || u.includes('flutter'));
        if (isDev && battery?.life && battery.life < 6) {
            warnings.push('short battery life (<6h)');
        }
        const ram = specs.ram;
        const usesHeavyApps = useCases.some((u) => u.includes('gaming') || u.includes('design') || u.includes('video'));
        if (usesHeavyApps && ram && ram < 16) {
            warnings.push('consider 16GB+ RAM for this use case');
        }
        return warnings;
    }
};
exports.RankingAgent = RankingAgent;
exports.RankingAgent = RankingAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ranking_engine_service_1.RankingEngineService])
], RankingAgent);
//# sourceMappingURL=ranking.agent.js.map