# Bengaluru Pav Co. — Production Cloud Deployment Guide

This document contains end-to-end technical specifications, environment variable checklists, and step-by-step procedures to deploy **Bengaluru Pav Co.** to free cloud hosting infrastructure.

---

## 1. Architectural Summary

- **Frontend & Full-Stack Application:** Next.js 14 (App Router) + React 18 + Tailwind CSS.
- **Backend API:** 16 Next.js Route Handlers (`app/api/**/route.ts`).
- **Edge Middleware:** `middleware.ts` for role-based route protection (`/admin`, `/kds`, `/pos`) with cryptographic JWT verification (`jose`).
- **ORM & Data Layer:** Prisma ORM 5.22.0.
- **Recommended Free Hosting Combination:**
  - **Application (Frontend + APIs + SSR):** **Vercel** (Hobby Free Tier)
  - **Database (Relational PostgreSQL):** **Neon Serverless PostgreSQL** (Free Tier — 0.5 GB storage, connection pooling, zero sleep delay)

> [!IMPORTANT]
> The local development database uses SQLite (`file:./dev.db`). In serverless environments (like Vercel and Netlify), local file systems are ephemeral and read-only. For cloud deployment, the database must be hosted on an external managed provider like **Neon PostgreSQL** or **Supabase**.

---

## 2. Environment Variables Checklist

Set these in the hosting dashboard (e.g., **Vercel Project Settings > Environment Variables**):

| Variable | Required in Production | Purpose | Example / Format |
|---|:---:|---|---|
| `DATABASE_URL` | **Yes** | Pooled PostgreSQL connection string | `postgresql://user:pass@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | **Yes** | 256-bit secret for signing HTTP-only JWT cookies | Random 64-character hexadecimal or base64 string |
| `NODE_ENV` | **Yes** | Runtime environment flag | `production` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Canonical public URL of your deployed site | `https://your-project.vercel.app` or custom domain |
| `NEXT_PUBLIC_STORE_NAME` | **Yes** | Display name for your store | `Bengaluru Pav Co.` |
| `NEXT_PUBLIC_STORE_CITY` | **Yes** | Operational base city | `Bengaluru` |
| `NEXT_PUBLIC_STORE_PINCODE`| **Yes** | Store physical hub pin code | `560034` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Optional (defaults to test) | Razorpay public key for checkout | `rzp_live_...` (or leave default for test simulation) |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay HMAC secret for signature verification | Secret string from Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Razorpay webhook verification | Secret string from webhook settings |
| `WHATSAPP_API_TOKEN` | Optional | WhatsApp Cloud API token for order notifications | Bearer token |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional | Meta WhatsApp Business phone number ID | Numeric ID string |

> [!WARNING]
> Never commit actual secret keys or `.env` files into your Git repository. Always configure secrets in your hosting dashboard's Environment Variables panel.

---

## 3. Step-by-Step Deployment Roadmap (Vercel + Neon Free Tier)

### Step 1: Provision Free PostgreSQL Database on Neon
1. Go to [https://neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**, name it `mumbai-pav-co`, and choose the nearest AWS region (e.g., **Asia Pacific - Singapore / ap-southeast-1** or **AWS Mumbai / ap-south-1** if available).
3. Copy the **Pooled Connection String** provided on your dashboard:
   ```text
   postgresql://[user]:[password]@[endpoint]-pooler.region.neon.tech/[dbname]?sslmode=require
   ```

### Step 2: Database Schema Push and Seeding
Before the first deployment build, prepare the cloud database with your schema and initial seed data:
1. In your local environment (or CI runner), temporarily set `DATABASE_URL` to the Neon pooled connection string.
2. In `prisma/schema.prisma`, update the datasource provider from `sqlite` to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Push the schema to the cloud database:
   ```bash
   npx prisma db push
   ```
4. Seed the initial operational menu, staff accounts, and store settings:
   ```bash
   node scripts/seed.mjs
   ```

### Step 3: Deploy to Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in using your GitHub account (`Shivam4918`).
2. Click **Add New... > Project** and import the repository:
   - `https://github.com/Shivam4918/Bengaluru-pav-co`
3. In the project configuration:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `./`
   - **Build Command:** `npx prisma generate && next build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
4. Expand **Environment Variables** and add:
   - `DATABASE_URL`: *(Your Neon PostgreSQL pooled connection string)*
   - `AUTH_SECRET`: *(A secure random string, e.g. generated via `openssl rand -hex 32`)*
   - `NEXT_PUBLIC_APP_URL`: *(Your deployment URL, e.g. `https://mumbai-pav-co.vercel.app`)*
   - `NEXT_PUBLIC_STORE_NAME`: `Bengaluru Pav Co.`
   - `NEXT_PUBLIC_STORE_CITY`: `Bengaluru`
   - `NEXT_PUBLIC_STORE_PINCODE`: `560034`
5. Click **Deploy**. Vercel will clone the repository, generate the Prisma query engine, compile the Next.js App Router routes, and assign a production URL with automatic free SSL.

---

## 4. Alternative Platform: Render (Free Web Service)

If deploying as a continuous Node.js server container:

1. Create a free account at [https://render.com](https://render.com).
2. Connect your GitHub repository.
3. Choose **Web Service** (Free Instance type).
4. Configure:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start`
5. Add the environment variables from the checklist above.
6. *Note on Render Free Tier:* Free Web Services spin down after 15 minutes of inactivity and take ~50 seconds to cold start on the next request.

---

## 5. Post-Deployment Verification & Smoke Testing

Once deployed, verify all endpoints using your production domain:

1. **Storefront & Menu:** `GET /` — verify items, prices, and Unsplash imagery load.
2. **Customer Auth:** Test registration and login. Verify the `mpc_token` HttpOnly cookie is set with the `Secure` flag.
3. **Cart & Order Checkout:** Add items, enter notes, and submit test order. Verify order number generation and redirect to `/order/[id]`.
4. **Order Tracking:** `GET /order/[id]` — verify real-time status and modifiers.
5. **Staff Portal:** Sign in at `/staff/login` with seed credentials:
   - Admin: `shivam4918@gmail.com`
   - Kitchen Chef: `kitchen@mumbaipav.co`
   - Cashier: `cashier@mumbaipav.co`
6. **Station Routing:**
   - Admin HQ: `/admin` (Customer Ledger, Orders Ledger, Staff access)
   - KDS: `/kds` (Kanban lanes & status updates)
   - POS: `/pos` (Express billing)

