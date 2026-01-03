# 🎯 Session-Based Authentication Interview Test

## Test Overview
**Duration:** 5 hours  
**Level:** Senior Full-Stack Developer  
**Stack:** NestJS + TanStack Start + Bun + TypeScript  

Build a secure session-based authentication system with RBAC. No JWT, no Passport, no external auth libraries.

## Requirements Checklist
- [ ] Session-based authentication (HTTP-only cookies)
- [ ] First user becomes admin, others become users
- [ ] Protected routes with role-based access
- [ ] BCrypt password hashing
- [ ] Clean NestJS architecture
- [ ] TanStack Start frontend with TypeScript

---

## Backend Implementation

### 1. Main Configuration (src/main.ts)
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.use(session({
    secret: 'session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3001);
}
bootstrap();
```

### 2. User Entity (src/users/user.entity.ts)
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
}
```

### 3. Session Service (src/sessions/session.service.ts)
```typescript
@Injectable()
export class SessionService {
  private sessions = new Map<string, any>();

  createSession(sessionId: string, userData: any): void {
    this.sessions.set(sessionId, userData);
  }

  getSession(sessionId: string): any {
    return this.sessions.get(sessionId);
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
```

### 4. Auth Service (src/auth/auth.service.ts)
```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService,
  ) {}

  async register(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const isFirstUser = this.usersService.count() === 0;
    
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      role: isFirstUser ? UserRole.ADMIN : UserRole.USER,
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string, sessionId: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.sessionService.createSession(sessionId, {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { id: user.id, email: user.email, role: user.role };
  }
}
```

### 5. Auth Controller (src/auth/auth.controller.ts)
```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: { email: string; password: string }) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: { email: string; password: string }, @Req() req) {
    return this.authService.login(dto.email, dto.password, req.session.id);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req) {
    req.session.destroy();
    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@Req() req) {
    return req.user;
  }
}
```

### 6. Guards (src/guards/)
```typescript
// auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const sessionData = this.sessionService.getSession(request.session.id);
    
    if (!sessionData) {
      throw new UnauthorizedException('Invalid session');
    }

    request.user = sessionData;
    return true;
  }
}

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest();
    return roles.includes(request.user.role);
  }
}
```

---

## Frontend Implementation

### 1. API Client (app/lib/api.ts)
```typescript
const API_BASE = 'http://localhost:3001';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!response.ok) throw new Error('Request failed');
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
}

export const api = new ApiClient();
```

### 2. Auth Context (app/lib/auth.tsx)
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const userData = await api.login(email, password);
    setUser(userData);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  useEffect(() => {
    api.getProfile().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. Protected Route (app/components/ProtectedRoute.tsx)
```typescript
export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return <>{children}</>;
}
```

### 4. Login Page (app/routes/login.tsx)
```typescript
export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      await login(
        formData.get('email') as string,
        formData.get('password') as string
      );
      navigate({ to: '/dashboard' });
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Interview Questions

### Architecture (5 Questions)
1. **Session vs JWT**: Why session-based auth over JWT? Security implications?
2. **Role Logic**: How to support multiple admins or role hierarchies?
3. **Session Security**: Additional production security measures?
4. **Multi-Device**: Handle users logging in from multiple devices?
5. **Scalability**: Migrate from in-memory to Redis sessions?

### Security (2 Questions)
6. **Password Security**: BCrypt configuration and additional measures?
7. **CSRF Protection**: How SameSite protects, additional measures?

### Edge Cases (2 Scenarios)
8. **Server Restart**: Session persistence across restarts?
9. **Role Conflicts**: Admin updating their own role to user?

## Evaluation Rubric

| Criteria | Weight | Excellent | Good | Needs Work |
|----------|--------|-----------|------|------------|
| Session Auth | 25% | HTTP-only cookies, proper config | Basic working | Security issues |
| RBAC | 25% | Guards, role logic correct | Minor issues | Incomplete |
| Architecture | 20% | Clean NestJS structure | Good structure | Poor structure |
| Security | 20% | BCrypt, validation, error handling | Most practices | Missing measures |
| Integration | 10% | Cookie handling, role UI | Working integration | Basic integration |

### Success Indicators:
- ✅ No JWT/external auth libraries
- ✅ HTTP-only cookies implemented
- ✅ First user becomes admin
- ✅ Role-based protection
- ✅ BCrypt password hashing
- ✅ Clean, maintainable code

## Known Limitations (Acknowledged)
- In-memory sessions (not production-ready)
- Sessions lost on server restart
- No refresh tokens or rate limiting
- Single session per user
- Two-role RBAC only

These limitations are **intentional** for the interview test scope.