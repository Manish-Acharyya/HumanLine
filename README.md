# 👥 HumanLine

HumanLine is a secure, role-based Human Resource Management System (HRMS) built with the MERN Stack. It helps organizations streamline workforce management, automate attendance and leave tracking, and process payroll with downloadable PDF payslips. The project demonstrates practical experience with full-stack architecture, secure httpOnly cookie authentication, REST APIs, database design, and npm workspaces.

## 🚀 Features

## 👤 User Authentication & Security
JWT-based authentication stored in secure httpOnly cookies (hrms_token) • Role-Based Access Control (RBAC) with separate Admin and Employee dashboards • Forgot & Reset Password workflow via secure crypto tokens • Password visibility toggles

## 🏢 Employee Management
Full CRUD operations to create, view, update, terminate, and delete staff profiles • Automatic generation of demo organizational data • Centralized workforce directory for administrators

## 📅 Attendance & Leave Tracking
Real-time daily clock-in and clock-out logging • Employee self-service leave request submission • Administrative leave approval and rejection workflow • Historical logs for audit trails

## 💰 Payroll & Payslips
Automated salary calculation based on base pay • Smart unpaid-leave deductions mapped from attendance • Dynamic client-side downloadable PDF payslips using jsPDF

## 🛠️ Tech Stack
Frontend React 18 • Vite • Tailwind CSS v4 • React Router DOM • Axios • Lucide React • jsPDF
Backend Node.js • Express.js (ESM) • express-validator • cookie-parser • cors
Database MongoDB • httpOnly Cookies • bcryptjs • Crypto tokens
Tools & Project Structure npm Workspaces • Concurrently • Git • Postman

## 🏁 Quick start

```bash
npm install           # installs workspaces (client + server)
npm run seed          # creates demo admin, employees, attendance, leaves, payroll
npm run dev           # server :5000 + client :5173 (Vite proxies /api → :5000)
```

Open **http://localhost:5173**

## Seed credentials

| Role     | Email          | Password     |
|----------|----------------|--------------|
| Admin    | admin@hrms.dev | Admin@123    |
| Employee | john@hrms.dev  | Employee@123 |

## Scripts

| Command        | What it does                                  |
|----------------|-----------------------------------------------|
| `npm run dev`  | Runs API + client together (concurrently)     |
| `npm run seed` | Seeds/refreshes demo data                     |
| `npm run build`| Production build of the React client          |
| `npm start`    | Runs the API + serves the built client        |

## Features

1. **RBAC** — separate `/admin/*` and employee self-service dashboards
2. **Employee management** — create, view, update, terminate, delete staff
3. **Attendance & leave** — clock in/out, leave request/approval workflow
4. **Payroll** — salary calculation with unpaid-leave deduction, PDF payslips
5. **Password flows** — forgot/reset token flow + show/hide password toggles

> ⚠️ Password reset links are **emailed** when SMTP is configured. Without SMTP
> on a development machine the reset token is returned in the API response; on a
> **public host** forgot-password returns **503** instead (reset tokens are never
> exposed publicly). See `plan.md §4`.

## Production deployment

1. **Configure the environment** (`.env` locally, or your host's dashboard — e.g.
   Render → *Environment*):

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `NODE_ENV=production` | ✅ | Full production contract (fail-fast validation, invite-only registration) |
   | `JWT_SECRET` | ✅ | ≥ 32 chars, high entropy: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `MONGODB_URI` | ✅ | Your MongoDB Atlas connection string |
   | `CLIENT_URL` | ✅ | Public frontend URL, e.g. `https://your-app.onrender.com` (password-reset links) |
   | `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` | recommended | Password-reset emails; without them forgot-password returns 503 |
   | `TRUST_PROXY` | auto on Render | Set `1` manually behind nginx/ALB so rate limiting sees real client IPs |
   | `ALLOW_OPEN_REGISTRATION` | optional | `true` to allow public sign-up (default: invite-only on public hosts) |
   | `AUTH_RATE_LIMIT_MAX` | optional | Failed auth attempts per IP per 15 min (default `20`) |

   Startup **fails fast** with a clear message when `NODE_ENV=production` and a
   required variable is missing/weak — a bad config can never silently reach traffic.

   **Platform detection:** running on Render (the `RENDER` platform marker) always
   engages production hardening even if `NODE_ENV` was left at `development`:
   `Secure` httpOnly cookies, HSTS, invite-only registration, no stack traces,
   no token-in-response password resets, per-client-IP rate limiting, and a random
   per-boot `JWT_SECRET` fallback if none is configured (sessions then reset on
   restart — set `JWT_SECRET` to keep sessions stable). Startup logs list every
   config warning; `GET /api/health` reports `env` and `productionLike`.

2. **Build and run:**

   ```bash
   npm ci
   npm run build        # builds client/dist
   npm start            # API serves the app on PORT (default 5000)
   ```

   On Render: Build Command `npm ci && npm run build`, Start Command `npm start`.

3. **Health checks:** `GET /api/health` (liveness), use your proxy's static file
   caching for `/assets/*` if desired.

**Security behavior on public hosts:** open registration is disabled (admins
create employees at `/admin/register`, who change their admin-set password after
first login; override with `ALLOW_OPEN_REGISTRATION=true`), failed auth attempts
are rate-limited per client IP (`AUTH_RATE_LIMIT_MAX` per 15 min — successful
logins never consume the budget), security headers (helmet/CSP/HSTS) are on, and
request bodies/queries are sanitized against NoSQL injection. The seed script
refuses to run on production-like hosts (use `npm run seed -w server -- --force`
only if you really mean it).
