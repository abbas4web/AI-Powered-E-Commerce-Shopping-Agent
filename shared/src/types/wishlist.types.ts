import { ProductSummary } from './product.types';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: ProductSummary;
  createdAt: string;
}

export interface AddToWishlistRequest {
  productId: string;
}
