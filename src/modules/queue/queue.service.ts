import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { VehicleEvent } from './interfaces/vehicle-event.interface';

export const RABBITMQ_CLIENT = 'RABBITMQ_CLIENT';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@Inject(RABBITMQ_CLIENT) private readonly client: ClientProxy) {}

  async ping(): Promise<boolean> {
    await this.client.connect();
    return true;
  }

  /**
   * Publishes a vehicle domain event to the `vehicle_events` queue using the
   * event name as the routing pattern. Resolves once the message has been
   * dispatched to the broker. `emit` returns a cold Observable, so we subscribe
   * (via a Promise) to guarantee the message is actually sent.
   */
  async publishVehicleEvent(event: VehicleEvent): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client.emit(event.event, event).subscribe({
        error: (err) => reject(err),
        complete: () => resolve(),
      });
    });
    this.logger.log(
      `Published ${event.event} for ${event.entity}#${event.entityId}`,
    );
  }
}
