# 🌶️ Mumbai Pav Co. — Operations, Station Access & QSR Scaling Strategy

This guide covers **how to access the Kitchen Display System (KDS) and Express Counter POS**, followed by the **industry best practices for scaling Mumbai Pav Co.** into a high-throughput, modern Quick-Service Restaurant (QSR) brand.

---

## Part 1: How to Login to Kitchen Display System (KDS) & Counter POS

### 1. Unified Master Admin Access
As the Store Owner / Super Admin, your master credentials grant **universal authorization** to all three internal systems:
- **Admin HQ Command Center** (`/admin`)
- **Kitchen Station Display (KDS)** (`/kds`)
- **Express Counter POS Register** (`/pos`)

#### Step-by-Step Instructions:
1. Open the Staff Login portal: **[http://localhost:3000/staff/login](http://localhost:3000/staff/login)**
2. Select your desired station tab:
   - 🍳 **Kitchen Station Display (KDS)** — for food prep & fry station
   - 🖥️ **Counter POS Register** — for front counter walk-in billing
   - 📊 **Store HQ Command Center** — for sales, inventory & store toggles
3. Enter your credentials:
   - **Email:** `shivam4918@gmail.com`
   - **Password:** `Prajapati1121@2003#$@21`
4. Click **Authorize & Sign In**.

> [!TIP]
> **Instant Station Switching:** Once signed in, you do not need to log out to switch stations. Use the station navigation pills in the top bar of the screen to jump directly between **Kitchen KDS**, **Express POS**, and **Admin HQ**.

---

### 2. Dedicated Staff Roles (Production Multi-User Architecture)
In a real-world multi-station store, kitchen chefs and counter cashiers should have separate staff credentials so they cannot modify business settings, view financial gross margins, or delete inventory.

| Role | Station Path | Capabilities | Security Boundary |
| :--- | :--- | :--- | :--- |
| **Store Admin** | `/admin`, `/kds`, `/pos` | Full store control, inventory restock, financial reports, user management | Universal access |
| **Kitchen Staff** | `/kds` | View pending tickets, mark orders "PREPARING" / "READY", monitor prep SLA | Blocked from `/admin` & `/pos` |
| **Counter Cashier** | `/pos` | Walk-in order entry, cash/UPI billing, reprint receipt tickets | Blocked from `/admin` & `/kds` |

---

## Part 2: The Best Strategic Blueprint — What We Should Do Next

To operate like industry leaders (McDonald's, Rebel Foods, Chaayos, JumboKing), here is the recommended roadmap across **Kitchen Operations**, **Counter POS**, **Customer Storefront**, and **Backend Automation**:

### 1. Kitchen Operations (KDS)
- **Audio Chime on New Orders:** Whenever a customer orders from the web or POS, trigger an automated chime/sound (`sound.playOrderReadyChime()`) so the fry chef hears the order immediately without staring at the screen.
- **Color-Coded SLA Timers:**
  - 🟢 **Green (0–4 mins):** On track.
  - 🟡 **Yellow (4–7 mins):** Target prep window approaching.
  - 🔴 **Pulsing Red (> 7 mins):** Overdue alert to prioritize the kadai.
- **Bump Bar / 1-Tap Workflow:** One-click transition from `PENDING` ➔ `PREPARING` ➔ `READY` ➔ `COLLECTED`.

### 2. Express Counter POS (Speed Billing)
- **3-Second Walk-in Billing:** Cashiers need rapid taps for high-volume items (e.g., "1 Classic Vada Pav + 1 Masala Cutting Chai").
- **Dynamic UPI QR on Screen:** Automatically generate a Razorpay/BharatPe UPI QR code on the POS screen with the exact bill amount so walk-in customers scan and pay instantly.
- **Thermal Receipt (KOT) Format:** Standard 58mm / 80mm printable kitchen order ticket for paper backup.

### 3. Customer Web Storefront & Experience
- **Live Order Tracking Page (`/order/[id]`):** Real-time status tracker with animated step milestones (Order Received ➔ Frying Fresh ➔ Ready for Pickup / Out with Rider).
- **Cart Combo Upsells:** One-click add-ons before checkout (e.g., "Pair with Masala Cutting Chai for ₹20" or "Add Extra Dry Garlic Thecha").
- **Table QR Ordering:** Customers seated at tables scan a QR code (`/?table=4`) which automatically locks their table number into the cart drawer.

### 4. Smart Inventory & Recipe BOM Automation
- **Automatic Stock Depletion:** When an order is moved to `PREPARING`, the system automatically subtracts the exact recipe ingredients (e.g., 1 Laadi Pav, 80g Potato, 20g Besan, 10g Butter) from the live inventory database.
- **Out-of-Stock Kill Switch:** If Batata or Pav inventory hits 0, the storefront automatically tags the item as **Sold Out Today** to prevent customer complaints and refund overhead.
- **Kitchen Surge Throttle:** If more than 25 active orders are in the kitchen, the system can automatically throttle new delivery orders or display an adjusted 20-minute delivery ETA.

