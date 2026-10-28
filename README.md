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

<<<<<<< HEAD
## 🔑 Seed Credentials
Role      Email             Password
Admin     admin@hrms.dev    Admin@123
Employee  john@hrms.dev     Employee@123
=======
npm run seed         # creates demo admin, employees, attendance, leaves, payroll
npm run dev          # server :5000 + client :5173 (Vite proxies /api → :5000)
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

> ⚠️ Password reset links are **emailed** when SMTP is configured (required in
> production). Without SMTP (development), the reset token is returned in the API
> response instead. See `plan.md §4`.

## Production deployment

1. **Configure the environment** — copy `server/.env.example` to `server/.env` and set:

   | Variable | Required in production |
   |----------|------------------------|
   | `NODE_ENV=production` | ✅ |
   | `JWT_SECRET` | ✅ ≥ 32 chars, high entropy (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `MONGODB_URI` | ✅ your MongoDB Atlas URI |
   | `CLIENT_URL` | ✅ public URL of the frontend |
   | `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` | ✅ for password reset emails |
   | `TRUST_PROXY=1` | if behind nginx/ALB (so rate limiting sees real IPs) |

   Startup **fails fast** with a clear message if any of these are missing/weak —
   a bad config can never silently reach traffic.

2. **Build and run:**

   ```bash
   npm ci
   npm run build        # builds client/dist
   npm start            # API serves the app on PORT (default 5000)
   ```

   Put a TLS-terminating reverse proxy (nginx) in front, or run under a process
   manager (`npx pm2 start npm --name hrms -- start`, then `pm2 save`).

3. **Health checks:** `GET /api/health` (liveness), use your proxy's static file
   caching for `/assets/*` if desired.

**Security behavior in production:** open registration is disabled (admins create
employees, who get an admin-set password and change it after first login), auth
endpoints are rate-limited (20 attempts / 15 min, `AUTH_RATE_LIMIT_MAX`),
security headers (helmet/CSP/HSTS) are on, and request bodies/queries are
sanitized against NoSQL injection. The seed script refuses to run in production
(use `--force` only if you really mean it).
>>>>>>> d967111 (Update Employee Management project)
