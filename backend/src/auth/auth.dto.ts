import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@test.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@test.com', description: 'Admin: admin@test.com | User: user@test.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Password for both test accounts' })
  @IsString()
  password: string;
}