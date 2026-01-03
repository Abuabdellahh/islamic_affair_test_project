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

    request.user = sessionData;
    return true;
  }
}