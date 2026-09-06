'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, Star, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { ProductRecommendation, Product } from '@smartshop/shared';

interface Props {
  recommendation: ProductRecommendation;
}

function scoreColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

export function ProductRecommendationCard({ recommendation }: Props) {
  const { productId, score, reason, matchedRequirements, warnings } = recommendation;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => apiClient.get<Product>(`/products/${productId}`),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product image */}
          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
            {product?.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name ?? 'Product'}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                No image
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{product?.brand?.name}</p>
                <h4 className="font-semibold text-sm leading-snug line-clamp-1">
                  {product?.name ?? `Product ${productId.slice(0, 8)}...`}
                </h4>
              </div>
              {/* Score badge */}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${scoreColor(score)}`}>
                {score}/100
              </span>
            </div>

            {/* Price */}
            {product && (
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-sm">{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {/* Rating */}
                <div className="flex items-center gap-0.5 ml-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs">{product.rating?.toFixed(1)}</span>
                </div>
              </div>
            )}

            {/* Reason */}
            <p className="text-xs text-muted-foreground line-clamp-2">{reason}</p>

            {/* Matched requirements */}
            {matchedRequirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {matchedRequirements.map((req) => (
                  <div key={req} className="flex items-center gap-0.5">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-muted-foreground">{req}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {warnings.map((w) => (
                  <div key={w} className="flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
                    <span className="text-xs text-muted-foreground">{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3 flex gap-2">
          <Button variant="default" size="sm" asChild className="flex-1 gap-1.5 h-8 text-xs">
            <Link href={`/products/${productId}`}>
              View details <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
