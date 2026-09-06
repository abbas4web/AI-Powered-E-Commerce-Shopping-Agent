import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class ProductsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<({
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
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }) | null>;
    findAll(params: {
        skip: number;
        take: number;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }): Promise<{
        products: ({
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
            specifications: Prisma.JsonValue;
            categoryId: string;
            brandId: string;
        })[];
        total: number;
    }>;
    create(data: Prisma.ProductCreateInput): Promise<{
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
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }>;
    update(id: string, data: Prisma.ProductUpdateInput): Promise<{
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
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }>;
    delete(id: string): Promise<{
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
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }>;
    findByIds(ids: string[]): Promise<({
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
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    })[]>;
}
