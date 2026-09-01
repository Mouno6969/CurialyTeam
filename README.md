# Curialy

Independent digital subscription storefront. Classical dark shop: Instrument type, radial dots, official X and Google AI marks, guest bag → X handle → payment link.

This is the complete Grok-built storefront. It does **not** reuse the previous Manus / Express / tRPC codebase.

## Stack

- React 19
- Vite 8
- TanStack Router
- Tailwind CSS v4
- Zustand

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
```

## Pages

| Path | Page |
|---|---|
| `/` | Shop — plans, bag, typewriter hero |
| `/how-it-works` | Guest flow |
| `/support` | Human desk on Telegram `@Curialy` |
| `/refund-policy` | If a paid order never arrives, it is refunded |
| `/documentation` | Store reference |
| `/referrals` | Referral program |
| `/r/:code` | Referral landing |
| `/pay/:id` | Network → coin → manual transfer, then the receipt |
| `/order` | Customer looks up an order by its code |
| `/admin` | Operator queue: pending orders, status changes |

Checkout is guest-only: choose a plan, confirm the X handle when needed, then an
order is created server-side and identified by a short code such as
`CLY-7K3M2QX9`.

## Order service (`server/`)

The storefront is static, but orders are not: `server/` is a small Express + MariaDB
service that owns order state so the customer, the operator, and the Telegram bot
all read the same record.

```bash
cd server
npm install
sudo server/deploy.sh          # sync to /srv/curialy-api and restart the unit
npm run set-webhook            # (re)register the Telegram webhook
node scripts/preview-receipt.js completed   # render a sample receipt to /tmp
```

| Piece | Where |
|---|---|
| Schema (`orders`, `order_events`, sessions, rate limits) | `server/schema.sql` → database `curialy_team` |
| Prices, networks, settlement addresses | `server/src/catalog.js` |
| Receipt PNG (parchment layout, QR + Code128 barcode) | `server/src/receipt.js` |
| Telegram notifications and inline status buttons | `server/src/telegram.js` |
| Admin password login, server-side sessions | `server/src/admin.js` |

Prices are resolved server-side from the product and plan keys, never from
amounts sent by the browser. Order status is only ever changed by the operator —
from `/admin` or from the Telegram bot — and every transition is appended to
`order_events`.

Secrets (bot token, admin password hash, database password) live only in
`/etc/curialy-api/curialy-api.env`, root-owned and mode 600. Nothing in that file
is referenced by the frontend build.

Statuses: `awaiting_payment` → `pending` (customer submitted a hash, operator
notified) → `confirming` → `completed` or `rejected`. Unpaid orders become
`expired` after 30 minutes.

## Brand

- Photo C mark in the header only
- Official X logomark
- Official Google Gemini / Google AI spark
- Fonts: Instrument Serif, Instrument Sans, IBM Plex Mono
