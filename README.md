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
| `/pay/:id` | Network → coin → transfer or connected wallet |

Checkout is guest-only: choose a plan, confirm the X handle when needed, then open a payment session stored locally in the browser.

## Brand

- Photo C mark in the header only
- Official X logomark
- Official Google Gemini / Google AI spark
- Fonts: Instrument Serif, Instrument Sans, IBM Plex Mono
