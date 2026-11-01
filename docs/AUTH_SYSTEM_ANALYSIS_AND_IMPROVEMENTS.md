# Mumbai Pav Co. — Authentication System Audit & Email-First Architecture Roadmap

> **Audit Date:** October 2026  
> **Status:** Architecture Review & Transition Strategy  
> **Target:** Migration from Mock/Phone Auth to Enterprise-Grade Email Authentication  

---

## 1. Executive Summary

This document reviews the current authentication implementation across the **Mumbai Pav Co.** full-stack application (Next.js 14 App Router, Prisma ORM, SQLite/PostgreSQL, Tailwind CSS), assesses its security posture, and outlines a comprehensive plan to build a secure, production-grade **Email-Based Authentication System**.

### Current Security & Capability Scorecard

| Dimension | Current Score | Assessment |
| :--- | :---: | :--- |
| **Authentication Logic** | **2 / 10** | Mock/Prototype level. No passwords, no OTP, no cryptographic verification. |
| **Session Security** | **1 / 10** | Unsigned, client-readable cookies (`httpOnly: false`) allowing trivial privilege escalation. |
| **Staff & Admin Security** | **2 / 10** | Hardcoded plaintext PINs (`9999`, `admin123`, `1122`, `3344`) and 1-click bypass buttons. |
| **Data Integrity & Schema** | **4 / 10** | Phone is required and unique, email is optional. Orders are not linked to `userId`. |
| **User Experience (UX)** | **7 / 10** | Smooth, zero-friction modal with demo profiles, sounds, and loyalty counters. |

---

## 2. In-Depth Codebase Audit: How Auth Currently Works

### A. Customer Flow (`components/CustomerAuthModal.tsx`)
1. **Current Mechanism:**
   - The user inputs `name` and a `10-digit mobile number` (`phone`).
   - The frontend directly hits `/api/auth/register` or `/api/auth/login`.
   - **Critical Vulnerability:** There is **no OTP check and no password**. Anyone who enters any customer's phone number is immediately authenticated as that user and can view their order history, saved addresses, and loyalty points.
   - **Email:** The customer registration modal does not even expose an email input field, even though the database schema supports an optional email column.

### B. Staff & Admin Station Flow (`app/staff/login/page.tsx` & `middleware.ts`)
1. **Current Mechanism:**
   - Staff select a station (`KITCHEN_STAFF`, `CASHIER`, `ADMIN`).
   - The app pre-fills demo email addresses (`kitchen@mumbaipavco.in`, `cashier@mumbaipavco.in`, `admin@mumbaipavco.in`).
   - Authentication relies on hardcoded plaintext PINs checked in `/api/auth/login/route.ts`:
     ```typescript
     // app/api/auth/login/route.ts
     if (user.role === "ADMIN" && pin && pin !== "9999" && pin !== "admin123") {
       return NextResponse.json({ error: "Invalid Admin Security PIN" }, { status: 401 });
     }
     if (user.role === "KITCHEN_STAFF" && pin && pin !== "1122") { ... }
     if (user.role === "CASHIER" && pin && pin !== "3344") { ... }
     ```
   - **Critical Vulnerability:** An attacker who knows or brute-forces the 4-digit PIN gains full store owner control over inventory, pricing, revenue, and KDS queues.

