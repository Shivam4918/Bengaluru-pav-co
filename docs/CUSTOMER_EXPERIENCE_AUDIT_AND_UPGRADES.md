# Mumbai Pav Co. — Customer Experience (CX) Audit & Upgrade Blueprint

> **Audit Date:** October 2026  
> **Status:** Customer Journey Audit & Feature Upgrade Plan  
> **Target:** Converting Mumbai Pav Co. into a frictionless, 5-star customer street food ordering experience  

---

## 1. Executive Summary & Health Check

We conducted a complete, end-to-end journey audit of everything a customer encounters on **Mumbai Pav Co.** — from landing on the storefront, browsing & customizing food, registering/logging in, configuring checkout, paying, and tracking the live fry order.

### Overall Customer Experience Score: **7.5 / 10**
- **Strengths:** Super snappy Next.js UI, audio feedback ticks & buzzers, rich item customization (spice levels & modifiers), multi-mode fulfillment (Takeaway, Dine-in QR, Delivery geofence), and live ticket tracking with confetti.
- **Friction Points:** Logged-in customer details do not auto-fill in cart, loyalty points cannot be redeemed yet, no saved address picker, no past order history viewer, and internal restaurant food costing is exposed to public buyers.

---

## 2. Customer Journey Audit: What Is Working vs. What Is Missing

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                CUSTOMER ORDERING FUNNEL                                     │
└──────┬──────────────────────┬───────────────────────┬───────────────────────┬───────────────┘
       ▼                      ▼                       ▼                       ▼
 1. STOREFRONT          2. CUSTOMIZE            3. CART & CHECKOUT      4. LIVE BUZZER
 [✓] Quick Search       [✓] 3 Spice Levels      [!] Re-typing details   [✓] 3s Live Poll
 [✓] Category Tabs      [✓] Add-on Modifiers    [!] Points not usable   [✓] Audio Chime
 [✓] Veg & Prep Badges  [✓] Live Price Tally    [!] No Address Book     [✓] Confetti Blast
 [!] Internal BOM shown [✓] Sound effects       [✓] Coupon Engine       [!] No Past History
