import type { Metadata } from 'next';
import { ComparisonPage } from '@/components/compare/comparison-page';

export const metadata: Metadata = { title: 'Compare Products' };

export default function ComparePage() {
  return <ComparisonPage />;
}
