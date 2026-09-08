'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, Star, ExternalLink, Heart, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, discountPercent } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { ProductRecommendation, Product } from '@smartshop/shared';

interface Props {
  recommendation: ProductRecommendation;
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 85 ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    : score >= 70 ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
    : score >= 55 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    : 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';

  return (
    <div className={`flex-shrink-0 w-14 h-14 rounded-full flex flex-col items-center justify-center text-center font-bold ${color}`}>
      <span className="text-lg leading-none">{score}</span>
      <span className="text-[9px] font-normal leading-tight opacity-70">/ 100</span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-yellow-500';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span>{pct}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ProductRecommendationCard({ recommendation }: Props) {
  const { productId, score, reason, matchedRequirements, warnings, breakdown } = recommendation;

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => apiClient.get<Product>(`/products/${productId}`),
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });

  const handleAddToWishlist = async () => {
    try {
      await apiClient.post('/wishlist', { productId });
      toast({ title: 'Added to wishlist' });
    } catch {
      toast({ variant: 'destructive', title: 'Already in wishlist' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const discount = product?.originalPrice && product.originalPrice > product.price
    ? discountPercent(product.price, product.originalPrice)
    : null;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: score >= 85 ? '#22c55e' : score >= 70 ? '#3b82f6' : score >= 55 ? '#eab308' : '#ef4444' }}>
      <CardContent className="p-4 space-y-3">
        {/* Main row */}
        <div className="flex gap-3 items-start">
          {/* Product image */}
          <Link href={`/products/${productId}`} className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0 hover:opacity-90 transition-opacity">
            {product?.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name ?? ''} fill className="object-contain p-1" sizes="64px" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">No image</div>
            )}
            {discount && (
              <span className="absolute top-0.5 left-0.5 text-[9px] bg-red-500 text-white px-1 rounded font-bold">
                -{discount}%
              </span>
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-1">
            <div>
              <p className="text-[10px] text-muted-foreground">{product?.brand?.name ?? ''}</p>
              <Link href={`/products/${productId}`} className="hover:underline">
                <h4 className="font-semibold text-sm leading-snug line-clamp-1">
                  {product?.name ?? `Product ${productId.slice(0, 8)}`}
                </h4>
              </Link>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold text-sm">
                {product ? formatPrice(product.price) : '—'}
              </span>
              {product?.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product?.rating && (
                <div className="flex items-center gap-0.5 ml-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-[11px] text-muted-foreground">{product.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Reason */}
            <p className="text-xs text-muted-foreground line-clamp-2">{reason}</p>
          </div>

          {/* Score ring */}
          <ScoreRing score={score} />
        </div>

        {/* Matched requirements */}
        {matchedRequirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {matchedRequirements.map((req) => (
              <div key={req} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {warnings.map((w) => (
              <div key={w} className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Score breakdown */}
        {breakdown && (
          <details className="group">
            <summary className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none list-none">
              <Info className="h-3 w-3" />
              <span>Score breakdown</span>
              <span className="ml-auto group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-2 space-y-1.5 p-2 rounded-md bg-muted/40">
              <ScoreBar label="Requirement match" value={breakdown.requirementMatch} />
              <ScoreBar label="Performance" value={breakdown.performance} />
              <ScoreBar label="Rating" value={breakdown.rating} />
              <ScoreBar label="Price value" value={breakdown.priceValue} />
              <ScoreBar label="Popularity" value={breakdown.popularity} />
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleAddToWishlist}>
            <Heart className="h-3.5 w-3.5" /> Save
          </Button>
          <Button size="sm" className="h-8 flex-1 gap-1 text-xs" asChild>
            <Link href={`/products/${productId}`}>
              View details <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
