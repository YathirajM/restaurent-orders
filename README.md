# OmniRoute Restaurant QR Ordering Platform

A premium, production‑ready restaurant QR ordering and management platform.

## Overview

This monorepo includes:

- **Customer website** – /t/<token> (scan QR, discover food, add to cart, pay, track order, collect)
- **Kitchen Display System** – /kitchen (full‑screen tablet/desktop view for order workflow)
- **Admin dashboard** – /admin (menu, tables, QR codes, orders, restaurant settings, user management)
- **APIs** – Next.js edge routes for all backend logic
- **Database** – SQLite via Drizzle with LibSQL/Turso support
- **Payments** – Razorpay integration with webhook verification, plus a simulated mode for local testing
- **Image handling** – uploaded images stored in the DB and served via /api/images/<id>

All three interfaces share a single reliable backend and real‑time synchronization.

## Tech Stack

- **Framework** – Next.js 15, React 19, TypeScript
- **Styling** – Tailwind CSS (custom Saffron & Slate design system)
- **Database** – Drizzle ORM on SQLite/LibSQL
- **Auth** – Session‑based cookies with bcrypt password hashing
- **Payments** – Razorpay REST API (with test‑mode fallback)
- **Icons** – lucide‑react
- **Image storage** – PostgreSQL BLOB emulation via SQLite Text mode buffer
- **QR codes** – Used in kitchen display (optional) via npm package qrcode
- **State** – React Context for cart + localStorage per table session
- **Validation** – Zod for request bodies
- **Utilities** – Custom money formatting, helpers for IDs, payment verification, order workflow

## Quick Start (local development)

```bash
# 1. Clone & install dependencies (runs npm install once)
npm install

# 2. Ensure .env values (copy from .env.example)
cp .env.example .env.local
# Edit .env.local as needed (Razorpay keys optional)

# 3. Push initial schema (creates file:./local.db)
npm run db:push

# 4. Seed demo data (creates restaurant, menu, tables, admin user)
npx tsx scripts/seed.ts

# 5. Start Next.js in dev (all three interfaces on localhost:3000)
npm run dev
```

## Login

Default admin credentials (created by seed):

- Email: owner@saffron.com
- Password: password123

## Deployment

1. **Git & GitHub**
   - Initialize repo: `git init`
   - Add files: `git add . && git commit -m "Initial restaurant ordering platform"`
   - Create a new GitHub repo and push:
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/restaurant-qr-ordering-platform.git
     git push -u origin main
     ```
2. **Netlify**
   - Configure a Next.js site via netlify.com/dashboard
   - Connect to the GitHub repo
   - Build commands:
     - `build`: `npm run db:push && npm run db:seed && npm run build`
     - `environment` variables:
       ```
       APP_URL=https://your-site.netlify.app
       NODE_ENV=production
       SESSION_SECRET=<random-long-secret>
       RAZORPAY_KEY_ID=rzp_live_xxx (optional for local)
       RAZORPAY_KEY_SECRET=rzp_live_xxx
       RAZORPAY_WEBHOOK_SECRET=whsec_xxx
       ```
   - Use Netlify functions for `/api/**` endpoints (automatic serverless runtime).

3. **Turso / LibSQL**
   - Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to environment variables.
   - Uses native LibSQL client for faster replication and low-latency.

## Features

### Customer Experience
- **QR destination** – /t/<token> (table specific, no login)
- **Mobile‑first menu** – horizontal category rail, search, filters (Veg/Non‑Veg/Bestseller/Special)
- **Food cards** – high‑quality images, badges, add with/without customizations
- **Customizations** – per‑item option groups (single/multi select) with price deltas, live total
- **Cart** – persistent across reloads per table, sticky bottom bar
- **Checkout** – name, optional phone, special instructions, Razorpay or simulated payment
- **Order tracking** – auto‑refresh status page with progress tracker
- **Order confirmation** – beautifully designed page with order number and ETA

### Kitchen Display System
- **Full‑screen board** – accepts, starts preparing, marks ready, calls customer, completes orders
- **Real‑time sync** – orders push instantly; no page refresh needed
- **Late alerts** – red badge for orders older than 10 minutes
- **Mobile optimized** – works on tablets and laptops

### Admin Dashboard
- **Overview** – sales, orders, pending/completed stats
- **Menu** – create/edit/delete food items with option groups (drag‑reorder supported)
- **Tables** – generate unique QR codes per table, manage availability
- **Orders** – filtered history with items, payment status, kitchen actions
- **Settings** – restaurant branding, tax/charge config, opening hours, currency
- **User management** – role‑based access (owner, manager, kitchen)

### Technical Quality
- **No external dependencies** – SQLite file or Turso, no external cloud services required.
- **Idempotent APIs** – duplicate submissions are safe; one order per idempotencyKey.
- **Testable** – simulated payment path when Razorpay credentials are missing.
- **Responsive** – mobile, tablet, desktop layouts.
- **Secure** – session cookies, password hashing, payment signature verification, no client‑side price tampering.
- **Observability** – error responses, payment events logged in paymentEvents table.
- **Internationalization** – currency formatting (INR), supports additional currencies via config.

## Project Phases (as implemented)

| Phase | Scope |
|-------|-------|
| 1 – Project folder | ~/Documents/Projects/restaurant-qr-ordering-platform (fresh repo) |
| 2 – Product vision | Customer/kitchen/admin interfaces, workflows, data model |
| 3 – Research & design | Saffron & Slate design system, premium visual identity |
| 4 – World‑class design | Food‑centric, modern, sophisticated UI, smooth interactions |
| 5 – Customer website | QR → menu → cart → checkout → payment → tracking |
| 6 – Food cards & customization | Image-heavy cards, bottom sheet for options, live price deltas |
| 7 – Cart & checkout | Sticky bar, address collection minimal, tax/charge breakdown |
| 8 – Payment integration | Razorpay live + simulated mode, webhook verification, webhooks |
| 9 – Order confirmation & tracking | Live status, progress tracker, completion animation |
| 10 – Kitchen Display System | Real‑time order acceptance workflow, timestamps |
| 11 – Admin dashboard | Full CRUD for menu/tables, sales reports, restaurant settings |
| 12 – Interface separation | Three distinct routes with auth, clear navigation |
| 13 – Technical architecture | Next.js/TypeScript/Tailwind, Drizzle on SQLite, reusable components |
| 14 – Functionality & quality | Every control works; extensive validation; no fake interactions |
| 15 – Complete testing | Manual workflow walkthroughs (customer, admin, kitchen) |
| 16 – Autonomous development | Systematic implementation without waiting for prompts |
| 17 – Language | English only (development & UI) |
| 18 – GitHub & Netlify | Repo, CI, deployment, preview URLs |

## License

Proprietary — intended for commercial sale to restaurants.

---

**Ready for production demo.** Open /admin, log in with seed credentials, and explore all interfaces. The customer site is at `/t/<table-qr-token>` where the token is generated per table (see /admin/tables).

Please ask for clarification on any part of the architecture, features, or deployment steps.
