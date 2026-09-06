import { PrismaService } from '../../database/prisma.service';
export declare class WishlistService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getWishlist(userId: string): Promise<({
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
        userId: string;
        productId: string;
    })[]>;
    addToWishlist(userId: string, productId: string): Promise<{
        product: {
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
        userId: string;
        productId: string;
    }>;
    removeFromWishlist(userId: string, productId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    }>;
}
