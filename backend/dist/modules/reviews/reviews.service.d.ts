import { PrismaService } from '../../database/prisma.service';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByProduct(productId: string, limit?: number): Promise<({
        user: {
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        userId: string;
        productId: string;
        comment: string;
        sentiment: number | null;
        sentimentDetails: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    create(userId: string, productId: string, rating: number, comment: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        userId: string;
        productId: string;
        comment: string;
        sentiment: number | null;
        sentimentDetails: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
