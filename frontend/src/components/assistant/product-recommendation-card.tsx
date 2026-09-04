'use client';

import Link from 'next/link';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProductRecommendation } from '@smartshop/shared';

interface Props {
  recommendation: ProductRecommendation;
}

/** Score colour: green ≥ 80, yellow ≥ 60, red < 60 */
function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

export function ProductRecommendationCard({ recommendation }: Props) {
  const { productId, score, reason, matchedRequirements, warnings } = recommendation;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              Product ID: <span className="font-mono text-xs">{productId}</span>
            </p>
            <p className="text-sm text-foreground">{reason}</p>
          </div>
          <div className={`text-2xl font-bold shrink-0 ${scoreColor(score)}`}>
            {score}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Matched requirements */}
        {matchedRequirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {matchedRequirements.map((req) => (
              <div key={req} className="flex items-center gap-1">
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
              <div key={w} className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
                <span className="text-xs text-muted-foreground">{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="pt-1">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/products/${productId}`}>
              View product <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