### C. Session & Cookie Handling (`lib/auth.ts`)
1. **Current Mechanism:**
   ```typescript
   // lib/auth.ts
   document.cookie = `mpc_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
   document.cookie = `mpc_user_id=${user.id}; path=/; max-age=604800; SameSite=Lax`;
   localStorage.setItem("mpc_session_user", JSON.stringify(user));
   ```
2. **Critical Vulnerabilities:**
   - **Client-Writable Cookies:** The cookies are **not** `HttpOnly`. Anyone can open browser DevTools console and execute:
     ```javascript
     document.cookie = "mpc_role=ADMIN; path=/;";
     ```
     This bypasses `middleware.ts` guards and allows immediate unauthorized access to `/admin`!
   - **No Cryptographic Signing:** There is no HMAC signature or JWT secret key. The server trusts whatever string is passed in `mpc_role`.
   - **ID Tampering (IDOR):** Changing `mpc_user_id` to another user ID allows reading that user's addresses and orders from `/api/auth/me`.

### D. Database Schema (`prisma/schema.prisma`)
1. **Current Model:**
   ```prisma
   model User {
     id            String      @id @default(cuid())
     name          String
     phone         String      @unique
     email         String?     @unique
     role          String      @default("CUSTOMER")
     loyaltyPoints Int         @default(0)
     createdAt     DateTime    @default(now())
     updatedAt     DateTime    @updatedAt

     addresses     Address[]
     orders        Order[]
     auditLogs     AuditLog[]
   }
   ```
2. **Gaps for Email Auth:**
   - `phone` is required (`String @unique`), meaning an email-only customer cannot register without providing a fake phone number.
   - `email` is optional (`String?`), not verified (`emailVerified` timestamp missing).
   - No `passwordHash` column exists.
   - No `VerificationToken` or `Session` tables exist for Magic Links or OAuth tokens.
   - In `app/api/orders/route.ts`, orders save `customerName`, `customerPhone`, and `customerEmail`, but **omit `userId`**, meaning guest orders are disconnected from customer accounts.

---

## 3. Why Switch to Email-Based Authentication?

| Benefit | Email-First Authentication | Mobile / SMS Authentication |
| :--- | :--- | :--- |
| **Delivery Cost** | **Free / Fractions of a cent** (e.g. Resend / Amazon SES: ₹0.008 / email). | **Expensive** (Indian DLT registration, SMS gateway: ₹0.20 – ₹0.50 per SMS). |
| **Delivery Reliability** | High (99.5%+ inbox delivery with SPF/DKIM). | Subject to carrier SMS drops, DND registry blocks, and telco network delays. |
| **Security Standards** | Modern passwordless Magic Links, WebAuthn/Passkeys, or OAuth 2.0 (Google 1-Click). | Prone to SIM swapping, SMS snooping, and interception. |
| **Customer Reach** | Works across desktop, tablet, and mobile; great for office catering and dine-in laptop ordering. | Forces user to have cellular phone access nearby. |
| **Corporate Billing** | Corporate meal programs and GST invoicing match company email domains. | Mobile numbers do not convey corporate identity. |

---

## 4. Recommended Architecture: Email-First Auth System

```
                  ┌──────────────────────────────────────────────┐
                  │              CUSTOMER / STAFF                │
                  │   (Enters Email or Clicks "Sign in with Google")│
                  └──────────────────────┬───────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
         [ Customers (Passwordless) ]                [ Staff & Admin (Secure) ]
         • Email Magic Link / 6-Digit OTP             • Email + Argon2id Password
         • Zero password friction                     • Mandatory 2FA / Session Expiry
                   │                                           │
                   └─────────────────────┬─────────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          AUTH API LAYER (/api/auth)   │
                     │  • Rate Limiting (Sliding Window)     │
                     │  • Cryptographic Token Verification   │
                     │  • Resend / NodeMailer Email Delivery │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │          SESSION SECURITY             │
                     │  • HttpOnly, Secure, SameSite=Strict  │
                     │  • Signed JWT (jose) or DB Session    │
                     │  • Strict Middleware Role Enforcement │
                     └───────────────────────────────────────┘
```

---

## 5. Step-by-Step Implementation Roadmap

### Step 1: Database Schema Modernization
Update `prisma/schema.prisma` to make `email` the primary unique identifier, make `phone` optional, add password hashing, and introduce verification tokens:

```prisma
model User {
  id            String       @id @default(cuid())
  name          String
  email         String       @unique
  emailVerified DateTime?
  phone         String?      // Optional for delivery/WhatsApp updates
  passwordHash  String?      // Null for passwordless/OAuth users, hashed with Argon2id for staff
  role          UserRole     @default(CUSTOMER)
  loyaltyPoints Int          @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  sessions      Session[]
  addresses     Address[]
  orders        Order[]
  auditLogs     AuditLog[]

  @@index([email])
  @@index([role])
}

enum UserRole {
  CUSTOMER
  KITCHEN_STAFF
  CASHIER
  ADMIN
  RIDER
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
  createdAt    DateTime @default(now())

