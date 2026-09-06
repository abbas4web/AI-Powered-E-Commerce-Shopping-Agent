import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    findByProduct(productId: string, limit?: string): Promise<({
        user: {
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        productId: string;
        rating: number;
        comment: string;
        sentiment: number | null;
        sentimentDetails: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
