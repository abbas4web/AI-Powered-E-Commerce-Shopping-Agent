import { Injectable } from '@nestjs/common';
import {
  RankingEngineService,
  ProductRankingInput,
} from '../../recommendations/ranking-engine.service';
import { AppLogger } from '../../../common/logger/logger.service';
import {
  AgentContext,
  IAgent,
  RankedProduct,
  SlimProduct,
} from './agent.types';

/**
 * RankingAgent — deterministic, use-case-aware product scoring.
 *
 * Key design:
 * - Uses the extracted useCases[] to compute a use-case fit score
 * - Gaming laptops rank higher for "gaming" — not "graphic design"
 * - Graphic design laptops rank higher for "design" — not "gaming"
 * - Pure spec-based scoring for general queries
 * - Never calls an AI model
 */
@Injectable()
export class RankingAgent implements IAgent {
  private readonly logger = new AppLogger('RankingAgent');

  // Use-case → spec signals that indicate fitness for that use case
  private readonly USE_CASE_SIGNALS: Record<string, {
    nameKeywords: string[];
    descKeywords: string[];
    specChecks: ((specs: Record<string, unknown>) => boolean)[];
    scoreBonus: number;
  }> = {
    gaming: {
      nameKeywords: ['gaming', 'game', 'gamer', 'rog', 'legion', 'nitro', 'g15', 'g16', 'omen', 'titan'],
      descKeywords: ['gaming', 'game', 'rtx', 'gtx', 'esport', 'fps', 'refresh rate', '144hz', '165hz', '240hz'],
      specChecks: [
        (s) => !!(s.gpu as string)?.toLowerCase().includes('rtx'),
        (s) => !!(s.gpu as string)?.toLowerCase().includes('gtx'),
        (s) => {
          const display = s.display as Record<string, unknown> | undefined;
          return (display?.refreshRate as number) >= 120;
        },
      ],
      scoreBonus: 25,
    },
    'graphic design': {
      nameKeywords: ['xps', 'macbook', 'pro', 'zenbook', 'spectre', 'razer'],
      descKeywords: ['design', 'creative', 'color', 'oled', 'retina', 'xdr', 'srgb', 'dci-p3', '4k', 'professional', 'creator'],
      specChecks: [
        (s) => {
          const display = s.display as Record<string, unknown> | undefined;
          return ['oled', 'retina', 'xdr', 'mini-led'].some(
            (t) => (display?.panelType as string)?.toLowerCase().includes(t),
          );
        },
        (s) => {
          const display = s.display as Record<string, unknown> | undefined;
          const res = (display?.resolution as string) ?? '';
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
        (s) => (s.ram as number) >= 16,
        (s) => (s.storage as number) >= 512,
        (s) => !!(s.gpu as string)?.length,
      ],
      scoreBonus: 20,
    },
    development: {
      nameKeywords: ['thinkpad', 'xps', 'macbook', 'zenbook', 'ideapad', 'surface'],
      descKeywords: ['developer', 'development', 'coding', 'programming', 'flutter', 'android studio'],
      specChecks: [
        (s) => (s.ram as number) >= 16,
        (s) => (s.storage as number) >= 512,
        (s) => {
          const battery = s.battery as Record<string, unknown> | undefined;
          return (battery?.life as number) >= 8;
        },
      ],
      scoreBonus: 20,
    },
    'flutter development': {
      nameKeywords: ['macbook', 'thinkpad', 'xps', 'ideapad', 'zenbook'],
      descKeywords: ['developer', 'development', 'flutter', 'android', 'battery'],
      specChecks: [
        (s) => (s.ram as number) >= 16,
        (s) => {
          const battery = s.battery as Record<string, unknown> | undefined;
          return (battery?.life as number) >= 10;
        },
      ],
      scoreBonus: 20,
    },
    photography: {
      nameKeywords: ['macbook', 'xps', 'zenbook', 'spectre'],
      descKeywords: ['photography', 'photo', 'color', 'display', 'creative', 'oled'],
      specChecks: [
        (s) => {
          const display = s.display as Record<string, unknown> | undefined;
          return ['oled', 'retina', 'xdr'].some(
            (t) => (display?.panelType as string)?.toLowerCase().includes(t),
          );
        },
      ],
      scoreBonus: 20,
    },
    business: {
      nameKeywords: ['thinkpad', 'latitude', 'elitebook', 'surface', 'xps', 'vostro'],
      descKeywords: ['business', 'professional', 'enterprise', 'security', 'vpro', 'prosupport'],
      specChecks: [
        (s) => {
          const battery = s.battery as Record<string, unknown> | undefined;
          return (battery?.life as number) >= 8;
        },
      ],
      scoreBonus: 15,
    },
  };

  constructor(private readonly rankingEngine: RankingEngineService) {}

  async run(context: AgentContext): Promise<AgentContext> {
    const { searchResults, requirements } = context;

    if (!searchResults?.length) {
      context.rankedProducts = [];
      return context;
    }

    const budgetMax = requirements?.maxPrice ?? 0;

    const inputs: ProductRankingInput[] = searchResults.map((product) => ({
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
      const product = searchResults.find((p) => p.id === r.productId)!;
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
      } satisfies RankedProduct;
    });

    this.logger.debug(
      `Ranked ${context.rankedProducts.length} products for use cases: [${requirements?.useCases?.join(', ') ?? 'none'}]`,
    );
    this.logger.debug(
      `Top 3: ${context.rankedProducts.slice(0, 3).map((p) => `${p.name}(${p.score})`).join(', ')}`,
    );

    return context;
  }

  // ─── Scoring ───────────────────────────────────────────────────────────────

  private computeRequirementMatchScore(
    product: SlimProduct,
    context: AgentContext,
  ): number {
    const req = context.requirements;
    if (!req) return 65;

    let score = 50; // base
    const specs = product.specifications;
    const nameLower = product.name.toLowerCase();
    const descLower = product.description.toLowerCase();
    const specsStr = JSON.stringify(specs).toLowerCase();

    // ── Budget compliance (+20 for within budget) ──────────────────────────
    if (req.maxPrice) {
      if (product.price <= req.maxPrice) score += 20;
      else score -= 20; // penalize over-budget
    }
    if (req.minPrice && product.price >= req.minPrice) score += 5;

    // ── Brand match (+15) ──────────────────────────────────────────────────
    if (req.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
      score += 15;
    }

    // ── Use-case fit — this is the main differentiator ─────────────────────
    const useCases = (req.useCases ?? []).map((u) => u.toLowerCase());

    for (const useCase of useCases) {
      // Find the best matching signal group
      const signalKey = Object.keys(this.USE_CASE_SIGNALS).find(
        (k) => useCase.includes(k) || k.includes(useCase),
      );

      if (signalKey) {
        const signals = this.USE_CASE_SIGNALS[signalKey];
        let useCaseScore = 0;

        // Name keywords (strongest signal)
        if (signals.nameKeywords.some((kw) => nameLower.includes(kw))) {
          useCaseScore += signals.scoreBonus;
        }

        // Description keywords (moderate signal)
        const descMatches = signals.descKeywords.filter((kw) => descLower.includes(kw));
        useCaseScore += Math.min(descMatches.length * 5, signals.scoreBonus * 0.6);

        // Spec checks (technical confirmation)
        const specMatches = signals.specChecks.filter((fn) => {
          try { return fn(specs as Record<string, unknown>); } catch { return false; }
        });
        useCaseScore += specMatches.length * 8;

        score += Math.round(useCaseScore);
      } else {
        // Generic: check if use case appears in name/description
        if (nameLower.includes(useCase) || descLower.includes(useCase)) score += 10;
      }
    }

    // ── Must-have features ─────────────────────────────────────────────────
    for (const feature of req.mustHaveFeatures ?? []) {
      const f = feature.toLowerCase();
      if (descLower.includes(f) || nameLower.includes(f) || specsStr.includes(f)) {
        score += 8;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Performance score — spec quality, adjusted per use case.
   * Gaming: GPU weight is highest.
   * Graphic design: Display quality is highest.
   * General: Balanced across RAM, storage, battery.
   */
  private computePerformanceScore(
    product: SlimProduct,
    context: AgentContext,
  ): number {
    const specs = product.specifications as Record<string, unknown>;
    const useCases = (context.requirements?.useCases ?? []).map((u) => u.toLowerCase());
    const isGaming = useCases.some((u) => u.includes('gaming') || u.includes('game'));
    const isDesign = useCases.some((u) =>
      u.includes('design') || u.includes('video') || u.includes('photo') || u.includes('creative'),
    );

    let score = 40; // base

    // RAM
    const ram = specs.ram as number | undefined;
    if (ram) {
      if (ram >= 64) score += 25;
      else if (ram >= 32) score += 20;
      else if (ram >= 16) score += 15;
      else if (ram >= 8) score += 8;
    }

    // Storage
    const storage = specs.storage as number | undefined;
    if (storage) {
      if (storage >= 2000) score += 15;
      else if (storage >= 1000) score += 12;
      else if (storage >= 512) score += 8;
      else if (storage >= 256) score += 4;
    }

    // GPU (critical for gaming and design)
    const gpu = (specs.gpu as string ?? '').toLowerCase();
    if (gpu) {
      if (gpu.includes('rtx 4090') || gpu.includes('rtx 4080')) score += 30;
      else if (gpu.includes('rtx 4070')) score += 25;
      else if (gpu.includes('rtx 4060')) score += 20;
      else if (gpu.includes('rtx 3080') || gpu.includes('rtx 3070')) score += 18;
      else if (gpu.includes('rtx') || gpu.includes('rx 6')) score += 12;
      else if (gpu.includes('arc') || gpu.includes('iris')) score += 5;
      else if (gpu.includes('m3') || gpu.includes('m2') || gpu.includes('m1')) score += 15;
    }

    // Display quality (critical for design)
    const display = specs.display as Record<string, unknown> | undefined;
    if (display) {
      const panel = (display.panelType as string ?? '').toLowerCase();
      const refreshRate = display.refreshRate as number | undefined;
      const res = (display.resolution as string ?? '').split('x').map(Number);
      const width = res[0] ?? 0;

      if (isDesign) {
        // Penalize low-quality displays for design work
        if (['oled', 'mini-led', 'retina', 'xdr'].some((p) => panel.includes(p))) score += 15;
        else if (panel.includes('ips')) score += 8;
        if (width >= 3840) score += 10;
        else if (width >= 2560) score += 7;
      }

      if (isGaming) {
        // Refresh rate is critical for gaming
        if ((refreshRate ?? 0) >= 240) score += 15;
        else if ((refreshRate ?? 0) >= 165) score += 12;
        else if ((refreshRate ?? 0) >= 144) score += 8;
        else if ((refreshRate ?? 0) >= 120) score += 4;
      }
    }

    // Battery life (important for development/general, less for gaming)
    const battery = specs.battery as { life?: number } | undefined;
    if (battery?.life && !isGaming) {
      if (battery.life >= 18) score += 10;
      else if (battery.life >= 12) score += 7;
      else if (battery.life >= 8) score += 4;
    }

    // Rating bonus
    if (product.rating >= 4.7) score += 6;
    else if (product.rating >= 4.5) score += 4;
    else if (product.rating >= 4.0) score += 2;

    return Math.min(100, Math.max(0, score));
  }

  private buildMatchedRequirements(
    product: SlimProduct,
    context: AgentContext,
  ): string[] {
    const matched: string[] = [];
    const req = context.requirements;
    const specs = product.specifications as Record<string, unknown>;
    const descLower = product.description.toLowerCase();
    const nameLower = product.name.toLowerCase();

    if (req?.maxPrice && product.price <= req.maxPrice) matched.push('budget');
    if (req?.brandName && product.brand.toLowerCase().includes(req.brandName.toLowerCase())) {
      matched.push('brand');
    }

    // Use-case specific matches
    for (const useCase of req?.useCases ?? []) {
      const uc = useCase.toLowerCase();
      const signalKey = Object.keys(this.USE_CASE_SIGNALS).find(
        (k) => uc.includes(k) || k.includes(uc),
      );
      if (signalKey) {
        const signals = this.USE_CASE_SIGNALS[signalKey];
        if (
          signals.nameKeywords.some((k) => nameLower.includes(k)) ||
          signals.descKeywords.some((k) => descLower.includes(k))
        ) {
          matched.push(useCase);
        }
      }
    }

    // Must-have features
    for (const feature of req?.mustHaveFeatures ?? []) {
      if (JSON.stringify(specs).toLowerCase().includes(feature.toLowerCase())) {
        matched.push(feature);
      }
    }

    // Automatic spec labels
    const gpu = (specs.gpu as string) ?? '';
    if (gpu.toLowerCase().includes('rtx')) matched.push('dedicated GPU');
    const ram = specs.ram as number | undefined;
    if (ram && ram >= 16) matched.push(`${ram}GB RAM`);
    if (product.rating >= 4.5) matched.push('top rated');

    return [...new Set(matched)];
  }

  private buildWarnings(
    product: SlimProduct,
    context: AgentContext,
  ): string[] {
    const warnings: string[] = [];
    const req = context.requirements;
    const specs = product.specifications as Record<string, unknown>;

    if (req?.maxPrice && product.price > req.maxPrice) {
      warnings.push(`₹${(product.price - req.maxPrice).toLocaleString('en-IN')} over budget`);
    }

    const battery = specs.battery as { life?: number } | undefined;
    const useCases = (req?.useCases ?? []).map((u) => u.toLowerCase());
    const isDev = useCases.some((u) => u.includes('develop') || u.includes('flutter'));

    if (isDev && battery?.life && battery.life < 6) {
      warnings.push('short battery life (<6h)');
    }

    const ram = specs.ram as number | undefined;
    const usesHeavyApps = useCases.some((u) =>
      u.includes('gaming') || u.includes('design') || u.includes('video'),
    );
    if (usesHeavyApps && ram && ram < 16) {
      warnings.push('consider 16GB+ RAM for this use case');
    }

    return warnings;
  }
}
