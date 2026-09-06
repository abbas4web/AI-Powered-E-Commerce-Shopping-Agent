import { PrismaService } from '../../database/prisma.service';
export declare class BrandsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        website: string | null;
    }[]>;
    findById(id: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        website: string | null;
    } | null>;
    findBySlug(slug: string): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        website: string | null;
    } | null>;
}
