export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
  viewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  specifications: Record<string, unknown>;
  category: Category;
  brand: Brand;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  brand: Pick<Brand, 'id' | 'name' | 'slug'>;
}

// ─── Specifications by category ──────────────────────────────────────────────

export interface LaptopSpecifications {
  processor: string;
  processorGeneration?: string;
  ram: number; // GB
  ramType?: string;
  storage: number; // GB
  storageType?: string;
  display: {
    size: number; // inches
    resolution?: string;
    refreshRate?: number; // Hz
    panelType?: string;
  };
  gpu?: string;
  battery?: {
    capacity: number;
    unit: 'Wh' | 'mAh';
    life?: number; // hours
  };
  weight?: number; // kg
  os?: string;
  ports?: string[];
}

export interface SmartphoneSpecifications {
  processor: string;
  ram: number; // GB
  storage: number; // GB
  display: {
    size: number; // inches
    resolution?: string;
    refreshRate?: number;
    type?: string;
  };
  camera?: {
    main: number; // MP
    front?: number;
    ultraWide?: number;
    telephoto?: number;
  };
  battery: {
    capacity: number; // mAh
    charging?: number; // W
  };
  os?: string;
  network?: string[];
}

export interface SearchProductsRequest {
  query?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CompareProductsRequest {
  productIds: string[];
}

export interface ComparisonResult {
  products: ProductSummary[];
  comparisonMatrix: Array<{
    attribute: string;
    values: Array<{
      productId: string;
      value: unknown;
    }>;
  }>;
}
