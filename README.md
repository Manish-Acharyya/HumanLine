# HumanLine — Human Resource Management System

MERN stack HRMS with **cookie-based JWT authentication** (httpOnly), role-based access
control, employee management, attendance & leave tracking, and payroll with
downloadable PDF payslips.

> 📖 **Read [`plan.md`](./plan.md) first** — it contains the total workflow of the
> project: architecture, auth lifecycle, data model, every API endpoint, route map,
> and per-feature flows.

## Tech stack

- **Frontend:** React 18 + Vite, Tailwind CSS v4, React Router DOM, Axios, lucide-react, jsPDF
- **Backend:** Node.js + Express (ESM), Mongoose, express-validator, cookie-parser, cors
- **Auth:** JWT stored in an httpOnly cookie (`hrms_token`), bcryptjs, crypto reset tokens
- **Database:** MongoDB (local service, `127.0.0.1:27017`)

## Quick start

```bash
npm install          # installs root + client + server (npm workspaces)

# server/.env is pre-created for dev — adjust if needed:
#   PORT=5000
#   MONGODB_URI=mongodb://127.0.0.1:27017/hrms
#   JWT_SECRET=<change in production>
#   CLIENT_URL=http://localhost:5173

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
| `npm start`    | Runs the API only (production)                |

## Features

1. **RBAC** — separate `/admin/*` and employee self-service dashboards
2. **Employee management** — create, view, update, terminate, delete staff
3. **Attendance & leave** — clock in/out, leave request/approval workflow
4. **Payroll** — salary calculation with unpaid-leave deduction, PDF payslips
5. **Password flows** — forgot/reset token flow + show/hide password toggles

> ⚠️ Forgot-password reset tokens are returned in the API response in
> non-production mode only (no email provider is configured). See `plan.md §4`.
