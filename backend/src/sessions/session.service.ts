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

  clearUserSessions(userId: string): void {
    for (const [sessionId, data] of this.sessions.entries()) {
      if (data.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }
}