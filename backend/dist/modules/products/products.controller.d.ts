import { ProductsService } from './products.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(pagination: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
    }>>;
    findById(id: string): Promise<{
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
    }>;
}
