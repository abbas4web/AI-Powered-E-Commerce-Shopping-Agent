import { PrismaService } from '../../database/prisma.service';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findBySlug(slug: string): Promise<{
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
