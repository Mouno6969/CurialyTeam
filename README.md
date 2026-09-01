# Curialy

Independent digital subscription storefront. Classical dark shop: Instrument type, radial dot field, official X and Google AI marks, guest bag → X handle → payment link.

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
npm run dev       # local shop
npm run build     # production bundle in dist/
npm run preview   # serve the production bundle
npm run typecheck
```

## What you get

| Path | Page |
|---|---|
| `/` | Shop — plans, bag, typewriter hero |
| `/how-it-works` | Guest flow |
| `/support` | Support topics |
| `/documentation` | Store reference |
| `/referrals` | Referral program |
| `/r/:code` | Referral landing |
| `/pay/:id` | Network → coin → manual transfer or connected wallet |

Checkout is guest-only: choose a plan, confirm the X handle when needed, then open a payment session stored locally in the browser. Wire a real settlement backend when you are ready to take live funds.

## Brand

- Photo C mark: `public/brand/curialy-logo.jpg`
- Official X logomark
- Official Google Gemini / Google AI spark (not the Google Search wordmark)
- Fonts: Instrument Serif, Instrument Sans, IBM Plex Mono
