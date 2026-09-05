import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        parentId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        parentId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
