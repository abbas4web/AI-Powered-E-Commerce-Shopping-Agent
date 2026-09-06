import { PrismaService } from '../../database/prisma.service';
export declare class RecommendationsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getUserRecommendations(userId: string): Promise<({
        product: {
            category: {
                name: string;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                slug: string;
                imageUrl: string | null;
                parentId: string | null;
            };
            brand: {
                name: string;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                logoUrl: string | null;
                website: string | null;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            rating: number;
            description: string;
            slug: string;
            price: number;
            originalPrice: number | null;
            imageUrl: string | null;
            images: string[];
            isFeatured: boolean;
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
