# Gold-Smith ERP

A full-featured jewellery workshop management system built with **Next.js 16 App Router**, **React 19**, **MongoDB**, and **Cloudflare R2**.

Covers the complete business cycle: raw-material procurement → karigar (artisan) manufacturing → inventory → customer sales, approvals, invoicing, and payments.

---

## Table of contents

- [Modules](#modules)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Database seeding](#database-seeding)
- [Demo accounts](#demo-accounts)
- [Demo data overview](#demo-data-overview)
- [Project structure](#project-structure)
- [Roles & permissions](#roles--permissions)
- [Key conventions](#key-conventions)

---

## Modules

| Section | Route | Description |
|---|---|---|
| **Vendors** | `/dashboard/vendors` | Gold & diamond suppliers |
| **Customers** | `/dashboard/customers` | Customer CRM with tiers (Regular / Premium / VIP) |
| **Karigars** | `/dashboard/karigars` | Artisans/craftsmen — labour basis, specialisation |
| **Users** | `/dashboard/users` | Staff accounts with role-based access |
| **Gold Purchases** | `/dashboard/gold-purchases` | Raw gold procurement with purity-wise items |
| **Diamond Purchases** | `/dashboard/diamond-purchases` | Diamond lot purchases by sieve size and shape |
| **Karigar Issues** | `/dashboard/manufacturing/issues` | Gold + diamond issued to karigar for a job |
| **Karigar Receipts** | `/dashboard/manufacturing/receipts` | Finished jewellery received back; auto-creates product records |
| **Products** | `/dashboard/products` | Jewellery inventory (auto-created from receipts) |
| **Approvals** | `/dashboard/approvals` | Jewellery issued to customers on trial (memo/approval basis) |
| **Invoices** | `/dashboard/invoices` | Sales invoices with gold-rate, making-charge, GST breakdown |
| **Payments** | `/dashboard/payments` | Payment recording against invoices |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.x (App Router) |
| Runtime | React 19 |
| Database | MongoDB Atlas (native driver — no Mongoose in server code) |
| Auth | JWT (jsonwebtoken) + HTTP-only cookie session |
| File storage | Cloudflare R2 (S3-compatible, public bucket) |
| UI | Tailwind CSS 4, shadcn/ui components |
| Email | Resend |
| Deployment | Vercel (recommended) |

---

## Prerequisites

- Node.js 20+
- A **MongoDB Atlas** cluster (free M0 tier is sufficient)
- A **Cloudflare R2** bucket with public access enabled
- A **Resend** account (for password-reset emails — optional in dev)

---

## Local setup

```bash
# 1. Clone
git clone https://github.com/ravindrasirvi609/gold-smith.git
cd gold-smith

# 2. Install dependencies
npm install

# 3. Copy and fill environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, R2 credentials, etc.

# 4. Seed the database (order matters)
npm run seed:access-control   # roles & permissions
npm run seed:admin-user       # initial admin account
npm run seed:reference-data   # dropdown options (purity, categories, etc.)
npm run seed:demo             # realistic demo dataset

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | Database name (default: `gold-smith`) |
| `NEXT_PUBLIC_APP_URL` | Public base URL (e.g. `http://localhost:3000`) |
| `JWT_SECRET` | Long random string for signing session JWTs |
| `RESEND_API_KEY` | Resend API key (for email) |
| `RESEND_FROM_EMAIL` | Sender address shown on emails |
| `SEED_ADMIN_EMAIL` | Email for the initial admin user |
| `SEED_ADMIN_PASSWORD` | Password for the initial admin user |
| `SEED_ADMIN_FIRST_NAME` | Admin first name |
| `SEED_ADMIN_LAST_NAME` | Admin last name |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 API key ID |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key |
| `CLOUDFLARE_R2_BUCKET_NAME` | R2 bucket name |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public base URL of the R2 bucket |
| `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` | Same — exposed to client for image rendering |

> **Atlas IP access**: If seeds fail with `ETIMEDOUT`, add your machine's IP (or `0.0.0.0/0` for local dev) in Atlas → Network Access → Add IP Address.

---

## Database seeding

Four seed scripts are provided. Run them **in this order**:

```bash
# 1. Roles, permissions, and role-permission mappings
npm run seed:access-control

# 2. Admin staff account (reads SEED_ADMIN_* env vars)
npm run seed:admin-user

# 3. Reference data — dropdown options throughout the app
npm run seed:reference-data

# 4. Demo dataset — vendors, customers, karigars, purchases,
#    issues, receipts, products, approvals, invoices, payments
npm run seed:demo
```

`seed:demo` is **safe to re-run** — it drops all transactional collections before inserting, leaving roles, permissions, reference data, and the admin account untouched.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | value of `SEED_ADMIN_EMAIL` | value of `SEED_ADMIN_PASSWORD` |
| Manager | `manager@goldsmith.demo` | value of `SEED_DEMO_PASSWORD` |
| Sales rep | `sales@goldsmith.demo` | value of `SEED_DEMO_PASSWORD` |

---

## Demo data overview

The seed creates a complete end-to-end business story:

### Vendors (3)
| Code | Name | Type |
|---|---|---|
| V0001 | Shivam Gold Traders, Mumbai | Gold (916 & 999) |
| V0002 | Mahavir Bullion, Ahmedabad | Gold (750 & 585) |
| V0003 | Diamond House Pvt Ltd, Surat | Diamond (GIA certified) |

### Customers (5)
| Code | Name | Tier |
|---|---|---|
| C0001 | Mrs. Anita Patel, Ahmedabad | VIP |
| C0002 | Mr. Suresh Mehta, Surat | Premium |
| C0003 | Miss Kavya Reddy, Hyderabad | Regular |
| C0004 | Mr. Rajesh Shah, Mumbai | Regular |
| C0005 | Mrs. Sunita Joshi, Pune | VIP |

### Karigars (3)
| Code | Name | Specialisation | Skill |
|---|---|---|---|
| K0001 | Ramjibhai Soni | Rings | Senior |
| K0002 | Lalibhai Suthar | Chains | Intermediate |
| K0003 | Prabhubhai Rajput | Earrings | Junior |

### Purchases
| Code | Description | Status |
|---|---|---|
| GP0001 | 500g gold (916 + 999) from Shivam, ₹34,09,301 | Completed |
| GP0002 | 200g gold (750) from Mahavir, ₹8,70,590 | Completed |
| GP0003 | 300g gold (916) from Shivam, ₹19,51,080 | Draft |
| DP0001 | Diamonds (rounds + fancy ovals) from Diamond House, ₹3,39,823 | Completed |

### Manufacturing flow
| Code | Karigar | Job | Status |
|---|---|---|---|
| KI0001 | Ramjibhai | 20g gold + 1ct diamonds → 2 solitaire rings | Completed |
| KI0002 | Lalibhai | 60g gold → chain + necklace set | Completed |
| KI0003 | Prabhubhai | 16g gold + 0.5ct diamonds → jhumka pair | Issued (in progress) |
| KR0001 | Ramjibhai | 2 diamond solitaire rings received | Completed |
| KR0002 | Lalibhai | Gold chain + necklace set received | Completed |

### Products (auto-created from receipts)
| Code | Name | Weight | Status |
|---|---|---|---|
| JC0001 | Diamond Solitaire Ring (Lady's) | 8.50 g | Sold |
| JC0002 | Diamond Solitaire Ring (Gents) | 8.80 g | On Approval |
| JC0003 | Gold Curb Chain 22g | 22.00 g | Sold (on invoice INV-00002) |
| JC0004 | Classic Gold Necklace Set | 35.00 g | Available |

### Sales
| Code | Customer | Description | Status |
|---|---|---|---|
| APP-00001 | Anita Patel | Gents solitaire on trial | Issued |
| INV-00001 | Suresh Mehta | Lady's solitaire ring, ₹1,17,554 | Paid |
| INV-00002 | Kavya Reddy | Gold curb chain, ₹1,63,805 | Pending payment |
| PAY-00001 | Suresh Mehta | Cash payment for INV-00001 | Paid |

---

## Project structure

```
gold-smith/
├── app/
│   ├── api/              # REST API routes (one folder per resource)
│   └── dashboard/        # Page components (server + client)
│       ├── vendors/
│       ├── customers/
│       ├── karigars/
│       ├── users/
│       ├── gold-purchases/
│       ├── diamond-purchases/
│       ├── manufacturing/
│       │   ├── issues/
│       │   └── receipts/
│       ├── products/
│       ├── approvals/
│       ├── invoices/
│       └── payments/
├── components/
│   ├── forms/            # Shared form primitives (W2 form kit)
│   ├── inventory/        # Purchase form components
│   ├── manufacturing/    # Karigar issue & receipt form components
│   ├── sales/            # Approval, invoice, payment form components
│   └── ui/               # shadcn/ui components + StatusBadge, etc.
├── lib/
│   ├── admin-*.ts        # Server-side data access per domain
│   ├── auth.ts           # getSession(), hasPermission()
│   ├── formatters.ts     # formatINR(), formatDate(), formatWeight()
│   ├── sequences.ts      # Atomic MongoDB counters for entity codes
│   └── r2.ts             # Cloudflare R2 upload helpers
└── scripts/
    ├── seed-access-control.mjs
    ├── seed-admin-user.mjs
    ├── seed-reference-data.mjs
    └── seed-demo-data.mjs
```

---

## Roles & permissions

Created by `seed:access-control`:

| Role | Intended for |
|---|---|
| Super Admin | Full access — no restrictions |
| Admin | Full access minus user management |
| Manager | View + edit all modules; cannot delete |
| Sales | Customers, approvals, invoices, payments only |
| Karigar Manager | Manufacturing + product modules only |
| Accounts | Purchases, invoices, payments (read-heavy) |
| Viewer | Read-only across all modules |

Permission keys follow the pattern `{RESOURCE}_{ACTION}`, e.g. `VENDOR_CREATE`, `INVOICE_VIEW`, `PRODUCT_DELETE`.

---

## Key conventions

- **Entity codes** are auto-incremented via the `sequences` collection using `lib/sequences.ts`. Formats: `V0001` (vendors), `C0001` (customers), `K0001` (karigars), `GP0001` (gold purchases), `KI0001` (karigar issues), `JC0001` (products), `APP-00001` (approvals), `INV-00001` (invoices), `PAY-00001` (payments).

- **Money** is stored as a **string** in the database (no floating-point rounding issues) and formatted for display via `formatINR()` from `lib/formatters.ts` (Indian lakh/crore grouping, ₹ prefix).

- **Dates** are stored as ISO date strings (`"YYYY-MM-DD"`) and displayed via `formatDate()` (default: "24 Jul 2026").

- **File uploads** go to Cloudflare R2 under `<module>/<yyyy>/<mm>/<ulid>.<ext>`. Public URLs are stored directly in MongoDB as plain strings.

- **Status badges** are rendered by `StatusBadge` from `components/ui/status-badge.tsx`. Tones are resolved automatically from the reference-data catalog.

- **Form kit** (`components/forms/`) — `MoneyInput`, `WeightInput`, and `PercentInput` use `onValueChange` (not `onChange`) and require a `name` prop. `ReferenceSelect` uses a native `ChangeEvent<HTMLSelectElement>` for its `onChange`.
