import { ComparisonsService } from './comparisons.service';
import { CompareProductsDto } from './dto/compare-products.dto';
export declare class ComparisonsController {
    private readonly comparisonsService;
    constructor(comparisonsService: ComparisonsService);
    compare(dto: CompareProductsDto): Promise<{
        products: {
            id: string;
            name: string;
            price: number;
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
            rating: number;
            imageUrl: string | null;
        }[];
        comparisonMatrix: {
            attribute: string;
            values: {
                productId: string;
                value: {} | null;
            }[];
        }[];
    }>;
}
