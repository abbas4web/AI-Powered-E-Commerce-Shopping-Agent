'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/assistant/chat-message';
import { apiClient } from '@/lib/api-client';
import type { Conversation } from '@smartshop/shared';

interface Props {
  conversationId: string;
}

export function ConversationDetailPage({ conversationId }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => apiClient.get<Conversation>(`/conversations/${conversationId}`),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-56" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-muted-foreground">Conversation not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/conversations">Back to conversations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/conversations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-semibold text-sm line-clamp-1">{data.title}</h1>
          <p className="text-xs text-muted-foreground">
            {data.messages.length} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4 max-w-3xl mx-auto">
          {data.messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Continue CTA */}
      <div className="border-t px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto">
          <Button asChild size="sm" variant="outline">
            <Link href={`/assistant?conversationId=${conversationId}`}>
              Continue this conversation
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
