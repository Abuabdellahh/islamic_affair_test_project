# Session-Based Authentication System Architecture

## System Overview

A production-ready full-stack authentication system with role-based access control (RBAC) using:
- **Backend**: NestJS with TypeScript, PostgreSQL, Redis session store
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Infrastructure**: Docker Compose with health checks

## Architecture Components

### Backend (NestJS)
```
src/
├── main.ts                 # Application bootstrap with Redis session config
├── app.module.ts          # Root module with database and auth modules
├── auth/
│   ├── auth.module.ts     # Authentication module
│   ├── auth.service.ts    # Authentication business logic
│   ├── auth.controller.ts # Auth endpoints (register, login, logout)
│   ├── auth.guard.ts      # Session authentication guard
│   ├── roles.guard.ts     # Role-based authorization guard
│   ├── roles.decorator.ts # RBAC decorator
│   └── auth.dto.ts        # Validation DTOs
└── users/
    ├── users.module.ts    # Users module
    ├── users.service.ts   # User management service
    └── user.entity.ts     # User entity with roles
```

### Frontend (Next.js)
```
src/
├── app/
│   ├── layout.tsx         # Root layout with global styles
│   ├── page.tsx           # Dashboard (protected)
│   ├── login/page.tsx     # Authentication page
│   ├── admin/page.tsx     # Admin panel (admin-only)
│   └── globals.css        # Tailwind CSS with design tokens
├── components/ui/         # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── label.tsx
│   └── card.tsx
└── lib/
    ├── api.ts             # API client with session handling
    └── utils.ts           # Utility functions
```

## Authentication Flow

### 1. Registration/Login Flow
```
Client → POST /auth/register|login → NestJS Controller
                                   ↓
                            Auth Service validates
                                   ↓
                            Session created in Redis
                                   ↓
                            HTTP-only cookie set
                                   ↓
                            User data returned
```

### 2. Session Validation Flow
```
Client Request → Session Cookie → Express Session Middleware
                                        ↓
                                 Redis Session Store
                                        ↓
                                 Auth Guard validates
                                        ↓
                                 Request proceeds/rejected
```

### 3. Role-Based Access Control
```
Protected Route → Auth Guard → Roles Guard → Role Check
                                    ↓
                            User role from database
                                    ↓
                            Access granted/denied
```

## Security Implementation

### Session Management
- **Redis Store**: Persistent session storage with TTL
- **HTTP-only Cookies**: Prevents XSS attacks
- **SameSite**: CSRF protection
- **Secure Flag**: HTTPS-only in production
- **Session Regeneration**: On login/logout

### Password Security
- **BCrypt**: 12 rounds of hashing
- **Minimum Length**: 6 characters enforced
- **No password storage**: Only hashed versions

### API Security
- **CORS**: Configured for specific origins
- **Validation**: Class-validator for all inputs
- **Error Handling**: Sanitized error responses
- **Rate Limiting**: Ready for implementation

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('user', 'admin');
```

## API Endpoints

### Public Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Protected Endpoints
- `POST /auth/logout` - User logout
- `GET /me` - Current user profile

### Admin-Only Endpoints
- `GET /admin/users` - List all users
- `PATCH /admin/users/:id/role` - Update user role

## Frontend Routes

### Public Routes
- `/login` - Authentication page (register/login toggle)

### Protected Routes
- `/` - Dashboard (requires authentication)
- `/admin` - Admin panel (requires admin role)

## Docker Configuration

### Services
- **PostgreSQL 15**: Primary database with health checks
- **Redis 7**: Session store with persistence
- **Backend**: NestJS with hot reload
- **Frontend**: Next.js with hot reload

### Environment Variables
```env
# Backend
NODE_ENV=development
PORT=3001
SESSION_SECRET=your-super-secret-session-key-change-in-production-min-32-chars
DATABASE_URL=postgresql://auth_user:auth_password@postgres:5432/auth_db
REDIS_URL=redis://redis:6379

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Key Features

### Authentication
- Session-based (no JWT)
- Secure cookie handling
- Automatic session cleanup
- First user becomes admin

### Authorization
- Role-based access control
- Route-level protection
- Component-level role checks
- Admin user management

### UI/UX
- Responsive design
- Accessible components
- Loading states
- Error handling
- Form validation

### Development
- Hot reload for both services
- TypeScript throughout
- Docker development environment
- Health checks and dependencies

## Production Considerations

### Security Enhancements
- Rate limiting implementation
- HTTPS enforcement
- Session rotation
- Audit logging
- Input sanitization

### Scalability
- Redis Cluster for sessions
- Database connection pooling
- Load balancer configuration
- CDN for static assets

### Monitoring
- Health check endpoints
- Logging middleware
- Error tracking
- Performance monitoring

## Quick Start

```bash
# Start all services
docker compose up -d

# Access applications
Frontend: http://localhost:3000
Backend: http://localhost:3001

# First user registration becomes admin
# Subsequent users have 'user' role
```

This architecture provides a solid foundation for a production authentication system with proper separation of concerns, security best practices, and scalable design patterns.