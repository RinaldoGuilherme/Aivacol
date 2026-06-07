import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notifications/notification.service';
import {
  VehicleEvent,
  VEHICLE_EVENTS,
} from '../interfaces/vehicle-event.interface';

/**
 * Minimal subset of the amqplib channel/message used for manual ack/nack.
 * Declared locally to avoid depending on `@types/amqplib`.
 */
interface RmqChannel {
  ack(message: unknown): void;
  nack(message: unknown, allUpTo: boolean, requeue: boolean): void;
}

/**
 * Worker-side consumer of the `vehicle_events` queue.
 *
 * Processes one message at a time (prefetch=1, configured in worker.ts) and
 * acknowledges only after both the audit log and the notification have been
 * persisted. On failure it NACKs without requeue and logs the error.
 */
@Controller()
export class VehicleEventsConsumer {
  private readonly logger = new Logger(VehicleEventsConsumer.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  @EventPattern(VEHICLE_EVENTS.CREATED)
  async handleCreated(
    @Payload() event: VehicleEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(event, context);
  }

  @EventPattern(VEHICLE_EVENTS.UPDATED)
  async handleUpdated(
    @Payload() event: VehicleEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(event, context);
  }

  @EventPattern(VEHICLE_EVENTS.DELETED)
  async handleDeleted(
    @Payload() event: VehicleEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.process(event, context);
  }

  private async process(
    event: VehicleEvent,
    context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RmqChannel;
    const originalMsg = context.getMessage();

    try {
      await this.auditService.createFromEvent(event);
      await this.notificationService.createFromEvent(event);
      channel.ack(originalMsg);
      this.logger.log(
        `Processed ${event.event} for ${event.entity}#${event.entityId} ` +
          `(audit log + notification created, ack sent)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process ${event?.event}: ${message}. NACK without requeue.`,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}
