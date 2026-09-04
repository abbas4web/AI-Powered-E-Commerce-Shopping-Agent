'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { GitCompare, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useComparisonStore } from '@/store/comparison.store';
import type { ComparisonResult } from '@smartshop/shared';

export function ComparisonPage() {
  const { productIds, remove, clear } = useComparisonStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['compare', productIds],
    queryFn: () =>
      apiClient.post<ComparisonResult>('/products/compare', { productIds }),
    enabled: productIds.length >= 2,
  });

  if (productIds.length < 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="py-20 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <GitCompare className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No products selected</h2>
          <p className="text-sm text-muted-foreground">
            Add at least 2 products to compare them side by side. Use the compare button on any product card.
          </p>
          <Button asChild>
            <Link href="/products">Browse products <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compare Products</h1>
          <p className="text-sm text-muted-foreground">{productIds.length} products selected</p>
        </div>
        <Button variant="outline" size="sm" onClick={clear}>Clear all</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${productIds.length + 1}, 1fr)` }}>
          {Array.from({ length: (productIds.length + 1) * 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load comparison.</p>
      ) : data ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 font-medium w-40 text-muted-foreground">Feature</th>
                {data.products.map((p) => (
                  <th key={p.id} className="px-4 py-3 text-center">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground line-clamp-2">{p.name}</p>
                      <p className="font-bold text-primary">{formatPrice(p.price)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => remove(p.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Static rows */}
              <tr>
                <td className="px-4 py-2.5 font-medium text-muted-foreground">Rating</td>
                {data.products.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-center">
                    <Badge variant="outline">{p.rating?.toFixed(1)} ★</Badge>
                  </td>
                ))}
              </tr>
              <tr className="bg-muted/30">
                <td className="px-4 py-2.5 font-medium text-muted-foreground">Brand</td>
                {data.products.map((p) => (
                  <td key={p.id} className="px-4 py-2.5 text-center">{p.brand.name}</td>
                ))}
              </tr>
              {/* Dynamic spec rows */}
              {data.comparisonMatrix.map((row, i) => (
                <tr key={row.attribute} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                  <td className="px-4 py-2.5 font-medium text-muted-foreground capitalize">{row.attribute}</td>
                  {row.values.map((v) => (
                    <td key={v.productId} className="px-4 py-2.5 text-center text-muted-foreground">
                      {v.value !== null
                        ? typeof v.value === 'object'
                          ? JSON.stringify(v.value)
                          : String(v.value)
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
