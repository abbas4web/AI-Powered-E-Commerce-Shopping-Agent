import { PrismaService } from '../../database/prisma.service';
export declare class ConversationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, firstMessage: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        messages: import("@prisma/client/runtime/library").JsonValue;
        structuredState: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findById(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        messages: import("@prisma/client/runtime/library").JsonValue;
        structuredState: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findAllByUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
    }[]>;
    addMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        messages: import("@prisma/client/runtime/library").JsonValue;
        structuredState: import("@prisma/client/runtime/library").JsonValue;
    }>;
    updateStructuredState(conversationId: string, state: Record<string, unknown>): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        messages: import("@prisma/client/runtime/library").JsonValue;
        structuredState: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
