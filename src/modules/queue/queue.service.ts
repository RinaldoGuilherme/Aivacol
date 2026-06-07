import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export const RABBITMQ_CLIENT = 'RABBITMQ_CLIENT';

@Injectable()
export class QueueService {
  constructor(@Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy) {}

  async ping(): Promise<boolean> {
    await this.client.connect();
    return true;
  }

  emitTest(payload: Record<string, unknown>): void {
    this.client.emit('test.ping', payload);
  }
}
