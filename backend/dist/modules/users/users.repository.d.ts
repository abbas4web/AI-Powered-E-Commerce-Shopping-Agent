import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
export declare class UsersRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        password: string;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findByEmail(email: string): Promise<{
        password: string;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create(data: Prisma.UserCreateInput): Promise<{
        password: string;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<{
        password: string;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        password: string;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(skip: number, take: number): Promise<{
        users: {
            password: string;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
}
