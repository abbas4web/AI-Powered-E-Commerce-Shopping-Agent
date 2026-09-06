import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ProductSearchDto } from './dto/product-search.dto';
export declare class SearchService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    searchProducts(dto: ProductSearchDto & {
        categorySlug?: string;
    }): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }>>;
    searchProductsByName(query: string): Promise<unknown[]>;
    detectCategorySlug(query: string): string | null;
}
