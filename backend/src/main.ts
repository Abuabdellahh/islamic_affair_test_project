import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Session-Based Auth API')
    .setDescription(`Session-based authentication system with RBAC
    
**Test Credentials:**
- **Admin:** admin@test.com / password123
- **User:** user@test.com / password123`)
    .setVersion('1.0')
    .addCookieAuth('sessionId', {
      type: 'http',
      in: 'cookie',
      scheme: 'bearer',
    })
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3001);
  console.log('🚀 Server running on http://localhost:3001');
  console.log('📚 Swagger docs available at http://localhost:3001/api/docs');
}
bootstrap();