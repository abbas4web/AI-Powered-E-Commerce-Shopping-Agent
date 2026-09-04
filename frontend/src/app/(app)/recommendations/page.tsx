import type { Metadata } from 'next';
import { RecommendationsPage } from '@/components/recommendations/recommendations-page';

export const metadata: Metadata = { title: 'Recommendations' };

export default function RecommendationsRoute() {
  return <RecommendationsPage />;
}
