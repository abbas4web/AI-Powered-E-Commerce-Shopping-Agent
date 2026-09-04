'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { relativeTime } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { ConversationSummary } from '@smartshop/shared';

export function ConversationHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get<ConversationSummary[]>('/conversations'),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-44" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversations</h1>
          <p className="text-sm text-muted-foreground">
            {data?.length ?? 0} past conversations
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/assistant">New conversation</Link>
        </Button>
      </div>

      {!data?.length ? (
        <div className="py-20 text-center space-y-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">No conversations yet.</p>
          <Button asChild>
            <Link href="/assistant">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((conv) => (
            <Link
              key={conv.id}
              href={`/conversations/${conv.id}`}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-accent transition-colors group"
            >
              <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium line-clamp-1">{conv.title}</p>
                <p className="text-xs text-muted-foreground">{relativeTime(conv.updatedAt)}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
