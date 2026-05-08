export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  is_corporate: boolean;
  corporate_discount: number;
  loyalty_points: number;
  referral_code?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  display_order: number;
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  price_per_head: number;
  category: Category;
  is_veg: boolean;
  is_jain: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  avg_rating: number | null;
  review_count: number;
}

export interface Review {
  id: number;
  order_id: number;
  dish_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ServiceType {
  id: number;
  name: string;
  description: string;
  min_guests: number;
  max_guests: number | null;
  image_url: string | null;
  packages: Package[];
}

export interface Package {
  id: number;
  name: string;
  description: string;
  base_price_per_head: number;
  compartments: number | null;
  service_type_id: number;
}

export interface Address {
  id: number;
  label: string;
  line1: string;
  area: string;
  city: string;
  pincode: string;
  is_default: boolean;
}

export interface OrderDish {
  dish_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  service_type_id: number;
  event_type: string;
  guest_count: number;
  event_date: string;
  event_time: string;
  status: string;
  subtotal: number;
  discount: number;
  promo_code_id: number | null;
  promo_discount: number | null;
  points_redeemed: number;
  points_discount: number;
  points_earned: number;
  total_amount: number;
  created_at: string;
  dishes: OrderDish[];
}

export interface PromoCode {
  id: number;
  code: string;
  description: string | null;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export interface AppConfig {
  app_name: string;
  currency: string;
  default_city: string;
  event_types: string[];
  cities: string[];
  discount_threshold_guests: number;
  discount_percent: number;
  points_per_hundred: number;
  points_rupee_value: number;
}

export interface RecurringOrder {
  id: number;
  label: string;
  service_type_id: number;
  event_type: string;
  guest_count: number;
  delivery_address_id: number;
  special_instructions: string | null;
  dishes_json: string;
  frequency: string;
  next_date: string;
  is_active: boolean;
  created_at: string;
}
