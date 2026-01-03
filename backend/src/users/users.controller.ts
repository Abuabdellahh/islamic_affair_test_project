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