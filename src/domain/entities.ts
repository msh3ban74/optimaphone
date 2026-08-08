/**
 * Domain entities for the OptimaPhone commerce platform.
 * These types are backend-agnostic: the data layer (local seed today,
 * REST/GraphQL tomorrow) maps into them via the repository contracts.
 */

export type CategoryId =
  | 'phones'
  | 'laptops'
  | 'tablets'
  | 'audio'
  | 'wearables'
  | 'gaming'
  | 'accessories';

export type BrandId =
  | 'apple'
  | 'samsung'
  | 'google'
  | 'sony'
  | 'asus'
  | 'lenovo'
  | 'anker';

export interface Category {
  id: CategoryId;
  name: string;
  icon: string;
}

export interface Brand {
  id: BrandId;
  name: string;
  monogram: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ProductVariant {
  id: string;
  color: ColorOption;
  /** e.g. "256 GB" — omitted for products without storage tiers */
  storage?: string;
  /** e.g. "16 GB" — laptops/gaming */
  ram?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
}

export interface SpecGroup {
  title: string;
  specs: { label: string; value: string }[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
}

export interface FlashDeal {
  /** ISO timestamp the deal ends */
  endsAt: string;
  percentOff: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  brand: BrandId;
  category: CategoryId;
  images: string[];
  description: string;
  highlights: string[];
  specGroups: SpecGroup[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  variants: ProductVariant[];
  warrantyMonths: number;
  isNew?: boolean;
  isFeatured?: boolean;
  flashDeal?: FlashDeal;
  tags: string[];
}

export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface Address {
  id: string;
  label: string;
  recipient: string;
  line1: string;
  city: string;
  phone: string;
}

export type PaymentMethodKind = 'card' | 'apple-pay' | 'google-pay' | 'cod' | 'wallet';

export interface PaymentMethod {
  kind: PaymentMethodKind;
  title: string;
  subtitle: string;
  icon: string;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'shipped'
  | 'out-for-delivery'
  | 'delivered';

export interface OrderLine {
  productId: string;
  productName: string;
  variantLabel: string;
  image: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  number: string;
  placedAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  address: Address;
  payment: PaymentMethodKind;
  couponCode?: string;
}

export interface Coupon {
  code: string;
  description: string;
  percentOff?: number;
  amountOff?: number;
  minSubtotal: number;
}
