"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ConversationsService = class ConversationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, firstMessage) {
        const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '');
        return this.prisma.conversation.create({
            data: {
                userId,
                title,
                messages: [],
                structuredState: {},
            },
        });
    }
    async findById(id, userId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id, userId },
        });
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        return conversation;
    }
    async findAllByUser(userId) {
        return this.prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async addMessage(conversationId, role, content) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation)
            throw new common_1.NotFoundException('Conversation not found');
        const messages = conversation.messages ?? [];
        messages.push({ role, content, timestamp: new Date().toISOString() });
        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { messages: messages, updatedAt: new Date() },
        });
    }
    async updateStructuredState(conversationId, state) {
        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { structuredState: state },
        });
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map