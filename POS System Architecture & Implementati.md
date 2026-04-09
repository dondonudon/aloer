# Aloer — POS System Architecture & Implementation Plan

> **Last updated:** April 9, 2026

---

## Implementation Status

### ✅ Completed

| Area | Detail |
|---|---|
| **Tech stack** | Next.js 16.2.2 (App Router, TypeScript 5), React 19, Supabase (PostgreSQL + Auth + Storage), Tailwind CSS v4, Biome |
| **Database** | All 23 tables + 8 RPC functions implemented. Base schema in `supabase/migrations/00001_schema.sql`; incremental migrations `00002` – `00008` extend it |
| **Idempotency (POS)** | `sales.idempotency_key` column + unique partial index. `create_sale_transaction` short-circuits and returns the existing sale when the same key is replayed. Frontend generates a UUID per checkout attempt and rotates it after a successful sale. Migration: `00008_idempotency_key.sql`. |
| **Auth** | Google OAuth only. Whitelist-based: users must exist in `user_roles` to access the app |
| **RBAC** | Owner and Cashier roles enforced at Server Action level (`ownerAction()` wrapper) and via RLS |
| **POS screen** | `/pos` — product grid, cart, FIFO sale, cash/transfer/split/credit payment, discount (% or fixed), campaign discounts, reseller picker, receipt modal |
| **Sales** | `/sales` — filterable by date range and status. `/sales/[id]` — line items, COGS, profit, void button (owner only), partial return flow (owner only) |
| **Products** | `/products` — CRUD, cost tracking, margin badge, category dropdown, drag-drop image upload, price history modal, unit management |
| **Inventory** | `/inventory` — stock on hand + value per product, per-batch detail. `/inventory/adjustments` — history and create new |
| **Purchases** | `/purchases` — create PO, receive PO (inventory + journal), cancel PO, pay supplier (AP flow) |
| **Credit (AR/AP)** | `/credit` — outstanding credit sales (AR) and credit POs (AP), payment collection per record |
| **Catalog** | `/catalog/categories`, `/catalog/suppliers` (with inline edit), `/catalog/resellers`, `/catalog/campaigns` — full CRUD |
| **Campaigns** | Percentage or fixed discount, product-level targeting, date range, min cart total / min qty triggers |
| **Reports** | `/reports` — Sales summary (server-translated), Profit & Loss (date range), Balance Sheet (period filtering: monthly/yearly), Stock Report page removed (Inventory page covers this) |
| **Settings** | Store name + icon upload; User role assignment (owner/cashier) inline, no Supabase dashboard needed |
| **Sidebar** | Minimize/expand toggle (desktop, `w-14`/`w-64`), role badge, dark mode toggle, role-filtered nav |
| **Dark mode** | Full dark/light toggle, persisted in localStorage |
| **Image upload** | Drag-drop `ImageUpload` component → Supabase Storage `pos-assets` bucket |
| **Loading states** | `loading.tsx` skeleton files on all major routes |
| **Action utilities** | `ownerAction()` (now passes `userId` to handler), `validateName()`, `ActionResult<T>`, `insertAuditLog()` — all action files migrated |
| **Server-side pagination** | Sales, Purchases, Products — URL-driven, configurable per page (10/20/50/100, default 10). `Pagination` component with accessible prev/next/page links and a "Rows per page" dropdown |
| **XLSX / CSV export** | Sales and Purchases list pages — SheetJS (`xlsx`) export buttons for both formats |
| **PDF export (reports)** | Sales Summary, Profit & Loss, Stock Report, and Balance Sheet pages — jsPDF + autoTable "Export PDF" button |
| **`getProfitLoss` SQL function** | Moved from app-level aggregation to `get_profit_loss(p_start_date, p_end_date)` Postgres RPC. Merged into `supabase/migrations/00001_schema.sql` |
| **Tests** | Vitest (unit) + Testing Library (component) + Playwright (E2E) scaffolded. See [§18](#18-testing) |
| **Internationalisation (i18n)** | Full EN / ID translation system. User locale preference persisted in `user_roles.locale` (DB column added via `00002_add_locale.sql`). `I18nProvider` + `useI18n()` context mirrors the theme-provider pattern. Server Components use `getServerTranslations()` (cached). Language switcher in sidebar footer shows active locale code (EN / ID). System-seeded chart-of-account names translated via `getAccountName()` helper keyed by account code — no schema duplication needed. Report pages (Balance Sheet, Sales Report) use server translations. |
| **Product price history** | `product_price_history` table tracks selling price changes over time. Price history modal in `/products` shows a timestamped log of price edits per product. |
| **Product units** | `product_units` table; per-product unit management (e.g. pcs, box, kg) with full CRUD in `/products`. |
| **Audit logging** | `audit_logs` table records all owner mutations (action, entity, entity_id, payload, user_id). `insertAuditLog()` helper in `action-utils.ts` — failures swallowed silently so they never block the primary operation. `ownerAction()` now surfaces `userId` to every handler. |
| **Partial sale return** | Owner can select individual line items and quantities to return from a completed sale (`sale_returns` + `sale_return_items` tables). Return restores FIFO batch stock, inserts RETURN inventory movements, creates reversal journal entries, and records a `partial_return` status on the sale. UI: `SaleReturnActions` component on `/sales/[id]`. Migration: `00007_sale_returns.sql`. |
| **User profiles** | `00003_user_profiles.sql` migration adds a `user_profiles` view/table so `created_by` fields are enriched with display names throughout the app. |
| **Shareable product image** | Share button (🔗) on each `/products` row downloads a 540×700 PNG product card on-demand. Generated server-side via `GET /api/products/[id]/share` using `next/og` (`ImageResponse` / Satori) — zero storage cost, streamed directly to the browser. Card includes: store logo + name (header), product photo, name, selling price, bulk price (if set), active campaign badge with date range + "Syarat & ketentuan berlaku" disclaimer (if applicable), generated timestamp, and footer disclaimer (footer). Filename format: `{product-slug}-{YYYYMMDD}-{HHmm}.png`. Uses `createAdminClient()` to bypass RLS. |

### ⏳ Future Work

See [§17. Future Work](#17-future-work) for the full list.

---

## Design Decisions

| Decision | Detail |
|---|---|
| **Google OAuth only** | Email+password login replaced with Google OAuth. Whitelist-based access via `user_roles` table |
| **`ownerAction()` wrapper** | All owner-only Server Actions use a shared wrapper that checks auth + role, creates the Supabase client, and now passes `userId` to the handler. Returns `ActionResult<T>`. Utility file has no `"use server"` directive (only async entry-point action files do) |
| **`insertAuditLog()` silent** | Audit logging failures are swallowed so they never block the primary mutation. Called at the end of every owner action handler. |
| **Void on detail page only** | Void action placed on `/sales/[id]` only — requires navigating to the record first to prevent accidental clicks |
| **Partial return on detail page only** | `SaleReturnActions` component on `/sales/[id]`; same reasoning as void — intentional navigation required |
| **`pos-assets` Storage bucket** | Single public bucket for all images, organized under `products/` and `store/` folder prefixes |
| **On-demand PNG generation** | `GET /api/products/[id]/share` uses `next/og` (`ImageResponse`) with `runtime = "nodejs"` — server fetches product images and store icon as base64 data URLs to avoid CORS canvas tainting. PNG is generated in-memory and streamed; never persisted to storage. Biome and ESLint `no-img-element` rules overridden for this route because Satori requires plain `<img>`. |
| **Stock Report in Inventory** | Stock Report removed from `/reports` — Inventory page covers stock-on-hand, value, and batch detail |
| **User management inline** | Settings page lists all signed-in users; owner assigns roles inline, no Supabase dashboard needed |
| **Split / credit payments** | `sale_payments` holds multiple tender rows per sale; `payment_method` on `sales` is `cash \| transfer \| mixed \| credit` |
| **Resellers** | Optional reseller/customer accounts linked to credit sales; required for POS credit checkout |
| **Migrations squashed** | 15 iterative migration files merged into one clean `00001_schema.sql` |
| **i18n without a library** | No `next-intl` / `react-i18next` dependency. Custom `I18nProvider` + `useI18n()` modelled after the existing theme-provider pattern (`useSyncExternalStore` + localStorage). Typed `Translations` interface prevents missing keys at compile time. |
| **DB-level translations via code map** | System accounts (`accounts` table) are English in the DB. Translated at display-time via `getAccountName(code, dbName, t)` using a `t.accountNames` record keyed by account code. Avoids schema duplication while keeping translations co-located with other strings. |
| **Idempotency via client-generated UUID** | POS client holds a `idempotencyKey` state (`crypto.randomUUID()` on mount). Sent with every `createSale` call. DB function returns the existing sale on replay without re-processing inventory or journals. Key is rotated only after a confirmed success, so a network timeout replaying the same key is safe. |

---

## 1. Goal

Build a lightweight POS system with:

- Sales (POS)
- Inventory management (FIFO-based)
- Purchase orders & stock adjustments
- Accounting (double-entry, balance sheet, P&L)
- Role-based access control (owner/admin, cashier)

Constraints:

- Low cost (ideally $0 for long time)
- Secure (RLS + RBAC + input validation)
- Easy deployment
- Small scale (2 users, ~10–20 transactions/day)

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.2 (App Router, TypeScript 5, React 19) |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Styling | Tailwind CSS v4, dark mode via `dark:` classes |
| Linter | Biome (replaces ESLint + Prettier) |
| Hosting | Frontend: Vercel / Backend: Supabase Cloud |
| Storage | Supabase Storage (`pos-assets` public bucket) |

---

## 3. Architecture Overview

Pattern:

- Modular monolith

Modules:

- POS (sales, void/return)
- Inventory (FIFO batches, movements)
- Purchasing (purchase orders, receiving)
- Adjustments (stock corrections)
- Accounting (journal entries, reports)
- Auth & RBAC (roles, permissions)

---

## 4. Core Database Design

### 4.1 Users & Roles (RBAC)

Supabase Auth handles authentication. Role management is stored in the DB.

```sql
user_roles
- id (uuid, pk)
- user_id (uuid, fk → auth.users)
- role ('owner', 'cashier')
- created_at (timestamptz, default now())
```

Permissions by role:

| Action                | Owner | Cashier |
| --------------------- | ----- | ------- |
| Create sale           | ✅    | ✅      |
| Void/return sale      | ✅    | ❌      |
| Manage products       | ✅    | ❌      |
| Create purchase order | ✅    | ❌      |
| Adjust inventory      | ✅    | ❌      |
| View reports          | ✅    | ❌      |
| View own sales        | ✅    | ✅      |

---

### 4.2 Catalog Tables

**products** — SKU, unit, selling_price, cost_price (updated on PO receive), image_url, category_id FK, is_active, created_at, updated_at  
**categories** — name, is_active  
**suppliers** — name, phone, address, is_active  
**resellers** — name, phone, address, is_active (customer accounts for credit sales)

---

### 4.4 Inventory Tables

**inventory_batches** — product_id FK, quantity_in, quantity_remaining, cost_price, expiry_date (nullable), reference_type ('purchase_order'|'adjustment'), reference_id  
**inventory_movements** — product_id, batch_id, type ('IN'|'OUT'|'ADJUSTMENT'|'RETURN'), quantity, reference_type, reference_id, created_by  
**inventory_adjustments** — adjustment_number (seq), reason, notes, created_by  
**inventory_adjustment_items** — adjustment_id, product_id, batch_id (null for positive), quantity_change (+/-), cost_price

---

### 4.5 Purchase Tables

**purchase_orders** — po_number (seq), supplier_id, status ('draft'|'received'|'cancelled'), payment_method ('cash'|'transfer'|'credit'), total_amount, created_by, received_at  
**purchase_order_items** — po_id, product_id, quantity, cost_price, expiry_date, subtotal  
**supplier_payments** — PO AP payment records (amount, payment_method, notes, created_by)

---

### 4.6 Sales Tables

**sales** — invoice_number (seq), total_amount, total_cogs, discount_type, discount_value, discount_amount, payment_method ('cash'|'transfer'|'mixed'|'credit'), reseller_id FK (nullable), status ('completed'|'voided'), voided_at, voided_by, void_reason, created_by  
**sale_items** — sale_id, product_id, quantity, price, subtotal  
**sale_payments** — Multiple tender rows per sale (method: cash|transfer, amount) — supports cash+transfer split  
**sale_credit_payments** — AR collection records (amount, payment_method, notes, created_by)

---

### 4.7 Accounting Tables

**accounts** — code, name, type ('asset'|'liability'|'equity'|'revenue'|'expense'), is_system (seeded, cannot delete)  
**journal_entries** — reference_type ('sale'|'void'|'purchase_order'|'adjustment'|'credit_payment'|'supplier_payment'), reference_id, description  
**journal_lines** — journal_entry_id, account_id, debit, credit

Seeded chart of accounts:

| Code | Name | Type |
|---|---|---|
| 1001 | Cash | asset |
| 1002 | Bank / Transfer | asset |
| 1100 | Inventory | asset |
| 1200 | Accounts Receivable | asset |
| 2001 | Accounts Payable | liability |
| 3001 | Owner Equity | equity |
| 4001 | Sales Revenue | revenue |
| 5001 | Cost of Goods Sold | expense |
| 5002 | Inventory Adjustment Expense | expense |

---

### 4.8 Other Tables

**campaigns** — name, discount_type ('percentage'|'fixed'), discount_value, trigger_type ('always'|'min_cart_total'|'min_product_qty'), trigger_value, start_date, end_date, is_active, created_by  
**campaign_products** — campaign_id, product_id, min_quantity  
**store_settings** — Single-row: store_name, store_icon_url

---

### 4.9 Product Price History (`00004_product_prices.sql`)

**product_price_history** — product_id FK, old_price, new_price, changed_by (user_id), changed_at (timestamptz)

Populated automatically when `products.selling_price` is updated. UI: price history modal in `/products`.

---

### 4.10 Product Units (`00005_product_units.sql`)

**product_units** — id (uuid, pk), product_id FK, name (e.g. 'pcs', 'box', 'kg'), is_default, created_at

Full CRUD management inside the `/products` page.

---

### 4.11 Audit Logs (`00006_audit_logs.sql`)

**audit_logs** — id (uuid, pk), user_id FK, action (text), entity (text), entity_id (text, nullable), payload (jsonb, nullable), created_at (timestamptz)

Written via `insertAuditLog()` helper inside every `ownerAction()` handler. Failures silently ignored.

---

### 4.12 Sale Returns (`00007_sale_returns.sql`)

**sale_returns** — id (uuid, pk), sale_id FK, reason (text), created_by FK, created_at  
**sale_return_items** — return_id FK, sale_item_id FK, product_id FK, quantity (int), cost_price (numeric), batch_id FK

On partial return: restores `inventory_batches.quantity_remaining`, inserts `inventory_movements` (type = 'RETURN'), creates reversal journal entry for returned amount only.

---

### 4.13 Sale Idempotency (`00008_idempotency_key.sql`)

`sales.idempotency_key` (text, nullable) — unique partial index (where not null).  
Generated client-side as a `crypto.randomUUID()` per checkout attempt.  
`create_sale_transaction` checks for an existing sale with the same key before doing any work; if found, returns the existing sale's data with `idempotent: true` — no duplicate inventory or journal entries are created.  
The key is rotated after a confirmed successful sale response so accidental replays from network retries are safe.

---

### 4.9 Invoice Number Sequences

PostgreSQL sequences (`invoice_number_seq`, `po_number_seq`, `adj_number_seq`) generate zero-padded numbers formatted as:
- Sales: `INV-20260408-0001`
- Purchase orders: `PO-20260408-0001`
- Adjustments: `ADJ-20260408-0001`

---

## 5. FIFO Inventory Logic

- Consume oldest batches first (ordered by `created_at ASC`)
- Each sale may consume multiple batches
- On void/return, restore stock to original batches
- FIFO also applies with optional expiry: batches without expiry are consumed after those with earlier expiry dates (FEFO fallback)

---

## 6. Sales Transaction Flow (CRITICAL)

All steps must run inside ONE transaction:

1. Validate all product IDs exist and are active
2. Insert `sales` + `sale_items` (with sequence-generated invoice number)
3. FIFO consume `inventory_batches`
4. Insert `inventory_movements` (type = 'OUT')
5. Calculate COGS from consumed batches
6. Update `sales.total_cogs`
7. Create `journal_entries` + `journal_lines`

Journal for sale (payment_method = 'cash'):
| Account            | Debit   | Credit  |
| ------------------ | ------- | ------- |
| Cash (1001)        | total   |         |
| Sales Revenue (4001) |       | total   |
| COGS (5001)        | cogs    |         |
| Inventory (1100)   |         | cogs    |

Journal for sale (payment_method = 'transfer'):
| Account                | Debit   | Credit  |
| ---------------------- | ------- | ------- |
| Bank / Transfer (1002) | total   |         |
| Sales Revenue (4001)   |         | total   |
| COGS (5001)            | cogs    |         |
| Inventory (1100)       |         | cogs    |

---

## 7. Purchase Order Flow

All steps within ONE transaction when receiving (status → 'received'):

1. Validate PO exists and status = 'draft'
2. Update PO status to 'received', set `received_at`
3. For each PO item:
   - Create `inventory_batches` (qty_in, qty_remaining, cost_price, expiry_date)
   - Insert `inventory_movements` (type = 'IN')
4. Create journal entries

Journal for purchase (payment_method = 'cash'):
| Account              | Debit   | Credit  |
| -------------------- | ------- | ------- |
| Inventory (1100)     | total   |         |
| Cash (1001)          |         | total   |

Journal for purchase (payment_method = 'transfer'):
| Account              | Debit   | Credit  |
| -------------------- | ------- | ------- |
| Inventory (1100)     | total   |         |
| Bank / Transfer (1002) |       | total   |

---

## 8. Inventory Adjustment Flow

All steps within ONE transaction:

1. Insert `inventory_adjustments` + `inventory_adjustment_items`
2. For positive adjustments (stock in):
   - Create new `inventory_batches`
   - Insert `inventory_movements` (type = 'ADJUSTMENT')
3. For negative adjustments (stock out/write-off):
   - FIFO consume from existing batches
   - Insert `inventory_movements` (type = 'ADJUSTMENT')
4. Create journal entries

Journal for negative adjustment (write-off):
| Account                        | Debit   | Credit  |
| ------------------------------ | ------- | ------- |
| Inventory Adjustment Expense (5002) | cost  |         |
| Inventory (1100)               |         | cost    |

Journal for positive adjustment (found stock):
| Account                        | Debit   | Credit  |
| ------------------------------ | ------- | ------- |
| Inventory (1100)               | cost    |         |
| Inventory Adjustment Expense (5002) |     | cost    |

---

## 9. Void / Return Flow

Owner-only. All steps within ONE transaction:

1. Validate sale exists and status = 'completed'
2. Update sale: status → 'voided', set `voided_at`, `voided_by`, `void_reason`
3. Restore `inventory_batches.quantity_remaining` for each original batch consumed
4. Insert `inventory_movements` (type = 'RETURN')
5. Create reversal journal entry (swap all debits/credits from original sale)

---

## 9a. Partial Return Flow

Owner-only. Operates on an individual sale item selection (not the whole sale):

1. Validate sale exists and status = 'completed'
2. For each returned item + quantity:
   - Validate quantity ≤ original sale item quantity (minus any previously returned qty)
   - Restore `inventory_batches.quantity_remaining` for the original consumed batch
   - Insert `inventory_movements` (type = 'RETURN')
3. Insert `sale_returns` + `sale_return_items` rows
4. Create partial reversal journal entry (only for the returned amount)
5. Sale status remains 'completed' (not voided); partial returns are tracked separately

---

## 10. PostgreSQL RPC Functions

All critical operations run as atomic PostgreSQL functions. Implementations live in `supabase/migrations/00001_schema.sql`.

| Function | Purpose |
|---|---|
| `create_sale_transaction(payload)` | Atomic: inserts sale + items, FIFO consumes batches, creates inventory movements, journal entries. Validates product existence and stock. Supports idempotency via `payload.idempotencyKey` — replays return the existing sale without re-processing. |
| `void_sale(sale_id, reason)` | Reverses a completed sale: restores batch quantities, inserts RETURN movements, creates reversal journal entry. |
| `receive_purchase_order(po_id)` | Marks PO received, creates inventory batches + IN movements, creates journal entry. Credit PO creates AP entry. |
| `create_inventory_adjustment(payload)` | Positive adj: new batch + journal debit Inventory. Negative: FIFO consume + journal debit Expense. |
| `collect_sale_payment(payload)` | Records AR collection, reduces Accounts Receivable, journals cash/transfer debit. |
| `pay_supplier(payload)` | Records AP payment, reduces Accounts Payable, journals cash/transfer debit. |
| `get_stock_report()` | Returns product SKU/name/stock_on_hand/stock_value from batches with remaining qty. |
| `get_sales_summary(start?, end?, days?)` | Daily aggregation: count, revenue, COGS, gross profit. |

---

## 11. Transaction Journals

### Sale (cash)
| Account | Debit | Credit |
|---|---|---|
| Cash (1001) | total | |
| Sales Revenue (4001) | | total |
| COGS (5001) | cogs | |
| Inventory (1100) | | cogs |

### Sale (transfer / mixed — per payment tender)
Same as cash but debits Bank/Transfer (1002) for transfer portion.

### Sale (credit)
| Account | Debit | Credit |
|---|---|---|
| Accounts Receivable (1200) | total | |
| Sales Revenue (4001) | | total |
| COGS (5001) | cogs | |
| Inventory (1100) | | cogs |

### PO Receive (cash/transfer)
| Account | Debit | Credit |
|---|---|---|
| Inventory (1100) | total | |
| Cash/Bank (1001/1002) | | total |

### PO Receive (credit)
| Account | Debit | Credit |
|---|---|---|
| Inventory (1100) | total | |
| Accounts Payable (2001) | | total |

### Inventory Adjustment (write-off)
| Account | Debit | Credit |
|---|---|---|
| Adj Expense (5002) | cost | |
| Inventory (1100) | | cost |

### Void — reverses all debits/credits of original sale journal.

### AR Collection — debits Cash/Bank, credits Accounts Receivable.

### AP Payment — debits Accounts Payable, credits Cash/Bank.

---

## 12. Frontend Structure (Actual)

```
src/app/
  page.tsx                        → redirect to /dashboard
  (authenticated)/
    layout.tsx                    → sidebar + auth guard
    dashboard/page.tsx            → stats, AR/AP summary, low stock
    pos/page.tsx                  → POS interface
    sales/
      page.tsx                    → sales list (filter by date, status)
      [id]/page.tsx               → sale detail + void + partial return
    inventory/
      page.tsx                    → stock report
      [id]/page.tsx               → batch detail
      adjustments/
        page.tsx                  → adjustment history
        new/page.tsx              → create adjustment
    purchases/
      page.tsx                    → PO list
      new/page.tsx                → create PO
      [id]/page.tsx               → PO detail + pay supplier
    products/page.tsx             → product catalog CRUD
    credit/
      page.tsx                    → AR/AP overview
      [id]/page.tsx               → credit sale payments
    reports/page.tsx              → Balance Sheet, P&L, Sales, Stock
    catalog/
      categories/page.tsx
      suppliers/page.tsx
      resellers/page.tsx
      campaigns/page.tsx
    settings/page.tsx             → store settings + user roles
  login/page.tsx
  auth/callback/page.tsx

src/lib/
  types.ts                        → all TypeScript types + ActionResult<T>
  auth.ts                         → getCurrentUser() (React cache), isOwner()
  utils.ts                        → formatCurrency, formatDate, formatDateTime (id-ID locale)
  actions/
    action-utils.ts               → ownerAction() (passes userId to handler), validateName(), insertAuditLog() — NO "use server"
    auth.ts, products.ts, categories.ts, suppliers.ts, resellers.ts
    campaigns.ts, sales.ts, purchases.ts, inventory.ts
    credit.ts, supplier-payments.ts, reports.ts, store-settings.ts, users.ts
  supabase/
    client.ts, server.ts, admin.ts, middleware.ts
  hooks/
    use-cart.ts                   → cart state + campaign pricing
    use-toast.ts                  → toast notification

  components/
  ui/                             → button, input, select, modal, toast, sidebar,
                                    page-header, list-filter, image-upload,
                                    table-page-loading, theme-provider
  pos/                            → pos-client, product-grid, cart-panel, receipt-modal
  sales/                          → sales-list-client, sale-void-actions, sale-return-actions, sale-credit-payments-client
  inventory/                      → inventory-list-client, new-adjustment-client
  purchases/                      → purchases-list-client, new-po-client, po-detail-actions, supplier-payments-client
  products/                       → products-client (incl. price history modal, unit management)
  reports/                        → sales-report-client, profit-loss-client, balance-sheet-client (period filter)
  settings/                       → store-settings-form, categories-client, suppliers-client (with edit),
                                    resellers-client, campaigns-client, users-client, sales-history-client
```

---

## 13. Security

- **Authentication:** Google OAuth only. `/auth/callback` exchanges code for session. Users without a `user_roles` row are redirected to login.
- **Authorization:** `ownerAction()` wrapper validates auth + role before every owner-only mutation. RLS enforces at DB level.
- **RLS:** Cashiers SELECT own sales only. Owner has full access. All mutations on products, PO, adjustments, adjustments restricted to owner.
- **Input validation:** PostgreSQL functions validate product existence, stock availability, positive quantities, valid enums. Frontend validates for UX only.
- **API security:** `SUPABASE_SERVICE_ROLE_KEY` used only in Server Actions (never in client bundle). All RPCs called through Server Actions, never directly from the browser.

---

## 14. Performance & Infrastructure

- **Indexing:** BTREE indexes on `created_at`, `status`, `product_id`, `reference_id`; partial index on `inventory_batches` where `quantity_remaining > 0`
- **Scale:** 10–20 tx/day — performance is not a concern; indexes are for query plan correctness
- **Caching:** React `cache()` for `getCurrentUser()` deduplication per request; Intl formatters created once at module level
- **Environment variables:** Supabase URL is required at build time (`next.config.ts` throws if missing); no hardcoded secrets

---

## 15. Image Handling

- **Bucket:** `pos-assets` (public) in Supabase Storage
- **Paths:** `products/{uuid}.ext` for product images, `store/{uuid}.ext` for store icon
- **Component:** drag-drop `ImageUpload` — max 2 MB, JPEG/PNG/WebP/GIF only
- **URLs stored in:** `products.image_url`, `store_settings.store_icon_url`
- **Next.js config:** Supabase storage hostname whitelisted in `images.remotePatterns`
- **RLS on storage.objects:** authenticated users can INSERT/UPDATE/DELETE; public SELECT

---

## 16. Architecture Patterns

- **Server Actions:** `"use server"` per action file, `ownerAction()` for auth, `revalidatePath()` after mutations
- **Client/Server split:** Page shells are Server Components (fetch data server-side), interactive logic in Client Components (`"use client"`)
- **`ActionResult<T>`:** `{ data: T } | { error: string }` — canonical return type for all actions
- **Atomic transactions:** All inventory-affecting operations run as single PostgreSQL function calls
- **FIFO inventory:** `inventory_batches` ordered by `created_at ASC`, `FOR UPDATE` locking during consume
- **Double-entry accounting:** every inventory event creates both `inventory_movements` and `journal_lines`

---

## 17. Future Work

| Item | Status | Notes |
|---|---|---|
| Expiry alerts | ⏳ Pending | Notify when batches near expiry date |
| Barcode/QR scanning | ⏳ Pending | Scan to add items to POS cart or PO |
| Multi-store support | ⏳ Pending | Single store only |

---

## 18. Testing

### Setup

| Tool | Purpose |
|---|---|
| **Vitest 4** | Unit and component test runner (jsdom environment) |
| **@testing-library/react** | React component rendering and querying |
| **@testing-library/jest-dom** | Extra DOM matchers (`toBeInTheDocument`, etc.) |
| **@playwright/test** | End-to-end browser tests (Chromium) |

Config files: `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`.

### Scripts

```bash
npm test                # Vitest — run once
npm run test:watch      # Vitest — watch mode
npm run test:coverage   # Vitest — coverage report (v8)
npm run test:e2e        # Playwright — all projects
npx playwright test --project=unauthenticated  # no session needed
npx playwright test --project=authenticated    # needs e2e/.auth/user.json
```

### Unit tests (`src/lib/__tests__/`)

| File | Coverage |
|---|---|
| `utils.test.ts` | `formatCurrency`, `formatDate`, `formatDateTime` |
| `hooks/__tests__/use-cart.test.ts` | Add/update/remove/clear cart; bulk pricing; campaign discounts (%, fixed, inactive, expired, min_cart_total); manual discounts (%, fixed, cap); `buildSaleItems` |
| `actions/__tests__/action-utils.test.ts` | `validateName` (all branches); `ownerAction` (unauthenticated, cashier role, owner passes userId, propagates handler result); `insertAuditLog` (correct fields, null defaults, silently ignores error responses) |

### Component tests (`src/components/ui/__tests__/`, `src/components/sales/__tests__/`)

| File | Coverage |
|---|---|
| `ui/__tests__/pagination.test.tsx` | Renders nothing ≤1 page; `aria-current`; prev/next disabled states; href correctness; ellipsis at range boundaries; rows-per-page dropdown renders with correct options (10/20/50/100), reflects current pageSize, calls `router.push` on change, and shows when `totalPages === 1` |
| `sales/__tests__/sale-return-actions.test.tsx` | Returns null for non-completed sales; hides button when all items fully returned; shows button with returnable items; opens return modal; renders return history; respects prior return quantities when computing max returnable |

### E2E tests (`e2e/`)

| Project | File | Scenarios |
|---|---|---|
| `unauthenticated` | `login.spec.ts` | Login page renders; Google button visible; unauthenticated redirects to `/login` for `/dashboard`, `/sales`, `/pos` |
| `authenticated` | `sales.spec.ts` | Sales list renders; search debounces into URL; pagination navigates; Purchases heading; POS smoke |

> **Auth setup:** The app uses Google OAuth only. Playwright cannot automate the Google consent screen. Generate `e2e/.auth/user.json` by capturing a real session cookie — see `e2e/README.md` for instructions.
