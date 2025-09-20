# 📘 Leave Management System (MERN + TypeScript)

A full-stack Leave Management System built with **React (TypeScript)** on the frontend and **Node.js + Express (TypeScript)** on the backend, with **MongoDB Atlas** as the database.  

It allows employees to **request leaves**, managers to **approve/reject**, and HR to **override decisions**. Includes authentication, role-based access, and seed data for quick testing.  

---

## 🚀 Live Deployment (Render)

⚠️ On Render free tier, apps go to sleep after inactivity.  
👉 Always **open backend first**, wait 20–30s, then open frontend.

- **Backend API** → https://leave-management-system-uw25.onrender.com/api/
- **Frontend App** → https://leave-management-system-1-bcvm.onrender.com/  

---

## ✨ Features
- 👨‍💼 Roles: Employee, Manager, HR
- 📝 Submit leave requests
- ✅ Manager approve/reject
- 🔄 HR override manager decisions
- 🔑 JWT Authentication
- 📊 Audit log for actions
- 📥 Export leave records (CSV)
- 🌐 Responsive UI (React + TailwindCSS)
- ⚡ Seed users + leaves for demo

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB Atlas
- Docker + Docker Compose (optional for prod)

---

### 🔧 Development Setup

1. Clone repo:
   ```bash
   git clone https://github.com/samalak1901/leave-management-system.git
   cd leave-management-system
   ```

2. Setup env files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Run backend:
   ```bash
   cd backend
   npm run dev
   ```

5. Run frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🌱 Database Seed

To create sample users (employee, manager, HR) + demo leaves:

```bash
cd backend
npm run seed
```

Demo Users:

| Role     | Email                 | Password    |
|----------|-----------------------|-------------|
| Employee | employee@example.com  | password123 |
| Manager  | manager@example.com   | password123 |
| HR/Admin | hr@example.com        | password123 |

---

## 📬 API Docs

---

## 📌 Known Limitations
- Render free tier may cause slow first response

---

## 📸 Demo / Screenshots