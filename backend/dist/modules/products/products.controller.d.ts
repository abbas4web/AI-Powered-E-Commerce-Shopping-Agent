import { ProductsService } from './products.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(pagination: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
    }>>;
    findById(id: string): Promise<{
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
    }>;
}
