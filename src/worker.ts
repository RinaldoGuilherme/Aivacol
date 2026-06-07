import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './config/env.validation';
import { WorkerModule } from './worker.module';

// Módulo mínimo (sem Mongoose, sem RabbitMQ client) apenas para resolver
// ConfigService antes do bootstrap do microservice. Evita abrir conexões de
// rede durante a fase de leitura de configuração.
@Module({ imports: [ConfigModule.forRoot({ isGlobal: false, validate })] })
class ConfigBootstrapModule {}

async function bootstrap() {
  // NestFactory.createMicroservice exige as opções de transporte no momento do
  // bootstrap, antes do container DI estar disponível. Usamos um contexto mínimo
  // (apenas ConfigModule) para obter as variáveis via ConfigService — com
  // validação garantida pelo env.validation.ts — sem abrir conexões de rede.
  const configContext = await NestFactory.createApplicationContext(
    ConfigBootstrapModule,
    { logger: false },
  );
  const configService = configContext.get(ConfigService);
  const rabbitmqUrl = configService.getOrThrow<string>('RABBITMQ_URL');
  const rabbitmqQueue = configService.getOrThrow<string>('RABBITMQ_QUEUE');
  await configContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    WorkerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: rabbitmqQueue,
        queueOptions: {
          durable: true,
        },
        // Process one message at a time and acknowledge manually only after the
        // audit log and notification have been persisted (see the consumer).
        prefetchCount: 1,
        noAck: false,
      },
    },
  );

  await app.listen();
  console.log('Worker is running and listening to RabbitMQ...');
}
bootstrap();
