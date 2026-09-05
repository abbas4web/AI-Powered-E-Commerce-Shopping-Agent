import { PrismaService } from '../../database/prisma.service';
export declare class BrandsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findBySlug(slug: string): Promise<{
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
