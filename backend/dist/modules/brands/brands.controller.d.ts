import { BrandsService } from './brands.service';
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    findAll(): Promise<{
        id: string;
        slug: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        logoUrl: string | null;
        website: string | null;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        slug: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        logoUrl: string | null;
        website: string | null;
    } | null>;
}
