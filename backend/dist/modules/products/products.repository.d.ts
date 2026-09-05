import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class ProductsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<({
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
    } & {
        id: string;
        slug: string;
        name: string;
        description: string;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        originalPrice: number | null;
        images: string[];
        isFeatured: boolean;
        rating: number;
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
        } & {
            id: string;
            slug: string;
            name: string;
            description: string;
            imageUrl: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            originalPrice: number | null;
            images: string[];
            isFeatured: boolean;
            rating: number;
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
    } & {
        id: string;
        slug: string;
        name: string;
        description: string;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        originalPrice: number | null;
        images: string[];
        isFeatured: boolean;
        rating: number;
        reviewCount: number;
        viewCount: number;
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }>;
    update(id: string, data: Prisma.ProductUpdateInput): Promise<{
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
    } & {
        id: string;
        slug: string;
        name: string;
        description: string;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        originalPrice: number | null;
        images: string[];
        isFeatured: boolean;
        rating: number;
        reviewCount: number;
        viewCount: number;
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }>;
    delete(id: string): Promise<{
        id: string;
        slug: string;
        name: string;
        description: string;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        originalPrice: number | null;
        images: string[];
        isFeatured: boolean;
        rating: number;
        reviewCount: number;
        viewCount: number;
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    }>;
    findByIds(ids: string[]): Promise<({
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
    } & {
        id: string;
        slug: string;
        name: string;
        description: string;
        imageUrl: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        originalPrice: number | null;
        images: string[];
        isFeatured: boolean;
        rating: number;
        reviewCount: number;
        viewCount: number;
        specifications: Prisma.JsonValue;
        categoryId: string;
        brandId: string;
    })[]>;
}
