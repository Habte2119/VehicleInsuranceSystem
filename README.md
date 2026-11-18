# Vehicle Insurance Management System (VIMS)

A modern full-stack web application designed to streamline vehicle insurance operations, including policy lifecycle management, claims adjudication, vehicle registration, and user authentication.

---

## 🛠️ Tech Stack
- **Runtime & Backend**: Node.js, Express.js
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Security & Auth**: JWT (JSON Web Tokens), bcryptjs, HTTP-only Cookies
- **Frontend (Upcoming)**: React.js, Tailwind CSS, Vite

---

## 🚀 Project Milestones & Progress
- [x] **Milestone 1**: Database schema design and Prisma ORM configuration (`prisma/schema.prisma`)
- [x] **Milestone 2**: Express REST API server, database migrations, and secure authentication module
- [ ] **Milestone 3 (In Progress)**: Vehicle registration, policy creation, and claims processing services
- [ ] **Milestone 4**: Interactive client and administrator dashboards

---

## ⚙️ Getting Started & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or Neon serverless PostgreSQL)

### 2. Clone the Repository
```bash
git clone https://github.com/binaluv/VehicleInsuranceSystem.git
cd VehicleInsuranceSystem
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory (refer to `.env.example` for reference):
```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/vims"
JWT_SECRET="your_secure_jwt_secret"
```

### 5. Apply Database Migrations
```bash
npx prisma migrate deploy
```

### 6. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 🔐 Authentication Endpoints (Implemented)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate and issue JWT cookie |
| `POST` | `/api/auth/logout` | Clear auth token session |
| `GET` | `/api/auth/verifyemail` | Verify email token |
| `POST` | `/api/auth/forget-password` | Request password reset |
