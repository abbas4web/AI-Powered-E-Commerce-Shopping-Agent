import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AppLogger } from '../../common/logger/logger.service';
import { ProductSearchDto } from './dto/product-search.dto';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class SearchService {
  private readonly logger = new AppLogger('SearchService');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hybrid search: structured filters + keyword full-text search.
   * Vector/semantic search will be added in Phase 5.
   */
  async searchProducts(dto: ProductSearchDto) {
    const {
      query,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = dto;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
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
}
