import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AppLogger } from '../../common/logger/logger.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new AppLogger('AnalyticsService');

  constructor(private readonly prisma: PrismaService) {}

  async trackProductView(userId: string | null, productId: string) {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          event: 'PRODUCT_VIEW',
          userId,
          productId,
          metadata: {},
        },
      });
    } catch (err) {
      // Analytics failures should never break the main flow
      this.logger.warn(`Failed to track product view: ${(err as Error).message}`);
    }
  }

  async trackSearch(userId: string | null, query: string, resultCount: number) {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          event: 'PRODUCT_SEARCH',
          userId,
          metadata: { query, resultCount },
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to track search: ${(err as Error).message}`);
    }
  }
}
