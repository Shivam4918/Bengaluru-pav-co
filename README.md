# 🌶️ Mumbai Pav Co. — Production Full-Stack Cloud Architecture

> Authentic Artisanal Vada Pav & Street-Food Venture (Koramangala 5th Block, Bengaluru).
> Built with Next.js (App Router, React, TypeScript), Tailwind CSS, Prisma ORM, and Razorpay Payments.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18+ or v20+ / v24+
- **Package Manager:** `npm` or `pnpm`

### 2. Installation & Setup
```bash
# Navigate to the project root
cd C:\Users\shiva\.gemini\antigravity\scratch\mumbai-pav-co

# Install dependencies (already installed)
npm install

# Push database schema & generate Prisma Client
npm run db:push

# Seed the database with catalog, inventory BOM, and active sample tickets
node scripts/seed.mjs

# Start development server
npm run dev
```

Visit the app in your browser at:
- 📱 **Customer Storefront:** `http://localhost:3000`
- 🍳 **Kitchen Display System (KDS):** `http://localhost:3000/kds`
- 🖥️ **Counter Express POS:** `http://localhost:3000/pos`
- 📊 **Admin & Recipe BOM Management:** `http://localhost:3000/admin`
- 🔔 **Live Order Tracking Sample:** `http://localhost:3000/order/MPC-20261021-0101`

---

## 🏗️ System Architecture & Domain Modules

### 1. Customer-Facing Storefront (Mobile-First, PWA-Ready)
- **Dynamic Menu & Modifiers:** Spice level customization (`MILD`, `MEDIUM`, `THECHA_HOT`), extra butter pav, Amul cheese slice, and dry garlic thecha.
- **Ordering Modes:**
  - `Takeaway / Quick Pickup`: Time-slot scheduling & cyclic digital token assignment (`#101` to `#999`).
  - `Dine-In / Table QR`: Table parameter detection via dynamic QR URL (`?table=T-4`).
  - `Direct Delivery`: 6-digit Bengaluru PIN code geofencing engine (Koramangala, Indiranagar, HSR Layout, BTM, Bellandur, JP Nagar, etc.) with real-time delivery fee calculation.
- **Loyalty & Coupon Engine:**
  - `BOMBAIFIRST`: Flat ₹50 OFF on orders > ₹199.
  - `BUY5GET1CHAI`: Buy 5 or more Vada Pavs, unlock Free Masala Cutting Chai (₹25 value).
  - `PAVLOVER`: 15% OFF on orders > ₹250.
- **Live Real-Time Order Tracking:**
  - 4-stage visual progress: `Order Placed` ➔ `Kadai Frying` ➔ `Ready for Counter Pickup` ➔ `Completed`.
  - Web Audio API dual-tone buzzer and celebratory confetti chime when the kitchen marks the order ready.

### 2. Kitchen Display System (KDS)
- **Kanban Columns:** `Incoming New Orders`, `In Preparation / Frying`, `Ready / Packed`.
- **Dynamic Warning Timers:** Color-coded timers flag tickets exceeding 8 minutes in red with audio buzzer alerts.
- **One-Tap Actions:**
  - **Start Frying:** Transitions state to `PREPARING` and executes the automated database Recipe BOM deduction.
  - **Ready & Buzz:** Marks order ready, triggers customer audio chime, and initiates simulated WhatsApp/SMS pickup pings.
  - **Thermal KOT Print:** Generates standard 80mm Kitchen Order Ticket layout with one tap.

### 3. Offline-Friendly Counter POS
- Express touch layout for cashier punch-ins.
- Handles Walk-in Cash (`COUNTER_CASH`) and Counter UPI (`COUNTER_UPI`).
- Instant thermal receipt formatting formatted for 80mm / 58mm thermal receipt printers via `@media print`.

### 4. Admin Command & Recipe BOM Costing
- **Recipe BOM (Bill of Materials) Engine:**
  - Automatically depletes raw inventory (Potatoes, Pav packets, Besan, Amul Butter, Cheese slices, Frying Oil, Chillies).
  - Formula: Deducts 1 Pav, 80g Batata, 20g Besan, and 10g Amul Butter per Classic Vada Pav.
  - Low-stock alert triggers when inventory hits the minimum safety buffer threshold.
- **Operational Controls:**
  - Master toggle: Open / Close Store.
  - Surge Throttle: Dynamically paces order intake during peak frying hours.
- **Financial & Tax Reporting:**
  - Gross Revenue, Average Order Value (AOV), and 5% Composite GST ledger.
  - Peak Frying Hours heatmap breakdown.

---

## 🔒 Security & Data Integrity

1. **Cryptographic Payment Verification:**
   - Server-side HMAC-SHA256 signature verification for Razorpay payments and webhooks (`crypto.timingSafeEqual`).
2. **Idempotency Protection:**
   - Every checkout payload carries an `idempotencyKey` to prevent duplicate billing during mobile reconnects.
3. **Zod Validation Schemas:**
   - Strict validation on all incoming payloads (Order creation, Status transitions, Address and Pincode verification, Stock replenishment).
4. **OWASP Hardened Headers:**
   - Pre-configured CSP, `X-Frame-Options: SAMEORIGIN`, and `X-Content-Type-Options: nosniff` in `next.config.mjs`.

---

## 🗄️ Relational Database Schema (`schema.prisma`)

- `User`: Customer, Kitchen Staff, Admin, and Rider accounts with loyalty point tracking.
- `Address`: Bengaluru addresses with pincode and geofencing coordinates.
- `Category`: Categorization for Signature Pav, Combos, Chai, and Sides.
- `MenuItem`: Catalog items with veg status, preparation time, and base price.
- `Modifier`: Add-ons with group classification (`CHUTNEY`, `CHEESE`, `PAV`, `SPICE`).
- `Order`: Central state machine with monotonic tokens, fulfillment type, and payment status.
- `OrderItem`: Frozen snapshot of ordered items and selected modifiers.
- `InventoryItem`: Batch raw materials with safety buffer thresholds and unit costs.
- `RecipeBOM`: Relational mappings between menu items and raw ingredients.
- `Transaction`: Gateway references, HMAC signatures, and payment audit logs.
- `AuditLog`: Complete compliance and security trail for every status transition and stock write-off.
- `StoreSetting`: Real-time operational switches (store state, surge throttle, token sequences).

### Switching to PostgreSQL / Supabase
The default configuration uses SQLite for instant local execution without external dependencies.
To switch to PostgreSQL / Supabase:
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/mumbaipav?sslmode=require"
   ```
3. Run `npm run db:push && node scripts/seed.mjs`.
