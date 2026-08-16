# withU — Multi-Service Marketplace

A full-stack Vite + React + TypeScript single-page application for a multi-vendor
services marketplace (consultations, milestone projects, Hajj/Umrah packages,
retainer subscriptions, and commerce) with an Express + MongoDB backend.

The dev server (`server.ts`) mounts both the Express API (`/api/*`) and the Vite
dev middleware, so one `npm run dev` is enough to run everything during
development.

---

## 1. Prerequisites

- **Node.js** 18+ (Node 20 LTS recommended)
- **npm** 9+ (the project was scaffolded with `bun.lock`, but plain `npm` works)
- *(Optional)* A **MongoDB** URI if you want persistence — the app falls back to
  a local JSON file store (`.data/*.json`) when MongoDB is not configured.

## 2. Install

```bash
npm install
```

## 3. Environment variables

Copy the example file and edit as needed:

```bash
cp .env.example .env.local
```

The relevant variables are documented inline in `.env.example`. Only the
Firebase keys are required for Firebase Auth to work; the rest of the app
degrades gracefully to localStorage + the JSON/Mongo data store.

## 4. Run the app (development)

```bash
npm run dev
```

This runs `tsx server.ts`, which:

- Starts **Express** on `http://localhost:3000`
- Mounts the **API** at `http://localhost:3000/api/*`
- Initializes the **data store** (MongoDB if `MONGODB_URI` is set, otherwise
  the local JSON file store under `.data/`)
- Serves the **Vite SPA** through Vite's middleware (HMR enabled)

Open `http://localhost:3000` in your browser.

## 5. Other scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the unified Express + Vite dev server (port 3000). |
| `npm run build` | Build the SPA (`dist/`) and bundle the server (`dist/server.cjs`). |
| `npm run start` | Run the *production* server (`node dist/server.cjs`) — serve the baked bundle. |
| `npm run preview` | Preview the production Vite build locally. |
| `npm run lint` | Type-check the project with `tsc --noEmit`. |
| `npm run clean` | Remove `dist/` and `server.cjs`. |

> **Note:** This project does **not** have a separate `dev:server` script. The
> backend is served by the same `npm run dev` command via `server.ts`.

## 6. Demo accounts

The app ships with three seeded users (defined in `src/services/storage.ts`).
Click the **Client / Doctor / Admin** buttons on the login modal to autofill
the credentials, or use them manually:

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Customer | `mdniloyhasan544@gmail.com` | `password123` | MFA disabled. |
| Doctor (Expert + Customer) | `dr.tanzim@withu.health` | `password123` | MFA enabled. |
| Admin | `admin@withu.market` | `adminPass!2026` | MFA enabled. |

### MFA in the demo

The demo `verifyMfa()` accepts **any six-digit code** (e.g. `123456`) or a
recovery code containing a hyphen. This is intentional for the demo so you can
explore the MFA-gated Admin/Doctor flows without an authenticator app. In a
production deployment, real TOTP verification must be enforced by the backend.

## 7. Project structure

```
src/
├── App.tsx                       ← Root component + routing
├── main.tsx                      ← Vite entry point
├── components/
│   ├── auth/                     ← AuthModal, AuthProvider
│   ├── booking/                  ← BookingDrawer, PilgrimageBookingModal, …
│   ├── common/                   ← StatusPill, MoneyValue, FormField, …
│   ├── consultation/             ← DoctorConsultationRoom
│   ├── layout/                   ← Navbar, Footer
│   └── payment/                  ← PaymentModal
├── constants/                    ← categories, i18n, errorCodes, initialData
├── contexts/                     ← AuthContext, CartContext, LanguageContext, …
├── firebase/                     ← firebase.config, firebase.ts
├── services/                     ← api.ts (ApiService), storage.ts, pdfService.ts
├── types/                        ← Domain types (withU)
└── views/                        ← Home, Catalog, Customer/Expert/Admin portals, …
server/
├── data-store.ts                 ← JSON / MongoDB hybrid store
├── models/                       ← Mongoose models
└── routes/api.ts                 ← Express API router
server.ts                         ← Express + Vite dev entry
```

## 8. Dashboards

Routing is centralized in `src/App.tsx`. Each role gets a dedicated portal view:

- **Customer Portal** (`views/CustomerPortalView.tsx`) — appointments,
  milestone projects, Hajj/Umrah bookings, retainer subscriptions, payment
  ledger. Triggered via `currentView === 'customer'`.
- **Expert Portal** (`views/ExpertPortalView.tsx`) — provider earnings, escrow
  releases, schedule. Triggered via `currentView === 'expert'`.
- **Admin Portal** (`views/AdminPortalView.tsx`) — verification queue, payouts,
  commission config, full user ledger. Triggered via `currentView === 'admin'`.

The active role is derived from `user.roles` in `src/contexts/AuthContext.tsx`:

- `ADMIN` / `SUPER_ADMIN` → admin portal
- `EXPERT` → expert portal
- otherwise → customer portal

To switch roles (e.g. for the seeded doctor who has both `CUSTOMER` and
`EXPERT`), call `useAuth().switchRole('EXPERT')` from any component.

## 9. Troubleshooting

- **Port 3000 already in use** — Edit `PORT` in `server.ts` (currently hard-coded
  to `3000`) or stop the conflicting process.
- **MongoDB connection errors** — Delete or comment out `MONGODB_URI` in
  `.env.local`; the JSON file store will be used instead.
- **Firebase "auth/api-key-not-valid"** — Firebase will be skipped automatically;
  the app will log in via the local `ApiService` flow. The seeded demo accounts
  will still work.
- **Stale localStorage data** — Open DevTools → Application → Local Storage →
  delete the `withu_*_v1` keys to reset to seed data.
- **Type-check is failing** — Run `npm run lint` to see the errors; the project
  uses TypeScript ~5.8 and React 19.

## 10. License

This is a university project scaffold. Adapt the license header before any
production deployment.
