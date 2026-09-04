import type { Metadata } from 'next';
import { ProductListingPage } from '@/components/products/product-listing-page';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage() {
  return <ProductListingPage />;
}
