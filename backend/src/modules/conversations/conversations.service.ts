import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, firstMessage: string) {
    // Generate a title from the first ~60 chars of the first message
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

  async findById(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async findAllByUser(userId: string) {
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

  async addMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const messages = (conversation.messages as Array<{role: string; content: string; timestamp: string}>) ?? [];
    messages.push({ role, content, timestamp: new Date().toISOString() });

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { messages: messages as never, updatedAt: new Date() },
    });
  }

  async updateStructuredState(conversationId: string, state: Record<string, unknown>) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { structuredState: state as never },
    });
  }
}
