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
        rating: number;
        userId: string;
        productId: string;
        comment: string;
        sentiment: number | null;
        sentimentDetails: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
