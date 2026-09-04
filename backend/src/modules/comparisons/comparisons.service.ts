import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { AppLogger } from '../../common/logger/logger.service';

@Injectable()
export class ComparisonsService {
  private readonly logger = new AppLogger('ComparisonsService');

  constructor(private readonly productsService: ProductsService) {}

  async compare(productIds: string[]) {
    if (productIds.length < 2 || productIds.length > 4) {
      throw new BadRequestException('Compare requires 2 to 4 product IDs');
    }

    const products = await this.productsService.findByIds(productIds);

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products were not found');
    }

    // Build comparison matrix — spec keys are derived from JSONB specs field
    const specKeys = new Set<string>();
    for (const product of products) {
      const specs = product.specifications as Record<string, unknown>;
      Object.keys(specs ?? {}).forEach((k) => specKeys.add(k));
    }

    const comparisonMatrix = Array.from(specKeys).map((key) => ({
      attribute: key,
      values: products.map((p) => ({
        productId: p.id,
        value: (p.specifications as Record<string, unknown>)?.[key] ?? null,
      })),
    }));

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        brand: p.brand,
        category: p.category,
        rating: p.rating,
        imageUrl: p.imageUrl,
      })),
      comparisonMatrix,
    };
  }
}
