import { PrismaService } from '../../database/prisma.service';
export declare class RecommendationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getUserRecommendations(userId: string): Promise<({
        product: {
            category: {
                id: string;
                slug: string;
                name: string;
                description: string | null;
                imageUrl: string | null;
                parentId: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            brand: {
                id: string;
                slug: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                logoUrl: string | null;
                website: string | null;
            };
        } & {
            id: string;
            slug: string;
            name: string;
            description: string;
            imageUrl: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            originalPrice: number | null;
            images: string[];
            isFeatured: boolean;
            rating: number;
            reviewCount: number;
            viewCount: number;
            specifications: import("@prisma/client/runtime/library").JsonValue;
            categoryId: string;
            brandId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        productId: string;
        score: number;
        reason: string;
        matchedRequirements: string[];
        rankingBreakdown: import("@prisma/client/runtime/library").JsonValue;
        conversationId: string | null;
    })[]>;
    saveRecommendation(userId: string, productId: string, score: number, reason: string, matchedRequirements: string[], conversationId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        productId: string;
        score: number;
        reason: string;
        matchedRequirements: string[];
        rankingBreakdown: import("@prisma/client/runtime/library").JsonValue;
        conversationId: string | null;
    }>;
}
