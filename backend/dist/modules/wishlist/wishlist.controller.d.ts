import { WishlistService } from './wishlist.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
export declare class WishlistController {
    private readonly wishlistService;
    constructor(wishlistService: WishlistService);
    getWishlist(user: JwtPayload): Promise<({
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
    addToWishlist(user: JwtPayload, dto: AddToWishlistDto): Promise<{
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
    removeFromWishlist(user: JwtPayload, productId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    }>;
}
