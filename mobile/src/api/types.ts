/** أنواع مشتركة بين الشاشات — مطابقة لأشكال ردود الباكند */

export interface Game {
  id: number;
  title: string;
  image: string;
  description?: string | null;
  price: number;
  price_ps5?: number | null;
  size_gb?: number | null;
  category_id?: number | null;
  genre?: string | null;
  series?: string | null;
  features?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface GameSlim {
  id: number;
  title: string;
  image: string;
  price: number;
  category_id: number | null;
  size_gb: number | null;
  price_ps5: number | null;
}

export interface Category {
  id: number;
  name: string;
  is_visible?: number | boolean;
  [key: string]: unknown;
}

export interface Branch {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  is_active?: number | boolean;
  is_main?: number | boolean;
  created_at?: string;
}

export interface PackageGame {
  id: number;
  title: string;
  image: string;
  price: number;
}

export interface StorePackage {
  id: number;
  name: string;
  price: number;
  category_id: number | null;
  is_active?: number | boolean;
  created_at?: string;
  packageGames: PackageGame[];
}

export interface TrackedItem {
  title: string;
  price: number;
  type?: string;
  size_gb?: number | null;
  installed?: number | boolean;
  quantity?: number;
}

/** رد GET /api/orders/:id (يقرأ الفواتير حسب رقمها أو معرّفها) */
export interface TrackedOrder {
  invoice_number: string;
  status: string;
  items: TrackedItem[];
  total: number;
  discount?: number | null;
  final_total?: number | null;
  paid_amount?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  totalSize?: number | null;
  estimatedMinutes?: number | null;
  created_at?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'staff';
  created_at?: string;
  branch_id: number;
  branch_name?: string | null;
  branch_is_main?: number | boolean;
}

export interface InvoiceSettings {
  store_name?: string;
  store_name_english?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  store_website?: string;
  footer_message?: string;
  header_logo_text?: string;
  show_store_info?: number;
  show_footer?: number;
  paper_width?: number;
  font_size?: string;
}

export interface Service {
  id: number;
  title: string;
  price: number;
  is_active?: number | boolean;
  sort_order?: number | null;
}

export interface HealthInfo {
  ok: boolean;
  database: string;
  timestamp?: string;
  uptime?: number;
}

/** إرسال طلب من السلة كما في الواجهة (POST /api/orders) */
export interface OrderSubmitPayload {
  games: TrackedItem[];
  customer_name?: string | null;
  customer_phone: string;
}

export type InvoiceStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';

/** بند فاتورة يُنشأ مباشرة من موظف (مرحلة الفواتير) */
export interface InvoiceItemInput {
  id?: number;
  title: string;
  price: number;
  type: 'game' | 'service' | 'package';
  size_gb?: number | null;
  quantity?: number;
  installed?: boolean;
  platform?: string;
}
