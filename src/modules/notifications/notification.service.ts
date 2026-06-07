import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { NotificationRepository } from './notification.repository';
import { NotificationDocument } from './schemas/notification.schema';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import {
  VehicleEvent,
  VEHICLE_EVENTS,
} from '../queue/interfaces/vehicle-event.interface';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../../common/query/query.types';

/** API-facing notification representation (Mongo _id exposed as `id`). */
export interface NotificationView {
  id: string;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  /** Persists a user-scoped notification derived from an event (Worker only). */
  async createFromEvent(event: VehicleEvent): Promise<void> {
    const { title, message } = this.buildContent(event);
    await this.notificationRepository.create({
      userId: event.actor.id,
      type: event.event,
      title,
      message,
      read: false,
    });
  }

  async findAllForUser(
    userId: number,
    filters: NotificationFiltersDto,
  ): Promise<{ data: NotificationView[]; meta: PaginationMeta }> {
    const { data, total } = await this.notificationRepository.listForUser(
      userId,
      filters,
    );
    return {
      data: data.map((doc) => this.toView(doc)),
      meta: buildPaginationMeta(total, filters.page, filters.limit),
    };
  }

  async findOneForUser(id: string, userId: number): Promise<NotificationView> {
    const doc = await this.getOwned(id, userId);
    return this.toView(doc);
  }

  async markAsRead(id: string, userId: number): Promise<void> {
    await this.getOwned(id, userId);
    await this.notificationRepository.markAsRead(id);
  }

  /** Loads a notification enforcing that it belongs to the given user. */
  private async getOwned(
    id: string,
    userId: number,
  ): Promise<NotificationDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
    const doc = await this.notificationRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Notification #${id} not found`);
    }
    if (doc.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this notification',
      );
    }
    return doc;
  }

  private buildContent(event: VehicleEvent): {
    title: string;
    message: string;
  } {
    const plate = event.payload.licensePlate;
    switch (event.event) {
      case VEHICLE_EVENTS.CREATED:
        return {
          title: 'Veículo cadastrado',
          message: `O veículo ${plate} foi cadastrado com sucesso.`,
        };
      case VEHICLE_EVENTS.UPDATED:
        return {
          title: 'Veículo atualizado',
          message: `O veículo ${plate} foi atualizado com sucesso.`,
        };
      case VEHICLE_EVENTS.DELETED:
        return {
          title: 'Veículo removido',
          message: `O veículo ${plate} foi removido com sucesso.`,
        };
      default:
        return {
          title: 'Notificação',
          message: `Evento ${String(event.event)} processado.`,
        };
    }
  }

  private toView(doc: NotificationDocument): NotificationView {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      read: doc.read,
      createdAt: doc.createdAt,
    };
  }
}