  @@index([userId])
}

model VerificationToken {
  id         String   @id @default(cuid())
  identifier String   // User email
  token      String   @unique // Hashed 6-digit OTP or secure random token
  expires    DateTime
  attempts   Int      @default(0)
  createdAt  DateTime @default(now())

  @@unique([identifier, token])
}
```

### Step 2: Implement Cryptographically Signed Sessions (JWT / Iron Session)
Never store raw roles or user IDs in plain cookies. Use signed JWTs via `jose` or database sessions:

```typescript
// lib/session.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fallback-dev-secret-32-chars-min");

export async function createSessionCookie(payload: { userId: string; role: string; email: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  cookies().set("mpc_auth_token", token, {
    httpOnly: true,     // Cannot be read or stolen by JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession() {
  const token = cookies().get("mpc_auth_token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; role: string; email: string };
  } catch {
    return null;
  }
}
```

### Step 3: Modern Middleware Role Enforcement
Update `middleware.ts` to verify the cryptographic signature of the cookie before granting access:

```typescript
// middleware.ts
import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("mpc_auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Verify JWT token signature
  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload as { userId: string; role: string };
    } catch {
      // Invalid or tampered token
    }
  }

  // Guard Admin routes
  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "ADMIN") {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("error", "Unauthorized access. Admin privileges required.");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Guard KDS & POS
  if (pathname.startsWith("/kds") && session?.role !== "KITCHEN_STAFF" && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }
  if (pathname.startsWith("/pos") && session?.role !== "CASHIER" && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }

  return NextResponse.next();
}
```

### Step 4: Passwordless Email OTP / Magic Link Service
Integrate an email provider (such as **Resend** or **Nodemailer/SMTP**):

1. **Request Endpoint (`/api/auth/send-otp`):**
   - User inputs email (`customer@example.com`).
   - Rate limit check (max 3 requests per 10 minutes per IP).
   - Generates a cryptographically random 6-digit OTP (e.g. `742918`).
   - Hashes and stores in `VerificationToken` with a 10-minute expiry.
   - Sends a branded transactional email: *"Your Mumbai Pav Co. login code is 742918"*.

2. **Verify Endpoint (`/api/auth/verify-otp`):**
   - Compares the entered code with the hashed token.
   - If valid, fetches or creates the `User` record with 50 loyalty points.
   - Deletes the token to prevent replay attacks.
   - Issues the secure `mpc_auth_token` `HttpOnly` cookie.

### Step 5: Redesign Customer & Staff Login UI
1. **Customer Modal:**
   - Single clean input: **"Enter your Email Address"**.
   - One-click **"Send Login Code"** button.
   - 6-digit PIN input with auto-submit and countdown resend timer.
   - Optional: "Sign in with Google" button for 1-click zero-typing authentication.
2. **Staff Login:**
   - Email + Strong Password input with secure password hashing (`argon2id` / `bcrypt`).
   - Removal of plaintext default PINs (`9999`, `1122`) in production.
   - Role-based station routing upon successful authentication.

### Step 6: Link User ID to Order History
Update `app/api/orders/route.ts` to link orders to logged-in users:
```typescript
const session = await getSession();
const newOrder = await prisma.order.create({
  data: {
    userId: session?.userId || null, // Associates order with logged-in customer!
    customerName: data.customerName,
    customerEmail: session?.email || data.customerEmail,
    // ...
  }
});

// Reward loyalty points to customer
if (session?.userId) {
  await prisma.user.update({
    where: { id: session.userId },
    data: { loyaltyPoints: { increment: 10 } },
  });
}
```

---

## 6. Implementation Summary & Package Recommendations

To implement this architecture cleanly, the following packages should be added when ready:
- `jose` — Fast, lightweight Web Crypto JWT verification for Next.js App Router and Edge Middleware.
- `argon2` or `bcryptjs` — Industry standard for hashing staff passwords.
- `resend` or `nodemailer` — High-deliverability transactional email service for OTPs and order receipts.

---
*Created by Senior Front-End & Security Engineering Architecture Team for Mumbai Pav Co.*

