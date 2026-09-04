import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string, limit = 20) {
    return this.prisma.review.findMany({
      where: { productId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async create(userId: string, productId: string, rating: number, comment: string) {
    return this.prisma.review.create({
      data: { userId, productId, rating, comment },
    });
  }
}
