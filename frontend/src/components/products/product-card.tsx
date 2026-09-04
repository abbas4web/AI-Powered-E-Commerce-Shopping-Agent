'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, GitCompare } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, discountPercent } from '@/lib/utils';
import { useComparisonStore } from '@/store/comparison.store';
import type { ProductSummary } from '@smartshop/shared';

interface ProductCardProps {
  product: ProductSummary;
  onAddToWishlist?: (id: string) => void;
}

export function ProductCard({ product, onAddToWishlist }: ProductCardProps) {
  const { productIds, add, remove, canAdd } = useComparisonStore();
  const inComparison = productIds.includes(product.id);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? discountPercent(product.price, product.originalPrice)
      : null;

  return (
    <Card className="group overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="relative aspect-[4/3] overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
        {discount && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            -{discount}%
          </Badge>
        )}
      </Link>

      <CardContent className="flex-1 p-4 space-y-2">
        <p className="text-xs text-muted-foreground">{product.brand.name}</p>
        <Link href={`/products/${product.id}`} className="hover:underline">
          <h3 className="font-medium text-sm leading-snug line-clamp-2">{product.name}</h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
          </div>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Add to wishlist"
          onClick={() => onAddToWishlist?.(product.id)}
        >
          <Heart className="h-4 w-4" />
        </Button>
        <Button
          variant={inComparison ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          aria-label={inComparison ? 'Remove from comparison' : 'Add to comparison'}
          onClick={() => (inComparison ? remove(product.id) : add(product.id))}
          disabled={!inComparison && !canAdd}
        >
          <GitCompare className="h-4 w-4" />
        </Button>
        <Button size="sm" className="flex-1 h-8 text-xs" asChild>
          <Link href={`/products/${product.id}`}>View details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
