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

## 🔑 Seed Credentials
Role      Email             Password
Admin     admin@hrms.dev    Admin@123
Employee  john@hrms.dev     Employee@123
