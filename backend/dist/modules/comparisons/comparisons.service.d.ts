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
                name: string;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                logoUrl: string | null;
                website: string | null;
            };
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
