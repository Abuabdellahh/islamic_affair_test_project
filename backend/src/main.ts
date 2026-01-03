import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Simple memory session store for testing
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // CORS
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  console.log('Backend starting on port', process.env.PORT || 3001);
  await app.listen(process.env.PORT || 3001);
}

bootstrap();