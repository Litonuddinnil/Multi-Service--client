# Deployment checklist — Vercel (client) ↔ Render / Express (backend)

Symptom this doc fixes: **`POST /api/auth/register` returns 404 on the deployed site**, so
registration cannot reach MongoDB even though the backend is healthy.

## Why this happens

The client is a static SPA on Vercel. Every `/api/*` call goes to whatever URL
`VITE_API_BASE_URL` resolves to at build time. If that variable is **empty** (or
points at the Vercel host itself), the request hits the static CDN, Vercel's
rewrite rule excludes `/api/*` from the SPA fallback, and the request 404s.

The server is fine — `/api/auth/register` exists and inserts into the `users`
collection. The only thing missing is the URL the client uses to reach it.

## Fix (one-time, in the Vercel dashboard)

1. Open **Vercel → your project → Settings → Environment Variables**.
2. Add:

   | Name | Value | Environments |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://<your-backend>.onrender.com` | Production, Preview, Development |

   Replace `<your-backend>.onrender.com` with the real Render hostname (the one
   the `server.ts` `PORT` listens on; `app.get('/healthz', ...)` is the easiest
   smoke test — it returns `{status:'ok', database:'Dynamic JSON Engine (MongoDB)', isMongoConnected:true}`).

3. **Redeploy.** Vite reads `VITE_API_BASE_URL` at build time, so the next
   production build embeds the right URL.

   If you change the value later you must redeploy again — there is no runtime
   override.

4. Confirm:

   ```text
   # From the browser DevTools Network tab on the deployed site:
   POST https://<your-backend>.onrender.com/api/auth/register  →  201
   ```

   You should also see a single row in MongoDB (`db.users.findOne({email:...})`)
   immediately after — registrations land in the `users` collection on the
   happy path.

## Local dev (no env var needed)

```bash
# In client/.env.local (already shipped empty)
VITE_API_BASE_URL=
```

`npm run dev` runs Vite as middleware inside Express on port `4174`, so `/api/*`
is same-origin. Leave the variable empty for local work; only set it for the
deployed build.

## What changed in the code

To make this failure mode easier to diagnose in the future, the client now
distinguishes three cases instead of one generic "could not reach":

| Situation | UI message |
|---|---|
| `VITE_API_BASE_URL` is empty (no backend configured) | "The frontend is not configured to talk to a backend (VITE_API_BASE_URL is empty)…" |
| 404 from the host (still no backend) | "The registration server returned 404. The frontend is pointing at a host that has no API…" |
| Network / DNS / TLS error | "Could not reach the registration server. Please check your connection…" |
| 5xx from the backend | "The registration server returned HTTP NNN. Please try again…" |
| 400 / 409 from the backend | The server's own validation message (unchanged) |

The console also logs the missing-env-var warning on the first API call, not
just at module load — so it lands next to the failing request in DevTools.

## Registration has no email-verification step

`POST /api/auth/register` creates an `ACTIVE` account and issues a session in
the same response — the same shape that `/api/auth/google` returns. There is
no `/api/auth/verify-email` route anymore, and the server does NOT send a
6-digit code to the user.

What this means operationally:

- **No SMTP required.** The `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` /
  `SMTP_PASS` / `SMTP_FROM` env vars documented in `server/.env.example` are
  optional. `server/services/mailer.ts` exists for future transactional use
  (e.g. expert approval notifications) but is not wired into registration.
  Leave the SMTP vars unset on Render unless you start sending mail.
- **No OTP screen on the client.** `RegisterView` goes form → success toast →
  customer dashboard. The old "enter 6-digit code we emailed you" step and
  the `OtpInput` component are gone.
- **Login & refresh have no `pending_verification` gate.** Sign-in works the
  moment the row exists in the `users` collection; refreshes never return
  `email_not_verified`.

If you ever want to re-introduce verification, both ends have hooks: the
mailer is already there (call `sendMail({to, subject, text, html})`),
and the `users` schema already has `status: 'pending_verification' | 'active'`
so re-adding the gate is a small change.
