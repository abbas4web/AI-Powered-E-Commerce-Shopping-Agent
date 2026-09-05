import { ConversationsService } from './conversations.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    findAll(user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
    }[]>;
    findById(user: JwtPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        title: string;
        messages: import("@prisma/client/runtime/library").JsonValue;
        structuredState: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
