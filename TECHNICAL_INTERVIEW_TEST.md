# 🎯 Technical Interview Test: Session-Based Authentication with RBAC

## Interview Test Overview

**Position:** Senior Full-Stack Developer  
**Duration:** 5 hours  
**Technology Stack:** NestJS + TanStack Start + Bun  

### Problem Statement

Build a secure session-based authentication system with role-based access control. The system must handle user registration, login, logout, and role-based route protection without using JWT or external authentication libraries.

### What You Must Build

1. **Backend (NestJS):** Session-based auth API with RBAC
2. **Frontend (TanStack Start):** Protected routes with role-based UI
3. **Security:** HTTP-only cookies, BCrypt hashing, input validation

### Time Allocation Recommendation
- Backend implementation: 3 hours
- Frontend implementation: 1.5 hours  
- Testing & integration: 30 minutes

## 🔧 Technical Requirements

### Authentication Rules
- ✅ Session-based authentication (NO JWT, NO Passport)
- ✅ HTTP-only cookies for session storage
- ✅ BCrypt password hashing (12 rounds minimum)
- ✅ In-memory session storage
- ✅ First user becomes admin, others become user

### API Endpoints (Must Match Exactly)
```
Public:
POST /auth/register
POST /auth/login  
POST /auth/logout

Protected:
GET /me

Admin Only:
GET /admin/users
PATCH /admin/users/:id/role
```

### Role Logic
- `admin`: Full system access
- `user`: Limited access  
- Only admins can update user roles

## 📊 Evaluation Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| Session Authentication | 25% | Correct session implementation, no JWT |
| RBAC Implementation | 25% | Role assignment, guards, route protection |
| Code Architecture | 20% | Clean structure, separation of concerns |
| Security Practices | 20% | HTTP-only cookies, BCrypt, validation |
| Frontend Integration | 10% | Cookie handling, protected routes |

### Scoring Levels
- **90-100%:** Senior level - Production ready, excellent architecture
- **75-89%:** Mid-Senior - Good implementation, minor improvements needed
- **60-74%:** Mid level - Functional but needs architectural improvements
- **Below 60%:** Not meeting requirements

## 🚫 Known Limitations (Do NOT Fix These)

These are intentional limitations for the interview scope:
- In-memory sessions (not production-ready)
- Sessions lost on server restart
- No refresh tokens or rate limiting
- Single session per user
- Two-role RBAC only

## 🎯 Success Criteria

### Must Have
- [x] Session-based authentication working
- [x] Role-based access control functional
- [x] HTTP-only cookies implemented
- [x] BCrypt password hashing
- [x] All API endpoints working
- [x] Frontend role-based UI

### Bonus Points
- Clean error handling
- Input validation
- Proper TypeScript usage
- Good code organization
- Security best practices

---

# 🔨 Complete Backend Solution (NestJS)

## Project Structure
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
│   │   └── session.service.ts
│   ├── app.module.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

## Implementation Files

### package.json
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
    "@types/bcrypt": "^5.0.2",
    "typescript": "^5.0.0"
  }
}
```

### src/main.ts
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // Session configuration
  app.use(
    session({
      secret: 'interview-test-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
```

### src/users/user.entity.ts
```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
```

### src/sessions/session.service.ts
```typescript
import { Injectable } from '@nestjs/common';

interface SessionData {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class SessionService {
  private sessions = new Map<string, SessionData>();

  createSession(sessionId: string, userData: SessionData): void {
    this.sessions.set(sessionId, userData);
  }

  getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Clear all sessions for a user (single session per user)
  clearUserSessions(userId: string): void {
    for (const [sessionId, data] of this.sessions.entries()) {
      if (data.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
```

