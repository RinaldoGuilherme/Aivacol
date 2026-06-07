import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validate } from './config/env.validation';
import { getMongoConfig } from './config/mongo.config';
import { VehicleEventsConsumer } from './modules/queue/consumers/vehicle-events.consumer';
import { AuditService } from './modules/audit/audit.service';
import { AuditRepository } from './modules/audit/audit.repository';
import {
  AuditLog,
  AuditLogSchema,
} from './modules/audit/schemas/audit-log.schema';
import { NotificationService } from './modules/notifications/notification.service';
import { NotificationRepository } from './modules/notifications/notification.repository';
import {
  Notification,
  NotificationSchema,
} from './modules/notifications/schemas/notification.schema';

/**
 * WorkerModule — bootstrap exclusivo do processo Worker.
 * Carrega apenas os módulos necessários para o consumo assíncrono:
 *  - ConfigModule  : validação e acesso às variáveis de ambiente
 *  - MongooseModule: persistência de Audit Logs e Notifications no MongoDB
 *  - VehicleEventsConsumer: consumidor da fila `vehicle_events`
 *
 * Não importa TypeORM (SQL Server), CacheModule (Redis), AuthModule nem
 * HealthModule — o Worker não expõe HTTP nem acessa o banco relacional. Os
 * serviços/repositórios de persistência são registrados diretamente para
 * evitar puxar os controllers HTTP (e suas dependências de autenticação).
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
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [VehicleEventsConsumer],
  providers: [
    AuditService,
    AuditRepository,
    NotificationService,
    NotificationRepository,
  ],
})
export class WorkerModule {}
