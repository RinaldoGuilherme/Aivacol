import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validate } from './config/env.validation';
import { getMongoConfig } from './config/mongo.config';
import { QueueModule } from './modules/queue/queue.module';

/**
 * WorkerModule — bootstrap exclusivo do processo Worker.
 * Carrega apenas os módulos necessários para processamento assíncrono:
 *  - ConfigModule  : validação e acesso às variáveis de ambiente
 *  - MongooseModule: persistência de auditoria/eventos no MongoDB
 *  - QueueModule   : ClientProxy RabbitMQ para publicação de eventos futuros
 *
 * Não importa TypeORM (SQL Server), CacheModule (Redis) nem HealthModule,
 * pois o Worker não expõe endpoints HTTP nem acessa o banco relacional ainda.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getMongoConfig,
      inject: [ConfigService],
    }),
    QueueModule,
  ],
})
export class WorkerModule {}
