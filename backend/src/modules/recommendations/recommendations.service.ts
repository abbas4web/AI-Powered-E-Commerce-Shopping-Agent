import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AppLogger } from '../../common/logger/logger.service';

@Injectable()
export class RecommendationsService {
  private readonly logger = new AppLogger('RecommendationsService');

  constructor(private readonly prisma: PrismaService) {}

  async getUserRecommendations(userId: string) {
    return this.prisma.recommendation.findMany({
      where: { userId },
      include: { product: { include: { category: true, brand: true } } },
      orderBy: { score: 'desc' },
      take: 20,
    });
  }

  async saveRecommendation(
    userId: string,
    productId: string,
    score: number,
    reason: string,
    matchedRequirements: string[],
    conversationId?: string,
  ) {
    return this.prisma.recommendation.upsert({
      where: { userId_productId: { userId, productId } },
      update: { score, reason, matchedRequirements, conversationId },
      create: { userId, productId, score, reason, matchedRequirements, conversationId },
    });
  }
}
