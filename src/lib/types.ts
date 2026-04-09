// Database type definitions matching the Supabase schema

export type UserRole = "owner" | "cashier";
export type PaymentMethod = "cash" | "transfer" | "mixed" | "credit";
export type POPaymentMethod = "cash" | "transfer" | "credit";

/** A single payment tender submitted at checkout. */
export interface SalePaymentInput {
  method: "cash" | "transfer";
  amount: number;
}

/** A persisted sale credit payment (customer collection) row from sale_credit_payments. */
export interface SaleCreditPayment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: "cash" | "transfer";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  /** Resolved display name of the user who recorded this payment. */
  created_by_name?: string | null;
}

/** A persisted sale payment row from sale_payments. */
export interface SalePayment {
  id: string;
  sale_id: string;
  payment_method: "cash" | "transfer";
  amount: number;
}

/** A persisted supplier payment row from supplier_payments. */
export interface SupplierPayment {
  id: string;
  purchase_order_id: string;
  amount: number;
  payment_method: "cash" | "transfer";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  /** Resolved display name of the user who recorded this payment. */
  created_by_name?: string | null;
}
export type SaleStatus = "completed" | "voided";
export type PurchaseOrderStatus = "draft" | "received" | "cancelled";
export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";
export type InventoryMovementType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
export type CampaignDiscountType = "percentage" | "fixed";
export type CampaignTriggerType =
  | "always"
  | "min_cart_total"
  | "min_product_qty";

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  price: number;
  bulk_price: number | null;
  bulk_min_qty: number | null;
  effective_from: string;
  created_by: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unit: string;
  selling_price: number;
  bulk_price: number | null;
  bulk_min_qty: number | null;
  latest_cost_price: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Reseller {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  is_system: boolean;
  created_at: string;
}

export interface InventoryBatch {
  id: string;
  product_id: string;
  quantity_in: number;
  quantity_remaining: number;
  cost_price: number;
  expiry_date: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  batch_id: string;
  type: InventoryMovementType;
  quantity: number;
  reference_type: string;
  reference_id: string;
  created_by: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  total_amount: number;
  total_cogs: number;
  discount_amount: number;
  campaign_savings: number;
  cart_campaign_discount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  created_by: string | null;
  created_at: string;
  reseller_id: string | null;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string | null;
  status: PurchaseOrderStatus;
  payment_method: POPaymentMethod;
  notes: string | null;
  total_amount: number;
  created_by: string | null;
  created_at: string;
  received_at: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  cost_price: number;
  expiry_date: string | null;
  subtotal: number;
}

export interface InventoryAdjustment {
  id: string;
  adjustment_number: string;
  reason: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface InventoryAdjustmentItem {
  id: string;
  adjustment_id: string;
  product_id: string;
  batch_id: string | null;
  quantity_change: number;
  cost_price: number;
  reason: string | null;
}

export interface JournalEntry {
  id: string;
  reference_type: string;
  reference_id: string;
  description: string | null;
  created_at: string;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
}

// Input types for RPCs
export interface SaleItemInput {
  productId: string;
  quantity: number;
  price: number;
}

export interface Campaign {
  id: string;
  name: string;
  discount_type: CampaignDiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  trigger_type: CampaignTriggerType;
  trigger_value: number | null;
  created_by: string | null;
  created_at: string;
}

export interface CampaignProduct {
  id: string;
  campaign_id: string;
  product_id: string;
  min_quantity: number;
}

export interface CampaignWithProducts extends Campaign {
  campaign_products: CampaignProduct[];
}

/** A persisted supplier payment row from supplier_payments. */
export interface CreateSaleInput {
  items: SaleItemInput[];
  payments: SalePaymentInput[];
  isCreditSale?: boolean;
  resellerId?: string;
  discountAmount?: number;
  campaignSavings?: number;
  cartCampaignDiscount?: number;
}

export interface AdjustmentItemInput {
  productId: string;
  quantityChange: number;
  costPrice: number;
  expiryDate?: string | null;
  reason?: string;
}

export interface CreateAdjustmentInput {
  reason: string;
  notes?: string;
  items: AdjustmentItemInput[];
}

// Report types
export interface BalanceSheetRow {
  code: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface ProfitLossRow {
  code: string;
  name: string;
  type: AccountType;
  amount: number;
}

/**
 * Standard return type for Server Actions.
 *
 * - On success: `{ data }` (data is undefined for void actions)
 * - On failure: `{ error: string }`
 *
 * This replaces ad-hoc `{ error?: string; success?: boolean; data?: T }`
 * literals scattered across action files, giving callers a single consistent
 * shape to check.
 */
export type ActionResult<T = undefined> =
  | { data: T; error?: never }
  | { error: string; data?: never };

export interface SalesSummaryRow {
  sale_date: string;
  total_transactions: number;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
}

export interface StockReportRow {
  sku: string;
  name: string;
  stock_on_hand: number;
  stock_value: number;
}
