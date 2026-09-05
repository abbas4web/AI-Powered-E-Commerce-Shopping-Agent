import { ProductsService } from '../products/products.service';
export declare class ComparisonsService {
    private readonly productsService;
    private readonly logger;
    constructor(productsService: ProductsService);
    compare(productIds: string[]): Promise<{
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
