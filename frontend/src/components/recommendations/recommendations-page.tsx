'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Star, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Recommendation } from '@smartshop/shared';

export function RecommendationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => apiClient.get<Recommendation[]>('/recommendations'),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Products recommended by the AI based on your conversations
        </p>
      </div>

      {!data?.length ? (
        <div className="py-20 text-center space-y-4">
          <Star className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">No recommendations yet.</p>
          <Button asChild>
            <Link href="/assistant">Start a conversation</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((rec) => (
            <Card key={rec.id}>
              <CardContent className="p-5 flex gap-5">
                {/* Score ring */}
                <div className="shrink-0 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{Math.round(rec.score)}</span>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${rec.product.id}`}
                      className="font-semibold hover:underline line-clamp-1"
                    >
                      {rec.product.name}
                    </Link>
                    <span className="font-semibold shrink-0">{formatPrice(rec.product.price)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  {rec.matchedRequirements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rec.matchedRequirements.map((r) => (
                        <div key={r} className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-muted-foreground">{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
