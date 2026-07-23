# Gold-Smith — Complete Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Environment Variables](#4-environment-variables)
5. [Project Structure](#5-project-structure)
6. [Authentication & Sessions](#6-authentication--sessions)
7. [Permissions & Roles](#7-permissions--roles)
8. [Database & Collections](#8-database--collections)
9. [File Upload System (Cloudflare R2)](#9-file-upload-system-cloudflare-r2)
10. [Modules Reference](#10-modules-reference)
11. [API Routes Reference](#11-api-routes-reference)
12. [Frontend Components](#12-frontend-components)
13. [Dashboard & Analytics](#13-dashboard--analytics)
14. [Inventory Ledger System](#14-inventory-ledger-system)
15. [Manufacturing Flow](#15-manufacturing-flow)
16. [Sales Flow](#16-sales-flow)
17. [Audit Logging](#17-audit-logging)
18. [Deployment Guide](#18-deployment-guide)
19. [Known Limitations & TODOs](#19-known-limitations--todos)

---

## 1. Project Overview

**Gold-Smith** is a full-featured Jewellery ERP (Enterprise Resource Planning) application designed for jewellery businesses. It manages the complete lifecycle of a jewellery operation:

- **Master data** — vendors, customers, karigars (craftsmen)
- **Inventory** — gold and diamond procurement with a running ledger
- **Manufacturing** — issuing raw material to karigars, receiving finished products
- **Sales** — approvals, invoices, and payment tracking
- **Access control** — fine-grained role-based permissions
- **Document management** — file/image uploads for KYC, invoices, and product photos via Cloudflare R2

### Key Business Flows

```
PURCHASE → LEDGER → KARIGAR ISSUE → KARIGAR RECEIPT → PRODUCT
                                                          ↓
                                          APPROVAL → INVOICE → PAYMENT
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| UI Library | React | 19.2.4 |
| Database | MongoDB (native driver) | ^7.4.0 |
| ORM | Mongoose (schema definitions only) | ^9.7.3 |
| Authentication | JWT + bcrypt | jsonwebtoken ^9, bcryptjs ^3 |
| File Storage | Cloudflare R2 (S3-compatible) | @aws-sdk/client-s3 ^3 |
| UI Components | shadcn/ui + Radix UI | shadcn ^4 |
| Charts | Recharts | ^3.8.0 |
| Styling | Tailwind CSS | ^4 |
| Icons | Lucide React | ^1.21.0 |
| Toasts | Sonner | ^2.0.7 |
| Date Utilities | date-fns | ^4.4.0 |
| ID Generation | ULID | ^3.0.2 |
| Email | Resend (installed, not yet active) | ^6.16.0 |

---

## 3. Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (or local MongoDB 6+)
- A Cloudflare R2 bucket (for file uploads)

### Installation

```bash
git clone <repo-url>
cd gold-smith
npm install
```

### Setup Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials (see Section 4)
```

### Seed the Database

Run these two seed scripts in order:

```bash
# 1. Seed all 57 permissions and 5 default roles
npm run seed:access-control

# 2. Create the Super Admin user using credentials from .env.local
npm run seed:admin-user
```

### Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run start
```

---

## 4. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all required values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | Yes | — | Full MongoDB connection string (Atlas or local) |
| `MONGODB_DB_NAME` | No | `gold-smith` | Target database name |
| `JWT_SECRET` | Yes | — | Secret used to sign/verify session JWTs. Use a long random string in production. |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Public base URL of the app |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | — | Your Cloudflare account ID (found in R2 dashboard) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Yes | — | R2 API token access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Yes | — | R2 API token secret key |
| `CLOUDFLARE_R2_BUCKET_NAME` | Yes | `chips-doc` | Name of the R2 bucket |
| `CLOUDFLARE_R2_PUBLIC_URL` | Yes | — | Public base URL for serving files (server-side) |
| `NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL` | Yes | — | Same URL exposed to the browser |
| `SEED_ADMIN_EMAIL` | Seed only | — | Email for the initial Super Admin |
| `SEED_ADMIN_PASSWORD` | Seed only | — | Password for the initial Super Admin |
| `SEED_ADMIN_FIRST_NAME` | No | `Admin` | First name for seeded admin |
| `SEED_ADMIN_LAST_NAME` | No | `User` | Last name for seeded admin |

> **Security:** Never commit `.env.local` to version control. `NEXT_PUBLIC_*` variables are bundled into the client JavaScript — do not put secrets there.

---

## 5. Project Structure

```
gold-smith/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, header, footer)
│   ├── page.tsx                # Public landing page
│   ├── globals.css             # Tailwind base + global styles
│   ├── login/                  # Login page
│   ├── dashboard/              # All protected pages
│   │   ├── page.tsx            # Main dashboard with KPIs & charts
│   │   ├── vendors/            # Vendor management
│   │   ├── customers/          # Customer management
│   │   ├── karigars/           # Karigar (craftsman) management
│   │   ├── users/              # User management
│   │   ├── roles/              # Role management
│   │   ├── permissions/        # Permission management
│   │   ├── inventory/          # Inventory hub
│   │   ├── gold-purchases/     # Gold purchase management
│   │   ├── diamond-purchases/  # Diamond purchase management
│   │   ├── manufacturing/      # Manufacturing hub
│   │   │   ├── issues/         # Karigar issues
│   │   │   └── receipts/       # Karigar receipts
│   │   ├── products/           # Product catalogue
│   │   ├── product-history/    # Product event log
│   │   ├── approvals/          # Sales approvals
│   │   ├── invoices/           # Sales invoices
│   │   ├── payments/           # Payment records
│   │   ├── sales/              # Sales hub
│   │   ├── settings/           # App settings
│   │   └── audit-log/          # Audit trail
│   └── api/                    # API route handlers
│       ├── auth/               # login, logout
│       ├── uploads/            # File upload to R2
│       ├── vendors/            # CRUD
│       ├── customers/          # CRUD
│       ├── karigars/           # CRUD
│       ├── users/              # CRUD
│       ├── roles/              # CRUD
│       ├── permissions/        # CRUD
│       ├── gold-purchases/     # CRUD + ledger sync
│       ├── diamond-purchases/  # CRUD + ledger sync
│       ├── karigar-issues/     # CRUD + ledger sync
│       ├── karigar-receipts/   # Create + auto-product generation
│       ├── invoices/           # Create + product status update
│       ├── approvals/          # Create + product status update
│       ├── payments/           # Create
│       ├── settings/           # Upsert
│       ├── audit-log/          # Read
│       └── dashboard/          # Aggregated KPI data
│
├── components/
│   ├── auth/                   # LoginForm, LogoutButton
│   ├── dashboard/              # DashboardCharts (Recharts)
│   ├── vendors/                # VendorForm
│   ├── customers/              # CustomerForm
│   ├── karigars/               # KarigarForm
│   ├── users/                  # UserForm
│   ├── roles/                  # RoleForm
│   ├── permissions/            # PermissionForm
│   ├── inventory/              # PurchaseForm (gold + diamond)
│   ├── manufacturing/          # KarigarIssueForm, KarigarReceiptForm
│   ├── site-header.tsx         # Top navigation bar
│   ├── site-footer.tsx         # Footer
│   ├── site-navigation.tsx     # Desktop + mobile nav
│   ├── site-navigation-data.ts # Nav link config
│   └── ui/                     # 60+ shadcn/custom primitives
│
├── lib/
│   ├── auth.ts                 # getSession(), hasPermission(), createSessionRecord()
│   ├── mongodb.ts              # MongoDB connection singleton + getDb()
│   ├── utils.ts                # cn() class merge utility
│   ├── r2.ts                   # Cloudflare R2 client + uploadToR2(), deleteFromR2()
│   ├── uploads.ts              # UploadKind type, makeObjectKey(), VALID_KINDS
│   ├── admin-vendors.ts        # Vendor CRUD + business logic
│   ├── admin-customers.ts      # Customer CRUD
│   ├── admin-karigars.ts       # Karigar CRUD
│   ├── admin-users.ts          # User CRUD (with bcrypt)
│   ├── admin-roles.ts          # Role CRUD
│   ├── admin-permissions.ts    # Permission CRUD
│   ├── admin-inventory.ts      # Gold + diamond purchases + ledger
│   ├── admin-manufacturing.ts  # Issues, receipts, products, history
│   ├── admin-sales.ts          # Approvals, invoices, payments, audit
│   ├── admin-dashboard.ts      # Aggregated dashboard data
│   └── admin-vendor-options.ts # Vendor dropdown helper
│
├── models/                     # Mongoose schemas (reference/documentation only)
├── scripts/
│   ├── seed-access-control.mjs # Seeds 57 permissions + 5 roles
│   └── seed-admin-user.mjs     # Creates Super Admin user
│
├── hooks/                      # Client-side React hooks
├── public/                     # Static assets
├── next.config.ts              # Next.js config (R2 remote image patterns)
├── tailwind.config.ts          # Tailwind configuration
├── components.json             # shadcn/ui config
├── .env.local.example          # Environment variable template
└── DOCUMENTATION.md            # This file
```

---

## 6. Authentication & Sessions

### Overview

Authentication uses a **dual-token pattern**: a signed JWT cookie combined with a live session record in MongoDB. This provides JWT convenience with server-side revocability.

### Login Flow

1. User submits email + password to `POST /api/auth/login`
2. Server looks up user by email (case-insensitive), verifies `status === "ACTIVE"`
3. `bcrypt.compare()` validates the password against the stored hash
4. Role and all active permissions for that role are loaded from MongoDB
5. A random 32-byte `sessionId` is generated; its SHA-256 hash is stored in the `sessions` collection with a 30-day expiry
6. A JWT is signed containing: `userId`, `email`, `firstName`, `lastName`, `role { id, name }`, `permissions[]`, and `sessionId`
7. The JWT is set as an httpOnly cookie named `goldsmith_session` (30-day `maxAge`, `sameSite: lax`)
8. `users.lastLogin` is updated

### Session Verification (`getSession()`)

Called at the top of every protected Server Component and API route:

```
1. Read goldsmith_session cookie
2. jwt.verify() → validates signature and expiry
3. Extract sessionId from JWT payload
4. Hash sessionId with SHA-256
5. Query sessions: { sessionHash, expiresAt: { $gt: now } }
6. If no matching live session → return null
7. Return full AuthSession object
```

### Logout

`POST /api/auth/logout` clears the cookie by setting `maxAge=0`. The session document in MongoDB is left to expire naturally.

### Permission Checking

```typescript
hasPermission(session, "VENDOR_CREATE") // returns boolean
```

Permissions are loaded once at login and embedded in the JWT. They are **not** re-fetched on each request. Role permission changes take effect on the user's next login.

### Protecting Pages

Every protected page follows this pattern:

```typescript
const session = await getSession();
if (!session || !hasPermission(session, "VENDOR_VIEW")) redirect("/dashboard");
```

No middleware is used — guards are co-located with each page and route handler.

---

## 7. Permissions & Roles

### Default Roles

Five system roles are seeded by `npm run seed:access-control`. System roles cannot be deleted.

| Role | Description |
|---|---|
| **Super Admin** | All 57 permissions |
| **Owner** | All permissions except delete on core entities |
| **Manager** | View-only access to all modules |
| **Inventory Executive** | Purchases, issues, receipts, products, approvals (no delete) |
| **Sales Executive** | Customers (view), approvals, invoices, payments (view + create) |

### All Permission Codes

| Module | Codes |
|---|---|
| Dashboard | `DASHBOARD_VIEW` |
| Users | `USER_VIEW` `USER_CREATE` `USER_EDIT` `USER_DELETE` |
| Roles | `ROLE_VIEW` `ROLE_CREATE` `ROLE_EDIT` `ROLE_DELETE` |
| Permissions | `PERMISSION_VIEW` `PERMISSION_CREATE` `PERMISSION_EDIT` `PERMISSION_DELETE` |
| Vendors | `VENDOR_VIEW` `VENDOR_CREATE` `VENDOR_EDIT` `VENDOR_DELETE` |
| Customers | `CUSTOMER_VIEW` `CUSTOMER_CREATE` `CUSTOMER_EDIT` `CUSTOMER_DELETE` |
| Karigars | `KARIGAR_VIEW` `KARIGAR_CREATE` `KARIGAR_EDIT` `KARIGAR_DELETE` |
| Purchases | `PURCHASE_VIEW` `PURCHASE_CREATE` `PURCHASE_EDIT` `PURCHASE_DELETE` |
| Issues | `ISSUE_VIEW` `ISSUE_CREATE` `ISSUE_EDIT` `ISSUE_DELETE` |
| Receipts | `RECEIPT_VIEW` `RECEIPT_CREATE` `RECEIPT_EDIT` `RECEIPT_DELETE` |
| Products | `PRODUCT_VIEW` `PRODUCT_EDIT` `PRODUCT_DELETE` |
| Product History | `HISTORY_VIEW` |
| Approvals | `APPROVAL_VIEW` `APPROVAL_CREATE` `APPROVAL_EDIT` `APPROVAL_DELETE` |
| Invoices | `INVOICE_VIEW` `INVOICE_CREATE` `INVOICE_EDIT` `INVOICE_DELETE` |
| Payments | `PAYMENT_VIEW` `PAYMENT_CREATE` `PAYMENT_EDIT` `PAYMENT_DELETE` |
| Settings | `SETTINGS_VIEW` `SETTINGS_EDIT` |
| Audit Log | `AUDIT_VIEW` |

### Adding a New Permission

1. Go to **Dashboard → Permissions → Create permission**
2. Fill in module, action, code (auto-uppercased), description
3. Go to **Dashboard → Roles** and edit the relevant role(s) to include the new permission

---

## 8. Database & Collections

### Connection Pattern

`lib/mongodb.ts` exposes a `getDb()` function that returns a `Db` instance. It uses a module-level singleton (`clientPromise`) that is persisted across hot reloads in development via `global._mongoClientPromise`.

```typescript
import { getDb } from "@/lib/mongodb";
const db = await getDb();
const result = await db.collection("vendors").find({}).toArray();
```

> All active data access uses the **native MongoDB driver**, not Mongoose. Mongoose model files in `models/` define schemas for IDE tooling and documentation only.

### Collection Reference

| Collection | Purpose | Code Prefix |
|---|---|---|
| `users` | User accounts, hashed passwords, role ref, lastLogin | — |
| `sessions` | Live session tokens (sessionHash + expiresAt) | — |
| `roles` | Role definitions with embedded permissionId array | — |
| `permissions` | Permission code definitions | — |
| `vendors` | Supplier master data | `V0001` |
| `customers` | Customer master data | `C0001` |
| `karigars` | Craftsman/artisan master data | `K0001` |
| `goldPurchases` | Gold procurement invoices | `GP0001` |
| `diamondPurchases` | Diamond procurement invoices | `DP0001` |
| `goldInventoryLedger` | Running gold stock ledger entries | — |
| `diamondInventoryLedger` | Running diamond stock ledger entries | — |
| `karigarIssues` | Raw material issued to karigars | `KI0001` |
| `karigarReceipts` | Finished goods received from karigars | `KR0001` |
| `products` | Finished jewellery product master | `JC0001` |
| `productHistory` | Immutable product event log | — |
| `approvals` | Jewellery issued on approval to customers | `APP-00001` |
| `invoices` | Sales invoices | `INV-00001` |
| `payments` | Payment records against invoices | `PAY-00001` |
| `settings` | Key/value app configuration | — |
| `auditLogs` | Immutable audit trail | — |

### Auto-Code Generation

All entity codes are generated by finding the highest existing code:

```typescript
const last = await db.collection("vendors")
  .find({}).sort({ vendorCode: -1 }).limit(1).toArray();
const nextNum = last.length ? parseInt(last[0].vendorCode.slice(1)) + 1 : 1;
const vendorCode = `V${String(nextNum).padStart(4, "0")}`;
```

> **Note:** This pattern is not atomic and could produce duplicate codes under very high concurrent write load. For production scale, replace with a MongoDB sequence counter using `findOneAndUpdate` with `$inc`.

---

## 9. File Upload System (Cloudflare R2)

### Architecture

All file uploads go through a single API route (`/api/uploads`) which stores files on Cloudflare R2. URLs are public and stored as plain strings in MongoDB.

```
Client FileUpload component
  → POST /api/uploads (FormData: file + kind)
  → API validates session, kind, MIME, size
  → lib/r2.ts: upload to R2 bucket
  → Returns { url, key, name, size, mime }
  → Component emits <input type="hidden" value={url} />
  → Parent form picks up URL on submit
```

### Upload Route (`app/api/uploads/route.ts`)

- **Auth:** requires active session (returns 401 if none)
- **Fields:** `file` (Blob), `kind` (string)
- **MIME allow-list:** `image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/gif`, `image/svg+xml`, `application/pdf`
- **Size limit:** 10 MB
- **Key format:** `<kind>/<YYYY>/<MM>/<ulid>.<ext>`
  - Example: `vendors/2026/07/01JZXYZ123.jpg`
- **Returns:** `{ ok: true, file: { url, key, name, size, mime } }`
- **Runtime:** `export const runtime = "nodejs"` (required for Buffer)

### R2 Client (`lib/r2.ts`)

```typescript
uploadToR2(buffer: Buffer, key: string, mime: string): Promise<void>
deleteFromR2(key: string): Promise<void>
buildPublicUrl(key: string): string   // CLOUDFLARE_R2_PUBLIC_URL + "/" + key
```

Environment variables read at module load time — the app will throw a clear error on startup if any are missing.

### FileUpload Component (`components/ui/file-upload.tsx`)

```tsx
<FileUpload
  kind="vendors"           // UploadKind
  variant="image"          // "image" | "document"
  name="logoUrl"           // hidden input name (picked up by parent form)
  label="Company logo"     // visible label
  initialUrl={vendor.logoUrl}  // pre-fill on edit
/>
```

**Behaviour:**
- Drag-and-drop or click-to-browse
- Client-side MIME + size validation before upload
- Shows upload progress via spinner
- On success: shows file preview (image thumbnail or filename)
- Emits `<input type="hidden" name={name} value={url} />` inside the form
- Parent form's `new FormData(event.currentTarget)` automatically picks up the URL — no custom submit logic needed

**Security:** The `src` attribute on the image preview is passed through `safeSrc()` which only allows `https:` and `http:` URLs, preventing DOM XSS from malicious `javascript:` or `data:` URLs.

### Upload Kinds by Module

| Module | Fields | Kind |
|---|---|---|
| Vendors | Logo, GST document, PAN document | `vendors` |
| Customers | Customer photo, ID proof | `customers` |
| Karigars | Photo, Aadhaar document, PAN document | `karigars` |
| Users | Profile image | `users` |
| Gold Purchases | Invoice scan | `gold-purchases` |
| Diamond Purchases | Invoice scan | `diamond-purchases` |
| Karigar Issues | Challan / work order | `karigar-issues` |
| Karigar Receipts | Signed receipt, product photo | `karigar-receipts` |
| Payments | Payment proof (cheque/UPI screenshot) | `payments` |

---

## 10. Modules Reference

### Vendors

**Collection:** `vendors` | **Codes:** `V0001`, `V0002`, …

Vendors supply gold or diamonds. `vendorType` is one of `GOLD`, `DIAMOND`, or `BOTH` — this determines which vendor dropdown they appear in on purchase forms.

**Key fields:** `vendorCode`, `companyName`, `ownerName`, `mobile`, `gstNo`, `panNo`, `vendorType`, `creditDays`, `openingBalance`, `status`, `logoUrl`, `gstDocUrl`, `panDocUrl`

---

### Customers

**Collection:** `customers` | **Codes:** `C0001`, `C0002`, …

**Key fields:** `customerCode`, `firstName`, `lastName`, `gender`, `dob`, `anniversary`, `mobile`, `email`, `gstNo`, `panNo`, `address`, `status`, `photoUrl`, `idProofUrl`

---

### Karigars

**Collection:** `karigars` | **Codes:** `K0001`, `K0002`, …

Karigars are craftsmen who receive raw gold/diamond from the business and return finished jewellery. The list page shows `pendingIssue` (count of open issues) and `pendingReceipt` (count of pending receipts) as a quick operational indicator.

**Key fields:** `karigarCode`, `name`, `fatherName`, `mobile`, `aadhaarNo`, `panNo`, `gstNo`, `address`, `specialization`, `labourType` (`PER_GRAM` / `PER_PIECE` / `FIXED`), `labourRate`, `joiningDate`, `status`, `photoUrl`, `aadhaarDocUrl`, `panDocUrl`

---

### Users, Roles & Permissions

**Collections:** `users`, `roles`, `permissions`

Users are linked to a single role. The role holds an array of permission ObjectIds. At login, permissions are resolved to their code strings and embedded in the JWT.

Passwords are hashed with bcrypt at salt rounds 12. On edit, the password field is only re-hashed if a new non-empty value is submitted.

---

### Gold Purchases

**Collection:** `goldPurchases` | **Codes:** `GP0001`, `GP0002`, …

Each purchase contains an array of line items. Each item records: `purity`, `grossWeight`, `pureWeight`, `ratePerGram`, `amount`. The purchase also captures `gstAmount`, `otherCharges`, `total`, `vendorId`, `invoiceNo`, `invoiceDate`, `purchaseDate`, `status` (`PENDING` / `RECEIVED`).

When a purchase is created or updated, `lib/admin-inventory.ts` syncs a corresponding entry in `goldInventoryLedger` with `transactionType: "PURCHASE"`, `quantityIn`, and `balanceAfterTransaction`.

---

### Diamond Purchases

**Collection:** `diamondPurchases` | **Codes:** `DP0001`, `DP0002`, …

Diamond items record: `sieveSize`, `shape`, `color`, `clarity`, `pcs`, `carat`, `ratePerCarat`, `amount`. Syncs `diamondInventoryLedger`.

---

### Karigar Issues

**Collection:** `karigarIssues` | **Codes:** `KI0001`, `KI0002`, …

Issues represent raw material dispatched to a karigar. They carry a `goldItems[]` array and `diamondItems[]` array. When `status === "ISSUED"`, the API writes outflow entries to both ledgers. The karigar's `pendingIssue` count is incremented.

**Key fields:** `issueNo`, `karigarId`, `karigarCode`, `karigarName`, `issueDate`, `goldItems`, `diamondItems`, `status` (`PENDING` / `ISSUED` / `COMPLETED`), `challanUrl`

---

### Karigar Receipts & Product Auto-Creation

**Collection:** `karigarReceipts` | **Codes:** `KR0001`, `KR0002`, …

When a receipt is created with `status === "COMPLETED"`:
1. Each jewellery item in the receipt's `jewellery[]` array auto-creates a product document in the `products` collection
2. The linked karigar issue's `status` is set to `COMPLETED`
3. Product history events (`PRODUCT_CREATED`) are logged for each new product

**Key fields:** `receiptNo`, `karigarId`, `issueId`, `issueNo`, `jewellery[]`, `labourCharge`, `status` (`PENDING` / `COMPLETED`), `signedReceiptUrl`, `productImageUrl`

Each jewellery item: `category`, `subCategory`, `productName`, `weight`, `netWeight`, `purity`, `wastage`, `makingCharge`, `diamondPcs`, `diamondCarat`, `diamondValue`

---

### Products

**Collection:** `products` | **Codes:** `JC0001`, `JC0002`, …

Products are created automatically from completed karigar receipts. They are not created manually.

**Statuses:** `IN_STOCK` → `APPROVAL` (when issued on approval) → `SOLD` (when invoiced)

**Key fields:** `jewelCode`, `productName`, `category`, `subCategory`, `purity`, `grossWeight`, `netWeight`, `status`, `location` (`OFFICE` / `CUSTOMER`), `image`

---

### Approvals

**Collection:** `approvals` | **Codes:** `APP-00001`, `APP-00002`, …

Jewellery issued to a customer for approval (trial). Products move to `APPROVAL` status with `location: CUSTOMER`. A product history event is logged.

**Key fields:** `approvalNo`, `customerId`, `customerName`, `products[]`, `issueDate`, `dueDate`, `status` (`PENDING` / `APPROVED` / `RETURNED`)

---

### Invoices

**Collection:** `invoices` | **Codes:** `INV-00001`, `INV-00002`, …

When an invoice is created, referenced products move to `SOLD` status. A `INVOICE_CREATED` history event is logged. An audit log entry is written.

**Key fields:** `invoiceNo`, `customerId`, `customerName`, `saleType` (`DIRECT` / `AGAINST_APPROVAL`), `products[]`, `goldRate`, `makingCharge`, `gstAmount`, `discount`, `grandTotal`, `paymentStatus`, `saleDate`

---

### Payments

**Collection:** `payments` | **Codes:** `PAY-00001`, `PAY-00002`, …

**Key fields:** `paymentNo`, `invoiceId`, `invoiceNo`, `customerId`, `customerName`, `amount`, `paymentType` (`CASH` / `CHEQUE` / `ONLINE` / `CARD`), `paymentDate`, `reference`, `status`, `attachmentUrl`

---

## 11. API Routes Reference

All write routes accept `application/x-www-form-urlencoded` or `multipart/form-data` (via `request.formData()`), except `/api/settings` which accepts JSON. All routes return JSON.

### Authentication Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Email + password login. Sets `goldsmith_session` cookie. |
| POST | `/api/auth/logout` | None | Clears cookie, redirects to `/login`. |

### Upload Route

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/uploads` | Session | Upload file to R2. Fields: `file` (Blob), `kind` (string). Returns `{ok, file}`. |

### CRUD Routes

| Method | Path | Permission | Description |
|---|---|---|---|
| POST | `/api/vendors` | `VENDOR_CREATE` | Create vendor |
| PATCH | `/api/vendors/[id]` | `VENDOR_EDIT` | Update vendor |
| DELETE | `/api/vendors/[id]` | `VENDOR_DELETE` | Delete vendor |
| POST | `/api/customers` | `CUSTOMER_CREATE` | Create customer |
| PATCH | `/api/customers/[id]` | `CUSTOMER_EDIT` | Update customer |
| DELETE | `/api/customers/[id]` | `CUSTOMER_DELETE` | Delete customer |
| POST | `/api/karigars` | `KARIGAR_CREATE` | Create karigar |
| PATCH | `/api/karigars/[id]` | `KARIGAR_EDIT` | Update karigar |
| DELETE | `/api/karigars/[id]` | `KARIGAR_DELETE` | Delete karigar |
| POST | `/api/users` | `USER_CREATE` | Create user (bcrypt hashes password) |
| PATCH | `/api/users/[id]` | `USER_EDIT` | Update user |
| POST | `/api/roles` | `ROLE_CREATE` | Create role |
| PATCH | `/api/roles/[id]` | `ROLE_EDIT` | Update role |
| DELETE | `/api/roles/[id]` | `ROLE_DELETE` | Delete role (blocked if users assigned) |
| POST | `/api/permissions` | `PERMISSION_CREATE` | Create permission |
| PATCH | `/api/permissions/[id]` | `PERMISSION_EDIT` | Update permission |
| DELETE | `/api/permissions/[id]` | `PERMISSION_DELETE` | Delete permission (blocked if role uses it) |
| POST | `/api/gold-purchases` | `PURCHASE_CREATE` | Create gold purchase + ledger entry |
| PATCH | `/api/gold-purchases/[id]` | `PURCHASE_EDIT` | Update + re-sync ledger |
| DELETE | `/api/gold-purchases/[id]` | `PURCHASE_DELETE` | Delete + remove ledger entry |
| POST | `/api/diamond-purchases` | `PURCHASE_CREATE` | Create diamond purchase + ledger entry |
| PATCH | `/api/diamond-purchases/[id]` | `PURCHASE_EDIT` | Update + re-sync ledger |
| DELETE | `/api/diamond-purchases/[id]` | `PURCHASE_DELETE` | Delete + remove ledger entry |
| POST | `/api/karigar-issues` | `ISSUE_CREATE` | Create issue + write ledger outflows |
| PATCH | `/api/karigar-issues/[id]` | `ISSUE_EDIT` | Update + re-sync ledger |
| DELETE | `/api/karigar-issues/[id]` | `ISSUE_DELETE` | Delete + remove ledger entries |
| POST | `/api/karigar-receipts` | `RECEIPT_CREATE` | Create receipt; if COMPLETED auto-creates products |
| POST | `/api/invoices` | `INVOICE_CREATE` | Create invoice + mark products SOLD |
| POST | `/api/approvals` | `APPROVAL_CREATE` | Create approval + mark products APPROVAL |
| POST | `/api/payments` | `PAYMENT_CREATE` | Record payment against invoice |
| PATCH | `/api/settings` | `SETTINGS_EDIT` | Upsert a settings key/value |
| GET | `/api/audit-log` | `AUDIT_VIEW` | Last 200 audit log entries |
| GET | `/api/dashboard` | Session | Aggregated dashboard KPIs |
| GET | `/api/health/db` | None | MongoDB ping health check |

### Error Response Format

All routes return a consistent JSON error shape:

```json
{ "message": "Human-readable error description" }
```

HTTP status codes used: `400` (bad input), `401` (no session), `403` (no permission), `404` (not found), `409` (conflict / delete blocked), `500` (internal error).

---

## 12. Frontend Components

### Form Pattern

All entity forms follow this pattern:

```typescript
"use client";
// 1. Props include initialValues for edit mode
// 2. handleSubmit posts to the correct API route via FormData
// 3. On success: router.push() to the list page
// 4. On error: setError() renders an inline error message
// 5. FileUpload components emit hidden inputs automatically
```

### FileUpload in Forms

```tsx
// At the bottom of any form, before action buttons:
<FileUpload
  kind="vendors"
  variant="image"        // "image" shows a thumbnail preview
  name="logoUrl"         // must match the field name the API route reads
  label="Company logo"
  initialUrl={initialValues?.logoUrl}  // pre-fills on edit
/>
```

The hidden input emitted by `FileUpload` is automatically included in `new FormData(event.currentTarget)` — no extra wiring needed in the submit handler.

### EntityAvatar

```tsx
<EntityAvatar
  src={vendor.logoUrl || null}    // URL or null for fallback
  name={vendor.companyName}       // used to derive initials
  size={32}                       // optional, pixels
/>
```

Shows an `<img>` if `src` is truthy, otherwise renders a square with the first two initials of `name`.

### Dashboard Charts (`components/dashboard/dashboard-charts.tsx`)

Client component using Recharts. Receives three data props:

| Prop | Chart Type | Description |
|---|---|---|
| `salesVsPurchase` | LineChart | 7-day comparison of sales total vs purchase total |
| `inventoryMix` | BarChart | Current stock breakdown: gold (grams), diamonds (carats), products (count) |
| `approvalsByStatus` | PieChart | Distribution of approvals by status |

---

## 13. Dashboard & Analytics

The main dashboard (`app/dashboard/page.tsx`) displays:

### KPI Cards (12 total)

| KPI | Source |
|---|---|
| Active Vendors | `vendors` count where status ACTIVE |
| Active Customers | `customers` count |
| Active Karigars | `karigars` count |
| Gold Stock (grams) | Sum of `goldInventoryLedger` quantityIn minus quantityOut |
| Diamond Stock (carats) | Sum of `diamondInventoryLedger` |
| Products In Stock | `products` count where status IN_STOCK |
| Pending Issues | `karigarIssues` count where status ISSUED |
| Pending Receipts | `karigarReceipts` count where status PENDING |
| Pending Approvals | `approvals` count where status PENDING |
| Unpaid Invoices | `invoices` count where paymentStatus not PAID |
| Monthly Revenue | Sum of current-month invoice grandTotal |
| Today's Gold Rate | From `settings` collection key `gold_rate` |

### Alerts

Auto-generated alerts highlight:
- Overdue approvals (past due date)
- Critical stock levels

### Top Performers

Lists karigars ranked by completed receipts in the current period.

### Activity Timeline

Last 10 combined events across issues, receipts, invoices, and approvals.

---

## 14. Inventory Ledger System

### Gold Inventory Ledger (`goldInventoryLedger`)

Each ledger entry records a stock movement:

```typescript
{
  referenceId: ObjectId,       // purchaseId or issueId
  referenceType: "PURCHASE" | "KARIGAR_ISSUE",
  referenceNo: string,         // GP0001 or KI0001
  transactionDate: Date,
  quantityIn: number,          // grams in (for purchases)
  quantityOut: number,         // grams out (for issues)
  balanceAfterTransaction: number,
  createdAt: Date
}
```

### Ledger Sync Pattern

When a purchase or issue is created, updated, or deleted, the API route:
1. Deletes all existing ledger entries for that reference
2. Inserts a fresh entry based on the current record state

> **Caveat:** `balanceAfterTransaction` is calculated by looking at the previous ledger entry at write time. If records are edited retroactively, balances on subsequent entries will be stale until a full ledger recalculation is run.

### Diamond Inventory Ledger (`diamondInventoryLedger`)

Same structure as gold; quantities are in carats.

---

## 15. Manufacturing Flow

```
KARIGAR ISSUE                    KARIGAR RECEIPT
─────────────                    ───────────────
Create issue                     Create receipt (COMPLETED)
  → status: PENDING                → Auto-creates products
  → Set to ISSUED                  → Sets issue to COMPLETED
  → Ledger outflow entries         → Logs PRODUCT_CREATED history
  → karigar.pendingIssue++         → karigar.pendingReceipt--
```

### Karigar Issue Status Flow

```
PENDING → ISSUED → COMPLETED
```

`ISSUED` triggers ledger outflows. `COMPLETED` is set when the corresponding receipt is completed.

### Product Creation

Each jewellery item in a completed receipt becomes one product document:
- `status: "IN_STOCK"`, `location: "OFFICE"`
- `image` set to `productImageUrl` from the receipt (one photo shared across all items in that receipt)
- A `PRODUCT_CREATED` event is logged in `productHistory`

---

## 16. Sales Flow

```
IN_STOCK product
    ↓
APPROVAL (optional)
  → product status: APPROVAL
  → location: CUSTOMER
  → productHistory: APPROVAL_ISSUE
    ↓
INVOICE
  → product status: SOLD
  → productHistory: INVOICE_CREATED
  → auditLogs entry
    ↓
PAYMENT
  → paymentNo generated
  → attachmentUrl for proof
  → auditLogs entry
```

### Invoice Types

| saleType | Description |
|---|---|
| `DIRECT` | Sale without a prior approval |
| `AGAINST_APPROVAL` | Converts an existing approval to a sale |

---

## 17. Audit Logging

`lib/admin-sales.ts` exports `logAudit(db, entry)`. It is called from:
- Invoice creation
- Approval creation
- Payment creation
- Settings updates

Each audit log entry:

```typescript
{
  userId: ObjectId,
  userEmail: string,
  module: string,      // e.g. "Invoice"
  action: string,      // e.g. "CREATE"
  description: string, // human-readable summary
  referenceId: ObjectId,
  referenceNo: string,
  createdAt: Date
}
```

The audit log is read-only from the UI (`GET /api/audit-log` returns the last 200 entries). There is no endpoint to delete or modify audit log entries.

---

## 18. Deployment Guide

### Vercel (Recommended)

1. Push the repository to GitHub
2. Import the project in Vercel
3. Add all environment variables from Section 4 in the Vercel dashboard
4. Deploy — Next.js App Router is fully supported

### Docker / Self-Hosted

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Set all environment variables via the container runtime (`-e` flags or a `.env` file mounted at `/app/.env.local`).

### Cloudflare R2 Setup

1. Log in to the Cloudflare dashboard → R2
2. Create a bucket (e.g., `chips-doc`)
3. Enable **Public Access** on the bucket
4. Create an **API Token** with R2 read+write permission
5. Copy the Account ID, Access Key ID, and Secret Access Key into `.env.local`
6. Set `CLOUDFLARE_R2_PUBLIC_URL` to the public bucket URL shown in the R2 dashboard (format: `https://pub-<hash>.r2.dev`)

### MongoDB Atlas Setup

1. Create a free M0 cluster (or paid tier for production)
2. Add a database user with read/write access
3. Whitelist your server's IP (or use `0.0.0.0/0` for Vercel)
4. Copy the connection string into `MONGODB_URI`
5. Run seed scripts after first deployment:
   ```bash
   MONGODB_URI="..." MONGODB_DB_NAME="gold-smith" npm run seed:access-control
   MONGODB_URI="..." SEED_ADMIN_EMAIL="admin@example.com" SEED_ADMIN_PASSWORD="..." npm run seed:admin-user
   ```

### Health Check

`GET /api/health/db` — returns `{ ok: true, dbName, ping: 1 }` if the MongoDB connection is alive. Use this as your load-balancer health check endpoint.

---

## 19. Known Limitations & TODOs

| Area | Issue / Gap | Suggested Fix |
|---|---|---|
| Auto-code generation | Not atomic — concurrent writes could produce duplicate codes | Replace with `findOneAndUpdate` + `$inc` on a sequences collection |
| Ledger balance accuracy | `balanceAfterTransaction` goes stale when past records are edited | Add a scheduled ledger recalculation job, or compute balance on read |
| Permission freshness | Role permission changes don't affect logged-in users until re-login | Add a short JWT expiry (e.g., 1 hour) with silent refresh, or check permissions from DB on each request |
| R2 cleanup on delete | `deleteFromR2` is implemented but not called when an entity is deleted | Wire `deleteFromR2(key)` into delete API routes for each entity |
| Session cleanup | Expired sessions accumulate in the `sessions` collection indefinitely | Add a MongoDB TTL index: `db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })` |
| Mongoose models | `models/` directory defines Mongoose schemas that are never imported | Either remove them or migrate all queries to use them for validation |
| Email integration | `resend` is installed and `RESEND_API_KEY` is documented but no email is sent anywhere | Wire into invoice creation, approval notifications, or login alerts |
| Product delete | No UI or API route for deleting products | Add `DELETE /api/products/[id]` with the `PRODUCT_DELETE` permission |
| Karigar receipt edit | No edit page for karigar receipts | Add `PATCH /api/karigar-receipts/[id]` and an edit page |
| File delete via UI | Users cannot remove an uploaded file from an existing record without re-uploading | Add a "Remove" workflow that calls `deleteFromR2` and clears the URL field |
| Diamond purchases list | `app/dashboard/diamond-purchases/page.tsx` exists but was not updated with an invoice file column in the current session | Add `invoiceFileUrl` file column (same pattern as gold-purchases) |
