import type { Metadata } from 'next';
import { ProductDetailPage } from '@/components/products/product-detail-page';

export const metadata: Metadata = { title: 'Product Details' };

export default function ProductPage({ params }: { params: { id: string } }) {
  return <ProductDetailPage productId={params.id} />;
}