```

### Area 1: Storefront Browsing & Search
| Feature | Current State | Status | Customer Impact |
| :--- | :--- | :---: | :--- |
| **Catalog & Categories** | Signature Vada Pav, Street Combos, Beverages, Sides. | ✅ **Working** | Easy navigation between hot food and drinks. |
| **Live Search** | Filters titles & descriptions instantly in real-time. | ✅ **Working** | Customers find items in under 2 seconds. |
| **Prep Time & Spice Badges** | Shows `~5m fry`, `~8m fry`, `Spicy`, `Classic`. | ✅ **Working** | Sets clear kitchen wait-time expectations. |
| **Recipe BOM Inspector** | Exposes raw material costs (`₹14.50`) & gross margin (`~70%`). | ⚠️ **Needs Fix** | **Too much internal data.** Public customers should see allergens, ingredients, and calories instead of business margins. |

---

### Area 2: Item Customization & Add-Ons
| Feature | Current State | Status | Customer Impact |
| :--- | :--- | :---: | :--- |
| **Spice Selector** | Mild/Meetha, Mumbai Classic, Thecha Hot 🔥. | ✅ **Working** | Authentic street food customization. |
| **Add-On Modifiers** | Extra Dry Garlic Thecha (+₹10), Amul Cheese (+₹20), Butter Grilled Pav (+₹15). | ✅ **Working** | Drives higher average order value (AOV). |
| **Live Pricing Tally** | Dynamically recalculates item total as modifiers and quantity change. | ✅ **Working** | Clear price transparency before adding to cart. |

---

### Area 3: Customer Authentication & Profile
| Feature | Current State | Status | Customer Impact |
| :--- | :--- | :---: | :--- |
| **Email Sign In & Register** | Enterprise bcrypt password hashing, HttpOnly JWT cookies. | ✅ **Working** | Secure, modern authentication without mock PINs. |
| **Welcome Bonus** | Automatically rewards **50 Pav Loyalty Points** upon sign-up. | ✅ **Working** | Encourages visitors to create accounts. |
| **Profile Display** | Top navbar displays customer name, role, and current points. | ✅ **Working** | Instant feedback of logged-in status. |
| **Profile Management** | Customers cannot edit name, phone number, or change password. | ⚠️ **Missing** | Minor friction if user wants to update contact info. |

---

### Area 4: Cart Drawer & Checkout (High-Impact Area)
| Feature | Current State | Status | Customer Impact |
| :--- | :--- | :---: | :--- |
| **Fulfillment Switcher** | Takeaway slot booking, Dine-In table selection, Delivery. | ✅ **Working** | Covers all 3 restaurant fulfillment channels. |
| **Bengaluru Pincode Validator** | Geofences delivery to serviceable PIN codes (e.g., `560034`). | ✅ **Working** | Prevents unserviceable cold delivery orders. |
| **Coupon Engine** | Validates active promo codes (e.g., `FIRSTPAV`, `MUMBAI50`). | ✅ **Working** | Boosts conversion rate. |
| **Customer Info Auto-fill** | **Does NOT auto-fill** name, email, or phone from logged-in user. | ❌ **High Friction** | Logged-in customers must re-type their name & phone every order. |
| **Loyalty Points Redemption** | Points accumulate, but **cannot be spent** at checkout. | ❌ **High Friction** | Customers have points they cannot redeem for discounts. |
| **Saved Address Book** | No option to save or choose "Home" vs. "Office" address. | ⚠️ **Medium Friction**| Delivery users must type full address on each checkout. |

---

### Area 5: Order Tracking & Live Buzzer
| Feature | Current State | Status | Customer Impact |
| :--- | :--- | :---: | :--- |
| **Live Kitchen Sync** | Polls `/api/orders/[id]` every 3 seconds for status updates. | ✅ **Working** | Real-time stage progression: Confirmed $\rightarrow$ Frying $\rightarrow$ Ready. |
| **Digital Audio Buzzer** | Web Audio API chime plays when status turns `READY_FOR_PICKUP`. | ✅ **Working** | Digital buzzer replaces physical restaurant token buzzers. |
| **Confetti Celebration** | Triggers colorful canvas confetti upon food readiness. | ✅ **Working** | Delightful, memorable customer moment. |
| **Past Orders History** | No customer screen to view past orders or 1-tap reorder. | ⚠️ **Missing** | Regulars cannot reorder their daily evening snack easily. |

---

## 3. Top 5 Recommended Customer Upgrades

Here is the prioritized upgrade plan to bring the customer experience to a 10/10:

### 🚀 Upgrade 1: Auto-Fill & Sync in Checkout (Quick Win)
- **What it does:** When a logged-in customer opens the cart drawer, their `name`, `phone`, and `email` are automatically filled into the checkout form.
- **Customer benefit:** Zero repetitive typing; enables instant 1-click checkout.

### 🎁 Upgrade 2: Loyalty Points Redemption at Checkout
- **What it does:** Add an interactive slider or checkbox in the cart summary:
  ```
  [x] Redeem 50 Pav Points (Save ₹25.00)
      Available Balance: 70 Points
  ```
- **Rules:**
  - 10 Points = ₹5.00 discount (or 50 points = 1 free cutting chai).
  - Minimum 50 points required to redeem.
  - Instantly deducts from subtotal and updates balance upon order confirmation.

### 📍 Upgrade 3: One-Tap Saved Address Book
- **What it does:** For delivery orders, logged-in customers can select from saved addresses (e.g. `🏠 Home - Koramangala 4th Block` or `🏢 Work - HSR Tech Park`) or add a new one.
- **Customer benefit:** Accelerates checkout on mobile devices.

### 📜 Upgrade 4: "My Orders & 1-Click Reorder" Modal
- **What it does:** Add a **"My Orders"** button in the customer navbar profile dropdown.
- **Features:**
  - Lists past orders with dates, items, and total amount.
  - A prominent **"🔁 Reorder"** button that immediately loads the exact same items, spice levels, and modifiers into the cart.

### 🌿 Upgrade 5: Customer-Friendly Ingredient & Allergen Cards
- **What it does:** Replace the internal "Recipe BOM & Raw Costing" button with an appetizing **"Nutrition, Allergens & Ingredients"** pill:
  - Highlights: *100% Chana Dal Besan (Gluten-Free Batter)*, *Pure Filtered Groundnut Oil (Zero Trans-Fat)*, *No Artificial Food Coloring*.
  - Moves raw procurement costing & margin tables strictly into the `/admin` inventory tab where store owners belong.

---

## 4. Next Steps & Implementation Priority

| Priority | Feature | Effort | Impact |
| :---: | :--- | :---: | :---: |
| **P0** | **Auto-fill customer info in checkout** | ~15 mins | 🔥 Very High |
| **P0** | **Loyalty Points Redemption in Cart** | ~30 mins | 🔥 Very High |
| **P1** | **Customer "My Orders" & 1-Click Reorder** | ~45 mins | ⚡ High |
| **P1** | **Replace internal BOM on cards with Nutrition/Allergen guide** | ~20 mins | ⚡ High |
| **P2** | **Saved Address Book for Delivery** | ~40 mins | 👍 Medium |

---
*Created by Senior Front-End & Product Engineering Team for Mumbai Pav Co.*

