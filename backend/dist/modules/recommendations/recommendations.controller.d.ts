import { RecommendationsService } from './recommendations.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    getUserRecommendations(user: JwtPayload): Promise<({
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
}
