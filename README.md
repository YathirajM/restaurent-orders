# The Urban Plate — Premium QR Restaurant Ordering & Management Ecosystem

A commercial-grade, multi-interface dine-in restaurant platform built for restaurants, cafes, and gastro-bistros.

---

## 🍽️ System Overview

The platform connects three core interfaces in **real time**:

1. **Customer Ordering Website (`/menu` & `/table/[tableToken]`)**
   - Clean, mobile-first food menu with high-resolution food photography.
   - Dietary segmentation (Vegetarian, Non-Vegetarian, Bestsellers, Chef's Specials).
   - Real-time dish availability status (In Stock vs. Sold Out).
   - Product details modal with variant sizes (Regular / Large / Half / Full), paid add-ons, and spice level selector.
   - Floating persistent cart with coupon promo engine (`WELCOME20`, `FLAT100`, `URBAN30`).
   - Server-verified price calculations (subtotal, 5% GST, 5% service charge).
   - Dual payment options: **Razorpay Online (UPI/Cards)** and **Pay at Counter (Cash/Card after meal)**.
   - Live order tracking timeline: *Placed → Accepted → Preparing → Ready → Served → Completed* with digital GST receipt printing.

2. **Kitchen Display System (KDS) (`/kds`)**
   - High-contrast, tablet-optimized screen for chefs and kitchen staff.
   - 4-column kanban ticket flow: *New Orders → Acknowledged → In Preparation → Ready for Pickup*.
   - Prominent table callout badges and elapsed preparation timers (turning amber at 15m, red at 25m).
   - High-fidelity Web Audio API synthesized order alerts (no external MP3 asset dependency).

3. **Restaurant Admin SaaS Dashboard (`/admin`)**
   - Executive analytics: Gross Sales, Order Volume, Kitchen Active Orders, Average Order Value (AOV), and Table Occupancy Rate.
   - Peak hours hourly revenue distribution chart.
   - Real-time Live Order management with instant Accept / Reject (with customer reason) / Advance actions.
   - Product & Menu management: Add, edit, delete dishes, and **one-click instant out-of-stock toggle** that reflects on customer screens without page reload.
   - Interactive Table Floor Plan with individual QR Code generation, PNG download, and **printable A4 Table Standee Sheet**.
   - Payment transaction audit ledger and settlement logs.
   - Promotional coupon manager and restaurant tax / GSTIN configuration.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18.0` or higher
- npm `v9.0` or higher

### Installation

1. **Clone and enter the directory**:
   ```bash
   cd "claude website"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables (Optional)**:
   ```bash
   cp .env.example .env.local
   ```
   *(If Razorpay keys are omitted, the application runs in sandbox demo mode with built-in payment verification)*.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. Open your browser:
   - **Interactive Presentation Portal**: [http://localhost:3000](http://localhost:3000)
   - **Customer Menu (Table 04 Demo)**: [http://localhost:3000/menu?table=04](http://localhost:3000/menu?table=04)
   - **Restaurant Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **Kitchen Display System (KDS)**: [http://localhost:3000/kds](http://localhost:3000/kds)

---

## 🎬 How to Demonstrate to Restaurant Owners

To demonstrate the real-time ecosystem in a sales meeting:

1. **Open two browser windows side-by-side**:
   - Left window: **Customer Ordering Menu** (`/menu?table=04`)
   - Right window: **Kitchen Display (KDS)** (`/kds`) or **Admin Dashboard** (`/admin`)

2. **Place an order as a customer**:
   - Browse dishes, click **Smoky Paneer Tikka** or **Butter Chicken**.
   - Select portion size, add extra cheese or mint chutney, set spice level.
   - Add to Cart, apply coupon `WELCOME20`, and click **Place Order**.

3. **Observe real-time propagation**:
   - The Kitchen Display instantly rings with an audio chime and the new ticket appears in the **New Incoming** column.
   - The Admin Dashboard updates today's sales and table occupancy.
   - Chef clicks **Accept Order** → **Start Preparing** → **Mark Dish Ready**.
   - Watch the customer's phone screen automatically advance through the stages without refreshing the page!

4. **Demonstrate out-of-stock toggle**:
   - In Admin Menu (`/admin/menu`), toggle any dish to **Sold Out**.
   - Switch to the customer menu: the dish immediately turns grey and says "Sold Out", preventing accidental orders.

5. **Demonstrate QR code table standees**:
   - In Table Management (`/admin/tables`), click **Print All QR Standees** to display ready-to-print acrylic standees.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 15 (App Router, Server Actions & Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, CSS variables, dark/light theme
- **Icons**: Lucide React
- **Audio Synthesizer**: Web Audio API oscillator synthesis (zero external asset latency)
- **QR Engine**: Cryptographically salted table token generator & high-res QR renderer
- **State & Realtime**: Unified BroadcastChannel event bus + Server-Sent Events architecture
- **Security**: Server-side price calculation, token verification, strict input validation
