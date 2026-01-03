# Senior Full-Stack Developer Interview Test
## Session-Based Authentication System with RBAC

### 🎯 Interview Test Overview

**Problem Statement:**
Build a production-ready Session-Based Authentication System with Role-Based Access Control (RBAC) using NestJS backend and TanStack Start frontend. The system must implement secure session management without external authentication libraries.

**What You Must Build:**
- Complete authentication flow with session management
- Role-based access control (admin/user)
- Secure API endpoints with proper guards
- Frontend with protected routes and role-based UI

**Time Limit:** 5 hours

**Evaluation Focus:**
- Session-based authentication implementation (25%)
- RBAC correctness and security (25%)
- Code architecture and quality (20%)
- Security best practices (20%)
- Frontend-backend integration (10%)

---

## 📋 Technical Requirements (Mandatory)

### Core Stack
- **Backend:** NestJS with Express adapter
- **Frontend:** TanStack Start
- **Runtime:** Bun
- **Authentication:** Session-based only (NO JWT, NO Passport)
- **Authorization:** Role-Based Access Control

### Security Requirements
- HTTP-only cookies for session storage
- BCrypt password hashing
- Input validation and sanitization
- Same-site cookie configuration
- Session expiration handling

### Role Logic
- First registered user → `admin`
- All subsequent users → `user`
- Only admins can update user roles

### API Endpoints (Exact Match Required)

**Public Routes:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`

**Protected Routes (User):**
- `GET /me`

**Admin Routes:**
- `GET /admin/users`
- `PATCH /admin/users/:id/role`

### Known Limitations (Acknowledge, Don't Fix)
- In-memory sessions only
- Sessions lost on server restart
- No refresh tokens or rate limiting
- Single session per user

---

## 🏗️ Backend Solution (NestJS)

### Project Structure
```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── user.entity.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   ├── sessions/
│   │   ├── session.service.ts
│   │   └── session.module.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
└── Dockerfile
```

### Implementation Files

#### package.json
```json
{
  "name": "auth-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "bun run src/main.ts",
    "start:dev": "bun --watch src/main.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "express-session": "^1.17.3",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1"
  },
  "devDependencies": {
    "@types/express-session": "^1.17.10",
    "@types/bcrypt": "^5.0.2"
  }
}
```

#### src/main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Session configuration - HTTP-only cookies for security
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevents XSS attacks
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({ credentials: true, origin: 'http://localhost:3000' });
  
  await app.listen(3001);
}
bootstrap();
```

#### src/users/user.entity.ts
```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export class User {
  id: string;
  email: string;
  password: string; // BCrypt hashed
  role: UserRole;
  createdAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
```

#### src/users/users.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private userCounter = 1;

  async create(email: string, password: string): Promise<User> {
    // First user becomes admin, others become user
    const role = this.users.length === 0 ? UserRole.ADMIN : UserRole.USER;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      id: (this.userCounter++).toString(),
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    });

    this.users.push(user);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async updateRole(id: string, role: UserRole): Promise<User | undefined> {
    const user = await this.findById(id);
    if (user) {
      user.role = role;
    }
    return user;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
```

#### src/auth/auth.service.ts
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from '../sessions/session.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService
  ) {}

  async register(email: string, password: string): Promise<User> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    return this.usersService.create(email, password);
  }

  async login(email: string, password: string, sessionId: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await this.usersService.validatePassword(user, password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session
    this.sessionService.createSession(sessionId, user.id);
    return user;
  }

  async logout(sessionId: string): Promise<void> {
    this.sessionService.destroySession(sessionId);
  }

  async getCurrentUser(sessionId: string): Promise<User | undefined> {
    const userId = this.sessionService.getUserId(sessionId);
    if (!userId) return undefined;
    
    return this.usersService.findById(userId);
  }
}
```

#### src/sessions/session.service.ts
```typescript
import { Injectable } from '@nestjs/common';

interface Session {
  userId: string;
  createdAt: Date;
}

@Injectable()
export class SessionService {
  private sessions = new Map<string, Session>();

  createSession(sessionId: string, userId: string): void {
    // Single session per user - destroy existing sessions
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }

    this.sessions.set(sessionId, {
      userId,
      createdAt: new Date()
    });
  }

  getUserId(sessionId: string): string | undefined {
    const session = this.sessions.get(sessionId);
    return session?.userId;
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  isValidSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}
```

#### src/guards/auth.guard.ts
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.session.id;

    if (!sessionId) {
      throw new UnauthorizedException('No session found');
    }

    const user = await this.authService.getCurrentUser(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }

    request.user = user;
    return true;
  }
}
```

#### src/guards/roles.guard.ts
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

#### src/auth/auth.controller.ts
```typescript
import { Controller, Post, Body, Req, Res, HttpCode } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto.email, registerDto.password);
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const user = await this.authService.login(loginDto.email, loginDto.password, req.session.id);
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: any, @Res() res: any) {
    await this.authService.logout(req.session.id);
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
  }
}
```

#### src/users/users.controller.ts
```typescript
import { Controller, Get, Patch, Param, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';

class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    const { password, ...user } = req.user;
    return user;
  }

  @Get('admin/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map(({ password, ...user }) => user);
  }

  @Patch('admin/users/:id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const user = await this.usersService.updateRole(id, updateRoleDto.role);
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

#### backend/Dockerfile
```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

EXPOSE 3001

CMD ["bun", "run", "start:dev"]
```

---

## 🎨 Frontend Solution (TanStack Start)

### Project Structure
```
frontend/
├── app/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── dashboard.tsx
│   │   └── admin/
│   │       └── users.tsx
│   ├── components/
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   └── lib/
│       ├── api.ts
│       └── auth.ts
├── package.json
└── Dockerfile
```

### Implementation Files

#### package.json
```json
{
  "name": "auth-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start"
  },
  "dependencies": {
    "@tanstack/start": "^1.0.0",
    "@tanstack/react-router": "^1.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "vinxi": "^0.3.0"
  }
}
```

#### app/lib/api.ts
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async register(email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getProfile() {
    return this.request('/me');
  }

  async getUsers() {
    return this.request('/admin/users');
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }
}

export const api = new ApiClient();
```

#### app/lib/auth.ts
```typescript
import { api } from './api';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

class AuthManager {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  subscribe(listener: (user: User | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.user));
  }

  async checkAuth(): Promise<User | null> {
    try {
      this.user = await api.getProfile();
      this.notify();
      return this.user;
    } catch {
      this.user = null;
      this.notify();
      return null;
    }
  }

  async login(email: string, password: string): Promise<User> {
    this.user = await api.login(email, password);
    this.notify();
    return this.user;
  }

  async logout(): Promise<void> {
    await api.logout();
    this.user = null;
    this.notify();
  }

  getUser(): User | null {
    return this.user;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }
}

