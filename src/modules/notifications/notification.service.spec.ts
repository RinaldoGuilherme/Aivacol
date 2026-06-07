import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationDocument } from './schemas/notification.schema';
import { NotificationFiltersDto } from './dto/notification-filters.dto';
import {
  VehicleEvent,
  VEHICLE_EVENTS,
} from '../queue/interfaces/vehicle-event.interface';

const VALID_ID = '507f1f77bcf86cd799439011';

const buildDoc = (overrides: Partial<NotificationDocument> = {}) =>
  ({
    _id: { toString: () => VALID_ID },
    userId: 1,
    type: VEHICLE_EVENTS.CREATED,
    title: 'Veículo cadastrado',
    message: 'O veículo BRA2E19 foi cadastrado com sucesso.',
    read: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as unknown as NotificationDocument;

const buildEvent = (): VehicleEvent => ({
  event: VEHICLE_EVENTS.CREATED,
  entity: 'vehicle',
  entityId: 10,
  actor: { id: 7, nickname: 'op', name: 'Op', email: 'op@x.com', role: 'OPERATOR' },
  payload: { licensePlate: 'BRA2E19', model: 'Corolla', brand: 'Toyota' },
});

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: jest.Mocked<
    Pick<NotificationRepository, 'create' | 'findById' | 'listForUser' | 'markAsRead'>
  >;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      listForUser: jest.fn(),
      markAsRead: jest.fn(),
    } as never;
    service = new NotificationService(repo as unknown as NotificationRepository);
  });

  describe('createFromEvent', () => {
    it('persists a user-scoped notification derived from the event', async () => {
      await service.createFromEvent(buildEvent());

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          type: VEHICLE_EVENTS.CREATED,
          read: false,
          title: 'Veículo cadastrado',
        }),
      );
    });
  });

  describe('findAllForUser', () => {
    it('returns mapped views scoped to the user', async () => {
      repo.listForUser.mockResolvedValue({ data: [buildDoc()], total: 1 });

      const result = await service.findAllForUser(1, {
        page: 1,
        limit: 10,
      } as NotificationFiltersDto);

      expect(repo.listForUser).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result.data[0]).toMatchObject({ id: VALID_ID, userId: 1, read: false });
      expect(result.meta.total).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('marks an owned notification as read', async () => {
      repo.findById.mockResolvedValue(buildDoc({ userId: 1 }));

      await service.markAsRead(VALID_ID, 1);

      expect(repo.markAsRead).toHaveBeenCalledWith(VALID_ID);
    });

    it('throws ForbiddenException when the notification belongs to another user', async () => {
      repo.findById.mockResolvedValue(buildDoc({ userId: 2 }));

      await expect(service.markAsRead(VALID_ID, 1)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.markAsRead).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an invalid object id', async () => {
      await expect(service.markAsRead('not-an-id', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the notification does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.markAsRead(VALID_ID, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
