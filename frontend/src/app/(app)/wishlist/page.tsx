import type { Metadata } from 'next';
import { WishlistPage } from '@/components/wishlist/wishlist-page';

export const metadata: Metadata = { title: 'Wishlist' };

export default function WishlistRoute() {
  return <WishlistPage />;
}
