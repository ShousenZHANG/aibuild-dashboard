# AIBuild Dashboard — Data Visualization Platform

A Next.js dashboard for visualizing product procurement, sales, and inventory over time. It renders three curves per product on a single line chart and supports multi-product comparison. Data is ingested from Excel/CSV into PostgreSQL via Prisma.


## 1) Requirements understanding

- For each product, show three series on one line chart:
  - Inventory per day
  - Procurement Amount (Qty × Price)
  - Sales Amount (Qty × Price)
- Allow selecting multiple products to compare on the same chart.
- Upload spreadsheet data to populate the database.
- Cookie-based auth; each user sees their own data.

## 2) Architecture overview (data flow)

- Frontend: Next.js App Router (React 19), Recharts for charts, framer-motion for animations, Tailwind base styles.
- Backend: Next.js Route Handlers (API), Zod validation, JWT auth stored in httpOnly cookie.
- Database: PostgreSQL managed with Prisma ORM.
- Ingestion: Client parses Excel/CSV; server validates and upserts `Product` and `DailyFact` via `ImportBatch`.

Flow:
1) User uploads spreadsheet → client parses and previews → POST `/api/upload` JSON.
2) Server validates rows and upserts `Product` and `DailyFact`.
3) Dashboard calls `/api/data` (optionally filtered by products) → Recharts renders 3 series per product over consecutive days.


## 3) Data model (Prisma)

- User: id, email, username, password, timestamps.
- Product: id, productCode (unique), name, uploadedBy, timestamps.
- DailyFact: unique per (productIdRef, date); fields include inventory, procurement/sales qty, price, amount.
- ImportBatch: id, filename, userId, createdAt.

Indexes & constraints:
- `DailyFact @@unique([productIdRef, date])` (one row per product/date)
- `Product.productCode` unique


## 4) API reference

Auth (sets/clears `auth_token` cookie):
- POST `/api/auth/register` → { email, username?, password }
- POST `/api/auth/login` → { identifier (email or username), password }
- GET  `/api/auth/me` → returns user + stats
- POST `/api/auth/logout`

Upload:
- POST `/api/upload`
  - Body:
    - filename: string
    - rows: array of objects with ALL of the following REQUIRED fields:
      - productCode: string
      - productName: string
      - openingInventory: number
      - procurementQty: number
      - procurementPrice: number
      - salesQty: number
      - salesPrice: number
  - Amounts: if not present, server computes `procurementAmount = procurementQty × procurementPrice` and `salesAmount = salesQty × salesPrice`, rounded to 2 decimals.

Chart data:
- GET `/api/data?productId=1&productId=2`
  - Query:
    - `productId`: optional; repeatable; filters chart to selected products
  - Response:
    - `products`: [{ id, name }]
    - `data`: array of daily rows: `{ date: YYYY-MM-DD, "<Name>_inventory", "<Name>_procurement", "<Name>_sales" }`
  - Note: There is no `days` parameter and no built-in date-range selector. The API returns recent consecutive days as implemented on the server.


## 5) Frontend features

- Product selector chips to toggle multiple products.
- Line chart (Recharts) with three series per selected product (inventory, procurement, sales).
- Upload page to parse Excel/CSV, preview rows, and submit to server.


## 6) Project structure (selected files)

- `app/dashboard/page.tsx` — Dashboard UI (product selector, chart)
- `app/upload/page.tsx` — Upload UI (parse, preview, upload)
- `app/api/data/route.ts` — Chart data API (auth + shaping)
- `app/api/upload/route.ts` — Ingestion API (validation + upsert)
- `app/api/auth/*` — Auth endpoints
- `lib/jwt.ts`, `lib/prisma.ts` — JWT + Prisma client
- `prisma/schema.prisma` — Database schema


## 7) Getting started (Windows)

Clone the repository first:
```bat
git clone https://github.com/ShousenZHANG/aibuild-dashboard.git
cd aibuild-dashboard
```

Set environment variables in `.env.local`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
JWT_SECRET="change-me-please"
```

Install dependencies:
```bat
npm install
```

Run migrations (and optionally seed):
```bat
npx prisma migrate dev --name init
npm run prisma:seed
```

Start in development:
```bat
npm run dev
```
Open http://localhost:3000

Build and start (production):
```bat
npm run build
npm start
```


## 8) Using the app

- Register or login (`/login`).
- Upload at `/upload`:
  - Accepted: `.xlsx`, `.xls`, `.csv`.
  - Required headers: `productCode, productName, openingInventory, procurementQty, procurementPrice, salesQty, salesPrice`.
  - Preview first rows, then submit to server.
- Dashboard at `/dashboard`:
  - Click product chips to compare multiple products.
  - Chart displays Inventory, Procurement, and Sales series per selected product.


## 9) Assumptions & limitations

- Data is modeled per day; the server shapes consecutive-day series internally. There is no user-facing date-range control in this build.
- Inventory and monetary amounts share the same Y-axis; for widely different magnitudes, consider adding a secondary axis as an enhancement.
- Large spreadsheets may parse slowly in-browser. For very large imports, consider server-side parsing.
- Project targets PostgreSQL; other databases may need adjustments.


## 10) Tech stack

- Next.js 15 (App Router), React 19
- Prisma 6, PostgreSQL
- Recharts, framer-motion, zod, xlsx
- Tailwind CSS base styles


## 11) Middleware (auth guard)

File: `middleware.ts`

Purpose: Protects authenticated routes (`/dashboard`, `/upload`) by verifying the `auth_token` cookie using the JWT secret. If the token is missing/invalid/expired, the user is redirected to `/login`.

---

This README explains what the system does, how it’s structured, how to run it on Windows, and how to use its APIs and UI effectively.
