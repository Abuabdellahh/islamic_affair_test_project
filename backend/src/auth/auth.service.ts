import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SessionService } from '../sessions/session.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private sessionService: SessionService,
  ) {}

  async register(email: string, password: string): Promise<User> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    
    return this.usersService.create(email, password);
  }

  async login(email: string, password: string): Promise<{ user: User; sessionId: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !await this.usersService.validatePassword(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = await this.sessionService.createSession(user.id);
    return { user, sessionId };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.destroySession(sessionId);
  }

  async validateSession(sessionId: string): Promise<User | null> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) return null;

    return this.usersService.findById(session.userId);
  }
}