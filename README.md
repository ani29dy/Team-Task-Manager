# TaskFlow — Team Task Manager

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application for collaborative project and task management, featuring **role-based access control** (Admin/Member).

🌐 **Live Demo:** [Your Railway URL here]  
📁 **GitHub:** [Your GitHub repo here]

---

## ✨ Features

### 🔐 Authentication
- JWT-based signup/login with secure password hashing (bcrypt)
- Token persisted in localStorage with auto-refresh on page load
- Protected routes with automatic redirect

### 👥 Role-Based Access Control
| Feature | Admin | Member |
|---------|-------|--------|
| Create/delete projects | ✅ | ❌ |
| Manage team members | ✅ | ❌ |
| Create/delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ (assigned tasks) |
| View dashboard & tasks | ✅ | ✅ |
| User management page | ✅ | ❌ |

### 📊 Dashboard
- Real-time stats: Total, In Progress, Done, Overdue
- Overall completion progress bar
- Recent tasks grid
- Quick project links

### 📁 Projects
- Color-coded project cards with progress bars
- Stacked member avatars
- Kanban board (To Do / In Progress / Done columns)
- Add/remove team members per project

### ✅ Tasks
- Full CRUD with title, description, priority, due date, assignee
- Status: `todo` → `in-progress` → `done`
- Priority: Low / Medium / High
- Overdue detection with visual badges
- Filter by status, priority, overdue

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| HTTP Client | Axios |
| Deployment | Railway |

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/ani29dy/Team-Task-Manager.git
cd TeamTaskManager
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/teamtaskmanager
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm run dev   # starts on http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev   # starts on http://localhost:5173
```

---

## 🌐 Deployment (Railway)

### Backend Service
1. New service → Deploy from GitHub → select `backend/` folder
2. Set environment variables in Railway dashboard:
   - `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `NODE_ENV=production`
3. Railway auto-detects `npm start` (runs `node server.js`)

### Frontend Service
1. New service → Deploy from GitHub → select `frontend/` folder
2. Set build command: `npm run build`
3. Set start command: `npx serve dist -s`
4. Set env var: `VITE_API_URL=https://your-backend.railway.app`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | Private |
| POST | `/api/projects` | Admin |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Admin |
| POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/tasks` | Private |
| GET | `/api/tasks/dashboard` | Private |
| POST | `/api/tasks` | Admin |
| PUT | `/api/tasks/:id` | Admin/Member* |
| DELETE | `/api/tasks/:id` | Admin |

*Members can only update `status`

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users` | Admin |
| GET | `/api/users/all` | Private |
| DELETE | `/api/users/:id` | Admin |

---

## 📂 Project Structure

```
TeamTaskManager/
├── backend/
│   ├── config/db.js
│   ├── middleware/auth.js, roleCheck.js
│   ├── models/User.js, Project.js, Task.js
│   ├── routes/auth.js, projects.js, tasks.js, users.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/Sidebar.jsx, Modal.jsx, TaskCard.jsx, PrivateRoute.jsx
        └── pages/Login, Signup, Dashboard, Projects, ProjectDetail, Tasks, UserManagement
```

---

## 🎥 Demo Video

[Link to demo video]

---
