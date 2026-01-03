import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { SessionService } from '../sessions/session.service';
import { Session } from '../sessions/session.entity';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Session])],
  controllers: [AuthController],
  providers: [AuthService, SessionService, AuthGuard, RolesGuard],
  exports: [AuthService, AuthGuard, RolesGuard]
})
export class AuthModule {}