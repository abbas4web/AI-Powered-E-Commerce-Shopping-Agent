import { PrismaService } from '../../database/prisma.service';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        imageUrl: string | null;
        parentId: string | null;
    }[]>;
    findById(id: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        imageUrl: string | null;
        parentId: string | null;
    } | null>;
    findBySlug(slug: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        imageUrl: string | null;
        parentId: string | null;
    } | null>;
}
