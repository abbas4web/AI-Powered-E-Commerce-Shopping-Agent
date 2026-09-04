'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { WishlistItem } from '@smartshop/shared';

export function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiClient.get<WishlistItem[]>('/wishlist'),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) =>
      apiClient.delete(`/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast({ title: 'Removed from wishlist' });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <p className="text-sm text-muted-foreground">{items?.length ?? 0} saved items</p>
      </div>

      {!items?.length ? (
        <div className="py-20 text-center space-y-4">
          <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Button asChild variant="outline">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.product.id}`}
                  className="font-medium hover:underline line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">{item.product.brand.name}</p>
              </div>
              <span className="font-semibold shrink-0">{formatPrice(item.product.price)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeMutation.mutate(item.productId)}
                disabled={removeMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
