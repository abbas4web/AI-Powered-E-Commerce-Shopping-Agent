import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true },
    });
  }

  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        skip,
        take,
        where,
        orderBy,
        include: { category: true, brand: true },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { products, total };
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
      include: { category: true, brand: true },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true, brand: true },
    });
  }

  async delete(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }

  async findByIds(ids: string[]) {
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: { category: true, brand: true },
    });
  }
}
