import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AppLogger } from '../../common/logger/logger.service';
import { ProductSearchDto } from './dto/product-search.dto';
import { paginate } from '../../common/dto/pagination.dto';

// Product type keywords → category slugs
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  laptops:     ['laptop', 'laptops', 'notebook', 'macbook', 'chromebook'],
  smartphones: ['phone', 'mobile', 'smartphone', 'iphone', 'android'],
  tablets:     ['tablet', 'ipad'],
  headphones:  ['headphone', 'earphone', 'earbuds', 'headset', 'airpods'],
  monitors:    ['monitor', 'display', 'screen'],
  cameras:     ['camera', 'dslr', 'mirrorless'],
  televisions: ['tv', 'television', 'smart tv'],
};

@Injectable()
export class SearchService {
  private readonly logger = new AppLogger('SearchService');

  constructor(private readonly prisma: PrismaService) {}

  async searchProducts(dto: ProductSearchDto & { categorySlug?: string }) {
    const {
      query,
      categoryId,
      categorySlug,
      brandId,
      brandName,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = dto;

    const where: Prisma.ProductWhereInput = { isActive: true };

    // ── Category filter ────────────────────────────────────────────────────
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      where.category = { slug: { equals: categorySlug, mode: 'insensitive' } };
    } else if (query) {
      const detectedSlug = this.detectCategorySlug(query);
      if (detectedSlug) {
        where.category = { slug: detectedSlug };
        this.logger.debug(`Auto-detected category: ${detectedSlug} from query: "${query}"`);
      }
    }

    // ── Brand filter ───────────────────────────────────────────────────────
    if (brandId) {
      where.brandId = brandId;
    } else if (brandName) {
      where.brand = { name: { contains: brandName, mode: 'insensitive' } };
      this.logger.debug(`Brand filter: "${brandName}"`);
    }

    // ── Price filter ───────────────────────────────────────────────────────
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // ── Text search ───────────────────────────────────────────────────────
    // Always run text search when a query is provided.
    // When a category was auto-detected, remove the category keyword from
    // the query before text-searching so we get use-case matches
    // (e.g. "gaming" matches gaming laptops even within the laptops category).
    if (query) {
      const categoryKeywords = Object.values(CATEGORY_KEYWORDS).flat();
      const queryWithoutCategory = query
        .split(' ')
        .filter((w) => !categoryKeywords.includes(w.toLowerCase()))
        .join(' ')
        .trim();

      if (queryWithoutCategory) {
        // Combine category filter with use-case text search
        where.OR = [
          { name: { contains: queryWithoutCategory, mode: 'insensitive' } },
          { description: { contains: queryWithoutCategory, mode: 'insensitive' } },
        ];
      }
    }

    const skip = (page - 1) * limit;

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true, brand: true },
        orderBy: { rating: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    this.logger.debug(`Search for "${query}" returned ${total} results`);
    return paginate(products, total, page, limit);
  }

  /** Search products by name only — no category auto-detection, no price filter.
   *  Used by CompareAgent to find specific products the user named. */
  async searchProductsByName(query: string): Promise<unknown[]> {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      include: { category: true, brand: true },
      orderBy: { rating: 'desc' },
      take: 1,
    });
  }

  /** Map a query keyword to a category slug */
  detectCategorySlug(query: string): string | null {
    const lower = query.toLowerCase();
    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((k) => lower.includes(k))) {
        return slug;
      }
    }
    return null;
  }
}
