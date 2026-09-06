import { RecommendationsService } from './recommendations.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class RecommendationsController {
    private readonly recommendationsService;
    constructor(recommendationsService: RecommendationsService);
    getUserRecommendations(user: JwtPayload): Promise<({
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
}
