import { Module } from '@nestjs/common';
import { CacheModule } from '../modules/cache/cache.module';
import { QueueModule } from '../modules/queue/queue.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [CacheModule, QueueModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
