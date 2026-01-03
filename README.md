# Session-Based Authentication System with RBAC

A comprehensive interview test project implementing secure session-based authentication with role-based access control using NestJS and TanStack Start.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository>
cd islamic_affair_test_project

# Start with Docker Compose
docker-compose up -d

# Access applications
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 📋 Project Structure

```
islamic_affair_test_project/
├── docker-compose.yml          # Docker orchestration
├── INTERVIEW_TEST.md          # Complete interview test documentation
├── backend/                   # NestJS backend
│   ├── Dockerfile
│   └── src/                  # Source code (to be implemented)
├── frontend/                 # TanStack Start frontend
│   ├── Dockerfile
│   └── app/                  # Source code (to be implemented)
└── README.md                 # This file
```

## 🎯 Interview Test Overview

This is a **5-hour technical interview test** for Senior Full-Stack Developer positions.

**Key Requirements:**
- Session-based authentication (NO JWT, NO Passport)
- Role-based access control (admin/user)
- Security best practices (HTTP-only cookies, BCrypt)
- Clean architecture and code quality

**Evaluation Criteria:**
- Session authentication implementation (25%)
- RBAC correctness and security (25%)
- Code architecture and quality (20%)
- Security best practices (20%)
- Frontend-backend integration (10%)

## 📖 Complete Documentation

See [INTERVIEW_TEST.md](./INTERVIEW_TEST.md) for:
- Detailed technical requirements
- Complete backend solution (NestJS)
- Complete frontend solution (TanStack Start)
- Interview questions and evaluation rubric
- Security considerations and best practices

## 🔧 Development Setup

### Prerequisites
- Docker and Docker Compose
- Bun runtime (for local development)

### Local Development
```bash
# Backend
cd backend
bun install
bun run start:dev

# Frontend
cd frontend
bun install
bun run dev
```

## 🔒 Security Features

- HTTP-only session cookies
- BCrypt password hashing (12 rounds)
- CSRF protection via SameSite cookies
- Input validation and sanitization
- Role-based route guards

## 🏗️ Architecture Highlights

**Backend (NestJS):**
- Modular architecture (auth, users, guards, sessions)
- Custom authentication and authorization guards
- In-memory session storage
- Express-session integration

**Frontend (TanStack Start):**
- Protected routes with role-based access
- Cookie-based session management
- Clean API integration layer
- Responsive authentication flows

## 📝 API Endpoints

**Public:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

**Protected:**
- `GET /me` - Current user profile

**Admin Only:**
- `GET /admin/users` - List all users
- `PATCH /admin/users/:id/role` - Update user role

## 🧪 Testing the System

1. Register first user (becomes admin)
2. Register second user (becomes regular user)
3. Test admin access to user management
4. Verify session persistence and logout
5. Test role-based UI restrictions

## 📊 Known Limitations

- In-memory sessions (not production-ready)
- Sessions lost on server restart
- No refresh tokens or rate limiting
- Single session per user
- Two-role RBAC only

These limitations are **intentional** for the interview test scope.

## 🎓 Learning Objectives

This project demonstrates:
- Session-based authentication implementation
- Role-based access control patterns
- Security best practices in web applications
- Clean architecture principles
- Full-stack integration techniques

---

**Note:** This is an interview test project. The implementation prioritizes educational value and demonstrates core concepts rather than production scalability.# -islamic_affair_test_project-
