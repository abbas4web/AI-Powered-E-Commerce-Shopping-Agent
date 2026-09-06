import { SearchService } from './search.service';
import { ProductSearchDto } from './dto/product-search.dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(dto: ProductSearchDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
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
}
