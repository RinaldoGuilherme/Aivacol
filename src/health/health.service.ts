import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { Connection } from 'mongoose';
import { DataSource } from 'typeorm';
import { CacheService } from '../modules/cache/cache.service';
import { QueueService } from '../modules/queue/queue.service';

type ServiceStatus = 'ok' | 'error';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
  ) {}

  async check() {
    const [database, mongo, redis, rabbitmq] = await Promise.all([
      this.checkDatabase(),
      this.checkMongo(),
      this.checkRedis(),
      this.checkRabbitmq(),
    ]);

    const services = {
      api: 'ok' as ServiceStatus,
      database,
      mongo,
      redis,
      rabbitmq,
    };

    const status = Object.values(services).every((value) => value === 'ok')
      ? 'ok'
      : 'error';

    return { status, services };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }

  private async checkMongo(): Promise<ServiceStatus> {
    return this.mongoConnection.readyState === 1 ? 'ok' : 'error';
  }

  private async checkRedis(): Promise<ServiceStatus> {
    try {
      const result = await this.cacheService.ping();
      return result === 'PONG' ? 'ok' : 'error';
    } catch {
      return 'error';
    }
  }

  private async checkRabbitmq(): Promise<ServiceStatus> {
    try {
      await this.queueService.ping();
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
