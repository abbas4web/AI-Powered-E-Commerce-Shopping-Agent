'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Heart, Star, GitCompare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { formatPrice, discountPercent } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useComparisonStore } from '@/store/comparison.store';
import type { Product } from '@smartshop/shared';

interface Props {
  productId: string;
}

export function ProductDetailPage({ productId }: Props) {
  const { productIds, add, remove, canAdd } = useComparisonStore();
  const inComparison = productIds.includes(productId);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => apiClient.get<Product>(`/products/${productId}`),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-6 text-center py-20 space-y-3">
        <p className="text-muted-foreground">Product not found.</p>
        <Button variant="outline" asChild>
          <Link href="/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? discountPercent(product.price, product.originalPrice)
      : null;

  const specs = product.specifications as Record<string, unknown>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
        <Link href="/products">
          <ArrowLeft className="h-4 w-4" /> Products
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{product.brand.name} · {product.category.name}</p>
            <h1 className="text-2xl font-bold">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                {discount && <Badge variant="destructive">-{discount}%</Badge>}
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="h-4 w-4" /> Wishlist
            </Button>
            <Button
              variant={inComparison ? 'secondary' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => (inComparison ? remove(productId) : add(productId))}
              disabled={!inComparison && !canAdd}
            >
              <GitCompare className="h-4 w-4" />
              {inComparison ? 'In comparison' : 'Compare'}
            </Button>
          </div>
        </div>
      </div>

      {/* Specs + Reviews tabs */}
      <Tabs defaultValue="specs">
        <TabsList>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="pt-4">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(specs).map(([key, val], i) => (
                  <tr key={key} className={i % 2 === 0 ? 'bg-muted/40' : ''}>
                    <td className="px-4 py-2.5 font-medium capitalize w-1/3">{key}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="pt-4">
          <p className="text-sm text-muted-foreground">
            Reviews will be displayed here once loaded (Phase 4).
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