### src/users/users.service.ts
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private userIdCounter = 1;

  async create(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // First user becomes admin
    const role = this.users.length === 0 ? UserRole.ADMIN : UserRole.USER;
    
    const user = new User({
      id: this.userIdCounter.toString(),
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    });
    
    this.users.push(user);
    this.userIdCounter++;
    
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  findAll(): User[] {
    return this.users.map(user => ({ ...user, password: undefined }));
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.role = role;
    return { ...user, password: undefined };
  }
}
```

### src/guards/auth.guard.ts
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionService } from '../sessions/session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.session?.id;

    if (!sessionId) {
      throw new UnauthorizedException('No session found');
    }

    const sessionData = this.sessionService.getSession(sessionId);
    if (!sessionData) {
      throw new UnauthorizedException('Invalid session');
    }

    // Attach user data to request
    request.user = sessionData;
    return true;
  }
}
```

### src/guards/roles.guard.ts
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### src/auth/auth.service.ts
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from '../sessions/session.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService,
  ) {}

  async register(email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = await this.usersService.create(email, password);
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string, sessionId: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await this.usersService.validatePassword(user, password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Clear existing sessions for this user (single session per user)
    this.sessionService.clearUserSessions(user.id);

    // Create new session
    this.sessionService.createSession(sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  logout(sessionId: string) {
    this.sessionService.destroySession(sessionId);
  }
}
```

### src/auth/auth.controller.ts
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
    return this.authService.register(registerDto.email, registerDto.password);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const user = await this.authService.login(
      loginDto.email,
      loginDto.password,
      req.session.id,
    );
    return user;
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: any) {
    this.authService.logout(req.session.id);
    req.session.destroy();
    return { message: 'Logged out successfully' };
  }
}
```

### src/users/users.controller.ts
```typescript
import { Controller, Get, Patch, Param, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { UsersService } from './users.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
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
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Get('admin/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Patch('admin/users/:id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateUserRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }
}
```

### src/app.module.ts
```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionService } from './sessions/session.service';

@Module({
  imports: [AuthModule, UsersModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class AppModule {}
```

### src/auth/auth.module.ts
```typescript
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { SessionService } from '../sessions/session.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService],
})
export class AuthModule {}
```

### src/users/users.module.ts
```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SessionService } from '../sessions/session.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, SessionService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

# 🎨 Complete Frontend Solution (TanStack Start)

## Project Structure
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
└── app.config.ts
```

## Implementation Files

### package.json
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
    "@tanstack/react-router": "^1.0.0",
    "@tanstack/start": "^1.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "vinxi": "^0.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### app.config.ts
```typescript
import { defineConfig } from '@tanstack/start/config';

export default defineConfig({
  server: {
    preset: 'bun',
  },
});
```

### app/lib/api.ts
```typescript
const API_BASE = 'http://localhost:3001';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
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

### app/lib/auth.ts
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

  async register(email: string, password: string): Promise<User> {
    this.user = await api.register(email, password);
    this.notify();
    return this.user;
  }

  async logout() {
    await api.logout();
    this.user = null;
    this.notify();
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }
}

export const auth = new AuthManager();
```

### app/components/Layout.tsx
```tsx
import { Link } from '@tanstack/react-router';
import { auth, User } from '../lib/auth';
import { useState, useEffect } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    auth.checkAuth();
    return auth.subscribe(setUser);
  }, []);

  const handleLogout = async () => {
    await auth.logout();
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '20px' }}>
      <nav style={{ marginBottom: '20px', padding: '10px', borderBottom: '1px solid #ccc' }}>
        <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
        
        {user ? (
          <>
            <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
            {user.role === 'admin' && (
              <Link to="/admin/users" style={{ marginRight: '10px' }}>Users</Link>
            )}
            <span style={{ marginRight: '10px' }}>
              {user.email} ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      
      <main>{children}</main>
    </div>
  );
}
```

### app/components/ProtectedRoute.tsx
```tsx
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
    auth.checkAuth().finally(() => setLoading(false));
    return auth.subscribe(setUser);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return <>{children}</>;
}
```

### app/routes/__root.tsx
```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Layout } from '../components/Layout';

export const Route = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
```

### app/routes/index.tsx
```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div>
      <h1>Session-Based Auth Demo</h1>
      <p>A secure authentication system with role-based access control.</p>
      <ul>
        <li>Session-based authentication (no JWT)</li>
        <li>HTTP-only cookies</li>
        <li>BCrypt password hashing</li>
        <li>Role-based access control</li>
      </ul>
    </div>
  );
}
```

### app/routes/login.tsx
```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { auth } from '../lib/auth';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await auth.login(email, password);
      navigate({ to: '/dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### app/routes/register.tsx
```tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { auth } from '../lib/auth';

export const Route = createFileRoute('/register')({
  component: Register,
});

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await auth.register(email, password);
      navigate({ to: '/dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Note: First user becomes admin, others become regular users.
      </p>
    </div>
  );
}
```

### app/routes/dashboard.tsx
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>
        <h2>Dashboard</h2>
        <p>Welcome to your protected dashboard!</p>
        <p>This page is only accessible to authenticated users.</p>
      </div>
    </ProtectedRoute>
  );
}
```

### app/routes/admin/users.tsx
```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsers,
});

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      await loadUsers(); // Reload users
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div>
        <h2>User Management</h2>
        {loading && <p>Loading users...</p>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        
        {!loading && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ccc' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{user.email}</td>
                  <td style={{ padding: '10px' }}>{user.role}</td>
                  <td style={{ padding: '10px' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      style={{ padding: '4px' }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedRoute>
  );
}
```

---

# 🎤 Interview Questions

## Architecture & Design Questions

### 1. Session vs JWT Trade-offs
**Question:** "Explain why you chose session-based authentication over JWT for this system. What are the security implications of each approach?"

**Expected Answer:**
- Sessions: Server-side storage, automatic expiration, easier revocation
- JWT: Stateless, scalable, but harder to revoke
- Security: HTTP-only cookies prevent XSS, sessions allow immediate revocation
- Trade-offs: Sessions require server memory, JWTs are larger and harder to invalidate

### 2. Role Assignment Logic
**Question:** "Walk me through your role assignment strategy. How would you modify it to support multiple admin users or role hierarchies?"

**Expected Answer:**
- First user becomes admin (simple bootstrap)
- Subsequent users are regular users
- For multiple admins: Add admin invitation system or super-admin role
- For hierarchies: Implement role permissions matrix or tree structure

### 3. Session Security
**Question:** "Explain the security measures you implemented for session management. What additional security would you add for production?"

**Expected Answer:**
- HTTP-only cookies prevent XSS access
- SameSite prevents CSRF attacks
- BCrypt with 12 rounds for password hashing
- Production additions: HTTPS, session rotation, rate limiting, audit logs

## Edge Cases & Problem Solving

### 4. Concurrent Login Scenario
**Question:** "What happens if a user logs in from multiple devices? How would you handle this requirement change?"

**Expected Answer:**
- Current: Single session per user (new login destroys old session)
- Multiple devices: Store array of sessions per user
- Implementation: Modify session service to track multiple sessions
- Considerations: Session limits, device identification

### 5. Session Persistence
**Question:** "Your sessions are in-memory. How would you migrate to Redis while maintaining the same API?"

**Expected Answer:**
- Replace Map with Redis client
- Maintain same SessionService interface
- Handle Redis connection failures
- Consider session serialization/deserialization
- Add session TTL management

## Security Deep Dive

### 6. Password Security
**Question:** "Justify your BCrypt configuration. What other password security measures would you implement?"

**Expected Answer:**
- 12 rounds balances security vs performance
- Additional measures: Password complexity rules, breach checking, MFA
- Consider: Argon2 as alternative, password history, account lockout

### 7. CSRF Protection
**Question:** "How does your current implementation protect against CSRF? What additional measures would you add?"

**Expected Answer:**
- SameSite cookies provide basic CSRF protection
- Additional: CSRF tokens, Origin header validation
- Double-submit cookie pattern for enhanced security

---

# 📊 Detailed Evaluation Rubric

## Session Authentication Implementation (25%)

### Excellent (23-25 points)
- ✅ Proper express-session configuration
- ✅ HTTP-only cookies implemented
- ✅ Session creation/destruction working
- ✅ Single session per user enforced
- ✅ Clean session service abstraction

### Good (18-22 points)
- ✅ Basic session functionality working
- ✅ HTTP-only cookies implemented
- ⚠️ Minor configuration issues
- ⚠️ Session cleanup could be improved

### Needs Improvement (10-17 points)
- ⚠️ Sessions working but with security issues
- ❌ Missing HTTP-only or SameSite configuration
- ❌ Session management incomplete

### Unacceptable (0-9 points)
- ❌ JWT used instead of sessions
- ❌ Sessions not working
- ❌ Major security vulnerabilities

## RBAC Implementation (25%)

### Excellent (23-25 points)
- ✅ First user becomes admin logic correct
- ✅ Role-based guards implemented properly
- ✅ Admin-only endpoints protected
- ✅ Frontend role-based UI restrictions
- ✅ Role update functionality working

### Good (18-22 points)
- ✅ Basic RBAC working
- ✅ Role assignment correct
- ⚠️ Minor issues with guard implementation
- ⚠️ Frontend restrictions could be better

### Needs Improvement (10-17 points)
- ⚠️ RBAC partially working
- ❌ Role assignment logic incorrect
- ❌ Guards not properly implemented

### Unacceptable (0-9 points)
- ❌ No RBAC implementation
- ❌ Security bypasses possible
- ❌ Roles not enforced

## Code Architecture & Quality (20%)

### Excellent (18-20 points)
- ✅ Clean separation of concerns
- ✅ Proper NestJS module structure
- ✅ Good TypeScript usage
- ✅ Consistent error handling
- ✅ Code is readable and maintainable

### Good (14-17 points)
- ✅ Generally well-structured
- ✅ Good use of NestJS patterns
- ⚠️ Some architectural improvements needed
- ⚠️ Minor code quality issues

### Needs Improvement (8-13 points)
- ⚠️ Basic structure present
- ❌ Poor separation of concerns
- ❌ Inconsistent patterns

### Unacceptable (0-7 points)
- ❌ Poor code organization
- ❌ Major architectural issues
- ❌ Code difficult to understand

## Security Best Practices (20%)

### Excellent (18-20 points)
- ✅ BCrypt with appropriate rounds
- ✅ Input validation implemented
- ✅ HTTP-only cookies configured
- ✅ SameSite cookie protection
- ✅ No password exposure in responses

### Good (14-17 points)
- ✅ Basic security measures in place
- ✅ Password hashing implemented
- ⚠️ Some security configurations missing
- ⚠️ Input validation could be improved

### Needs Improvement (8-13 points)
- ⚠️ Some security measures present
- ❌ Weak password handling
- ❌ Missing important security headers

### Unacceptable (0-7 points)
- ❌ Plain text passwords
- ❌ Major security vulnerabilities
- ❌ No security considerations

## Frontend Integration (10%)

### Excellent (9-10 points)
- ✅ Cookie-based auth working
- ✅ Protected routes implemented
- ✅ Role-based UI restrictions
- ✅ Clean API integration
- ✅ Proper error handling

### Good (7-8 points)
- ✅ Basic integration working
- ✅ Authentication flows functional
- ⚠️ Minor UI or integration issues

### Needs Improvement (4-6 points)
- ⚠️ Partial integration
- ❌ Some auth flows not working
- ❌ Poor error handling

### Unacceptable (0-3 points)
- ❌ Frontend not working
- ❌ No integration with backend
- ❌ Major functionality missing

---

## Final Scoring

**Total Score: ___/100**

### Grade Interpretation
- **90-100:** Senior Level - Ready for production, excellent architecture
- **75-89:** Mid-Senior Level - Good implementation, minor improvements needed  
- **60-74:** Mid Level - Functional but needs architectural improvements
- **Below 60:** Does not meet requirements

### Key Success Indicators
1. **No JWT or Passport used** (Automatic fail if violated)
2. **Session-based auth working correctly**
3. **RBAC properly implemented**
4. **Security best practices followed**
5. **Clean, maintainable code structure**

This interview test evaluates both technical implementation skills and understanding of security principles essential for senior full-stack development roles.