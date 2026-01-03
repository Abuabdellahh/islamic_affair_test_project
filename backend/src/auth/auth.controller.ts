import { Controller, Post, Get, Body, Req, Res, UseGuards, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiCookieAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
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
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Login successful' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'b398d2b8-eafc-4b8e-9a48-9d6ab006db6f' },
            email: { type: 'string', example: 'admin@test.com' },
            role: { type: 'string', example: 'admin', enum: ['admin', 'user'] }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
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
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getCurrentUser(@Req() request: Request) {
    const user = request.user;
    return { id: user.id, email: user.email, role: user.role };
  }

  @Get('admin/users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('sessionId')
  @ApiTags('Admin')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Patch('admin/users/:id/role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiCookieAuth('sessionId')
  @ApiTags('Admin')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: ['user', 'admin'] } } } })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateUserRole(@Param('id') id: string, @Body('role') role: UserRole) {
    return this.usersService.updateRole(id, role);
  }
}