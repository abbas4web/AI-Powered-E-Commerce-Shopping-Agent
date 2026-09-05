import { PrismaService } from '../../database/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    trackProductView(userId: string | null, productId: string): Promise<void>;
    trackSearch(userId: string | null, query: string, resultCount: number): Promise<void>;
}