export const auth = new AuthManager();
```

#### app/components/ProtectedRoute.tsx
```typescript
import { useEffect, useState } from 'react';
import { auth, User } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.subscribe(setUser);
    auth.checkAuth().finally(() => setLoading(false));
    return unsubscribe;
  }, []);

  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <div>Admin access required.</div>;
  }

  return <>{children}</>;
}
```

#### app/routes/login.tsx
```typescript
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { auth } from '../lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.login(email, password);
      navigate({ to: '/dashboard' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '2rem' }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: '0.5rem' }}>
          Login
        </button>
      </form>
    </div>
  );
}
```

#### app/routes/dashboard.tsx
```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';
import { auth } from '../lib/auth';

export default function Dashboard() {
  const user = auth.getUser();

  return (
    <ProtectedRoute>
      <div style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p>Welcome, {user?.email}!</p>
        <p>Role: {user?.role}</p>
        
        {auth.isAdmin() && (
          <div style={{ marginTop: '2rem' }}>
            <h2>Admin Actions</h2>
            <a href="/admin/users">Manage Users</a>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

#### frontend/Dockerfile
```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]
```

---

## 🔍 Interview Questions

### Architecture & Reasoning (5 questions)

1. **Session Management:** "Explain why you chose in-memory session storage and what are the trade-offs compared to Redis or database storage?"

2. **Security Design:** "Walk me through the security measures you implemented. Why HTTP-only cookies instead of localStorage?"

3. **Role Assignment Logic:** "Explain the first-user-becomes-admin logic. How would you modify this for a multi-tenant system?"

4. **Guard Implementation:** "Describe the difference between AuthGuard and RolesGuard. Why use two separate guards?"

5. **Frontend State Management:** "How does your frontend handle session state? What happens when the session expires?"

### Edge Cases (2 scenarios)

1. **Concurrent Registration:** "What happens if two users register simultaneously when no admin exists yet? How would you handle this race condition?"

2. **Session Hijacking:** "If someone steals a session cookie, what protections are in place? How would you detect and prevent this?"

### Security Discussion (2 questions)

1. **CSRF Protection:** "Explain how your SameSite cookie configuration protects against CSRF attacks. What additional measures would you add?"

2. **Password Security:** "Why BCrypt with salt rounds of 12? How would you handle password policy enforcement?"

### Scalability Discussion (1 question)

1. **Production Scaling:** "How would you migrate from in-memory sessions to Redis? What changes would be needed in your session service and deployment strategy?"

---

## 📊 Evaluation Rubric

### Session-Based Authentication Logic (25%)
- **Excellent (23-25):** Perfect session creation, validation, and cleanup
- **Good (18-22):** Minor issues with session handling
- **Fair (13-17):** Basic session functionality with some gaps
- **Poor (0-12):** Significant authentication flaws

### RBAC Correctness & Security (25%)
- **Excellent (23-25):** Proper role assignment, guard implementation, secure endpoints
- **Good (18-22):** Minor role logic issues
- **Fair (13-17):** Basic RBAC with security gaps
- **Poor (0-12):** Broken or insecure authorization

### Code Architecture & Quality (20%)
- **Excellent (18-20):** Clean separation of concerns, proper NestJS patterns
- **Good (14-17):** Good structure with minor architectural issues
- **Fair (10-13):** Functional but poorly organized
- **Poor (0-9):** Poor code quality and structure

### Security Best Practices (20%)
- **Excellent (18-20):** BCrypt, HTTP-only cookies, input validation, CSRF protection
- **Good (14-17):** Most security measures implemented
- **Fair (10-13):** Basic security with some vulnerabilities
- **Poor (0-9):** Major security flaws

### Frontend-Backend Integration (10%)
- **Excellent (9-10):** Seamless integration, proper error handling
- **Good (7-8):** Good integration with minor issues
- **Fair (5-6):** Basic functionality works
- **Poor (0-4):** Integration problems or non-functional

**Total Score: ___/100**

**Minimum Passing Score: 70/100**

---

## 🚀 Getting Started

1. **Setup:**
   ```bash
   docker-compose up -d
   ```

2. **Test the System:**
   - Register first user (becomes admin)
   - Register second user (becomes user)
   - Test role-based access
   - Verify session persistence

3. **Key Testing Points:**
   - Session cookies are HTTP-only
   - Admin can access `/admin/users`
   - Regular users cannot access admin routes
   - Logout destroys session properly

**Expected Completion Time:** 4-6 hours for a senior developer