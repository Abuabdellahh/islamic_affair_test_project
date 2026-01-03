import { Controller, Post, Get, Body, Req, Res, UseGuards, Patch, Param } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('auth/register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.register(dto.email, dto.password);
    const { sessionId } = await this.authService.login(dto.email, dto.password);

    response.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    
    return {
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, role: user.role }
    };
  }

  @Post('auth/login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { user, sessionId } = await this.authService.login(dto.email, dto.password);

    response.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    
    return {
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role }
    };
  }

  @Post('auth/logout')
  @UseGuards(AuthGuard)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const sessionId = request.cookies?.sessionId;
    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    response.clearCookie('sessionId');
    return { message: 'Logout successful' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@Req() request: Request) {
    const user = request.user;
    return { id: user.id, email: user.email, role: user.role };
  }

  @Get('admin/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Patch('admin/users/:id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.usersService.updateRole(id, role);
  }
}