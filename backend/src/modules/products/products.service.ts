import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { AppLogger } from '../../common/logger/logger.service';

@Injectable()
export class ProductsService {
  private readonly logger = new AppLogger('ProductsService');

  constructor(private readonly productsRepository: ProductsRepository) {}

  async findAll(pagination: PaginationDto) {
    const { products, total } = await this.productsRepository.findAll({
      skip: pagination.skip,
      take: pagination.limit,
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return paginate(products, total, pagination.page, pagination.limit);
  }

  async findById(id: string) {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByIds(ids: string[]) {
    return this.productsRepository.findByIds(ids);
  }
}
