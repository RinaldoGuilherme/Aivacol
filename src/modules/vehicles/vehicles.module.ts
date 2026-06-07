import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleEntity } from './entities/vehicle.entity';
import { VehicleRepository } from './vehicle.repository';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { AuthModule } from '../auth/auth.module';
import { ModelsModule } from '../models/models.module';
import { QueueModule } from '../queue/queue.module';
import { CacheModule } from '../cache/cache.module';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleEntity, UserEntity]),
    AuthModule,
    ModelsModule,
    QueueModule,
    CacheModule,
  ],
  controllers: [VehicleController],
  providers: [VehicleService, VehicleRepository],
  exports: [VehicleService],
})
export class VehiclesModule {}
