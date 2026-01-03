import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Session } from './session.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  async createSession(userId: string): Promise<string> {
    // Single session per user - remove existing
    await this.sessionRepository.delete({ userId });

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = this.sessionRepository.create({
      id: sessionId,
      userId,
      data: { userId },
      expiresAt,
    });

    await this.sessionRepository.save(session);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionRepository.findOne({ 
      where: { id: sessionId } 
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.sessionRepository.delete({ id: sessionId });
      return null;
    }

    return session;
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete({ id: sessionId });
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}