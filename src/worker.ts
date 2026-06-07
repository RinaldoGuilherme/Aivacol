import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const context = await NestFactory.createApplicationContext(AppModule);
  const configService = context.get(ConfigService);

  const user = configService.get<string>('RABBITMQ_USER');
  const password = configService.get<string>('RABBITMQ_PASSWORD');
  const host = configService.get<string>('RABBITMQ_HOST');
  const port = configService.get<string>('RABBITMQ_PORT');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://${user}:${password}@${host}:${port}`],
      queue: 'main_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.listen();
  console.log('Worker is running and listening to RabbitMQ...');
}
bootstrap();
