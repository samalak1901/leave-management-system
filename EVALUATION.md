# Evaluation Notes – Leave Management System  

## ✅ Features Implemented  
- User authentication & role-based access (Employee, Manager, HR, Admin).  
- Leave request creation, approval, rejection, cancellation.  
- Role-specific actions:  
  - Employees can create and edit their requests.  
  - Managers can approve/reject requests.  
  - HR can override manager’s decision.  
- Audit trail maintained for leave request updates.  
- Leave balances tracked by type (annual, sick, unpaid).  
- Protected routes in frontend with role-based restrictions.  
- Demo login credentials (Employee, Manager, HR) for quick testing.  
- Deployment on **Render** (backend & frontend).  
  - ⚠️ Note: Backend needs to be started first, frontend depends on it.  
  - Render may pause inactive services → wait a bit after hitting the URL.  

---

## ⚠️ Known Limitations  
- Render free-tier services may sleep → requires manual wake-up.  
- No email notifications implemented for leave status updates.  
- Limited test coverage (only basic unit/integration tests).  

---

## 📌 Grading Notes  
- **Backend**:  
  - Built with Node.js, Express, TypeScript.  
  - MongoDB used as database.  
  - API routes protected with JWT-based auth.  
  - Seed scripts included for sample users and leave requests.  

- **Frontend**:  
  - Built with React + TypeScript.  
  - Role-based routing & protected routes implemented.  
  - Integration with backend APIs.  

- **Testing**:  
  - Unit + integration tests included for backend APIs (limited).  

- **Docs**:  
  - README contains setup (dev & prod) + .env.example.  

---

✍️ *Evaluator should check both deployed links after starting backend, then frontend. If services are inactive, allow Render ~1 minute to wake up.*  