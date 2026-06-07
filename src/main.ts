import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Aivacol Fleet API')
    .setDescription(
      'Backend API for fleet management with JWT authentication, relational persistence, asynchronous processing, audit logs, notifications and Redis cache.\n\n' +
        '**Authentication:** obtain an access token via `POST /api/auth/login`, then click **Authorize** and paste the token to authenticate all protected endpoints.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('APP_PORT', 3000);
  await app.listen(port);
  console.log(`API is running on: http://localhost:${port}`);
  console.log(`Swagger docs at: http://localhost:${port}/api/docs`);
}
bootstrap();
