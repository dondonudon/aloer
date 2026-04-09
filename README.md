# Aloer POS

A lightweight Point-of-Sale system with FIFO inventory, double-entry accounting, and role-based access control. Built for small-scale retail operations (~10–20 transactions/day).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.2 (App Router, TypeScript 5, React 19) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS v4, dark mode via `dark:` classes |
| Linter | Biome |
| Hosting | Vercel (frontend) + Supabase Cloud (backend) |

## Features

- **POS** — product grid, cart, FIFO-based sale, cash/transfer/split/credit payment, percentage or fixed discounts, campaign discounts, reseller picker, receipt modal
- **Sales** — filterable list by date range and status; sale detail with line items, COGS, profit; owner-only void
- **Inventory** — stock on hand + value per product per batch; adjustment history and creation
- **Purchases** — create PO, receive PO (updates inventory + journals), cancel PO, pay supplier (AP flow)
- **Credit (AR/AP)** — outstanding credit sales and credit POs, payment collection per record
- **Catalog** — categories, suppliers, resellers, campaigns — full CRUD
- **Reports** — Sales summary, Profit & Loss, Balance Sheet (all exportable to PDF)
- **Settings** — store name + icon upload; inline user role assignment (no Supabase dashboard needed)
- **XLSX / CSV export** — Sales and Purchases list pages
- **Dark mode** — persisted in localStorage

## Auth & Roles

Access is Google OAuth only. Users must exist in the `user_roles` table to enter the app.

| Action | Owner | Cashier |
|---|---|---|
| Create sale | ✅ | ✅ |
| Void sale | ✅ | ❌ |
| Manage products / catalog | ✅ | ❌ |
| Create / receive purchase orders | ✅ | ❌ |
| Adjust inventory | ✅ | ❌ |
| View reports | ✅ | ❌ |

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- Google OAuth credentials configured in the Supabase Auth dashboard

## Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> `SUPABASE_SERVICE_ROLE_KEY` is only used in Server Actions and never sent to the browser.

## Database Setup

Apply the migrations to your Supabase project:

```bash
npx supabase db push
```

All 18 tables, 8 RPC functions, RLS policies, and the seeded chart of accounts are defined in `supabase/migrations/00001_schema.sql`.

## Getting Started

```bash
npm install
npm run dev
```

Open the URL printed by the dev server (defaults to `http://localhost:3000`; set `NEXT_PUBLIC_SITE_URL` in `.env.local` to override). You will be redirected to `/login` until you authenticate with Google and are added to `user_roles`.

## Scripts

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run lint          # Biome check
npm run lint:fix      # Biome check + auto-fix
npm run format        # Biome format
npm test              # Vitest (run once)
npm run test:watch    # Vitest (watch mode)
npm run test:coverage # Vitest with coverage (v8)
npm run test:e2e      # Playwright E2E tests (all projects)
npm run test:e2e:setup # Save browser auth state for authenticated tests
```

## Testing

Unit and component tests use **Vitest** + **Testing Library**. E2E tests use **Playwright** (Chromium).

```bash
# Run only unauthenticated E2E tests (no session required)
npx playwright test --project=unauthenticated

# Run authenticated E2E tests (requires e2e/.auth/user.json)
npx playwright test --project=authenticated
```

Because the app uses Google OAuth, Playwright cannot automate the consent screen.
Run `npm run test:e2e:setup` once to capture your session cookies and write `e2e/.auth/user.json`.
See `e2e/README.md` for the full walkthrough.

## Project Structure

```
src/
  app/                      # Next.js App Router pages
    (authenticated)/        # Protected routes (sidebar + auth guard)
      dashboard/
      pos/
      sales/
      inventory/
      purchases/
      products/
      credit/
      reports/
      catalog/
      settings/
    login/
    auth/callback/
  components/               # Client components (ui/, pos/, sales/, etc.)
  lib/
    actions/                # Server Actions ("use server")
    hooks/                  # use-cart, use-toast
    supabase/               # Supabase client helpers
    types.ts                # Shared TypeScript types + ActionResult<T>
    auth.ts                 # getCurrentUser(), isOwner()
    utils.ts                # formatCurrency, formatDate, formatDateTime
supabase/
  migrations/
    00001_schema.sql        # Full schema (tables, RLS, RPC functions)
```

## Architecture Notes

- All inventory-affecting operations run as **atomic PostgreSQL RPC functions** — no partial writes.
- **FIFO** batch consumption: oldest batches consumed first (`created_at ASC`, `FOR UPDATE` locking).
- **Double-entry accounting**: every inventory event produces both `inventory_movements` and `journal_lines`.
- Server Actions use `ownerAction()` wrapper for auth + role enforcement before any owner-only mutation.
- Page shells are **Server Components** (data fetched server-side); interactive logic is in Client Components.
