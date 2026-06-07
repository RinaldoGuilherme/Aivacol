import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditRepository } from './audit.repository';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { AuditLogFiltersDto } from './dto/audit-log-filters.dto';
import {
  VehicleEvent,
  VEHICLE_EVENTS,
} from '../queue/interfaces/vehicle-event.interface';

const VALID_ID = '507f1f77bcf86cd799439011';

const buildEvent = (): VehicleEvent => ({
  event: VEHICLE_EVENTS.CREATED,
  entity: 'vehicle',
  entityId: 10,
  actor: { id: 1, nickname: 'aivacol', name: 'Admin', email: 'admin@x.com', role: 'ADMIN' },
  payload: { licensePlate: 'BRA2E19', model: 'Corolla', brand: 'Toyota' },
});

const buildDoc = () =>
  ({
    _id: { toString: () => VALID_ID },
    event: VEHICLE_EVENTS.CREATED,
    entity: 'vehicle',
    entityId: 10,
    actor: { id: 1, nickname: 'aivacol', name: 'Admin', email: 'admin@x.com', role: 'ADMIN' },
    payload: { licensePlate: 'BRA2E19' },
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }) as unknown as AuditLogDocument;

describe('AuditService', () => {
  let service: AuditService;
  let repo: jest.Mocked<Pick<AuditRepository, 'create' | 'findById' | 'list'>>;

  beforeEach(() => {
    repo = { create: jest.fn(), findById: jest.fn(), list: jest.fn() } as never;
    service = new AuditService(repo as unknown as AuditRepository);
  });

  describe('createFromEvent', () => {
    it('registers an audit log from the domain event', async () => {
      await service.createFromEvent(buildEvent());

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event: VEHICLE_EVENTS.CREATED,
          entity: 'vehicle',
          entityId: 10,
        }),
      );
    });

    it('never persists sensitive actor fields (e.g. password)', async () => {
      await service.createFromEvent(buildEvent());

      const persisted = repo.create.mock.calls[0][0];
      expect(persisted.actor).not.toHaveProperty('password');
      expect(JSON.stringify(persisted)).not.toContain('password');
    });
  });

  describe('findAll', () => {
    it('returns mapped audit views with pagination meta', async () => {
      repo.list.mockResolvedValue({ data: [buildDoc()], total: 1 });

      const result = await service.findAll({
        page: 1,
        limit: 10,
      } as AuditLogFiltersDto);

      expect(result.data[0]).toMatchObject({ id: VALID_ID, entity: 'vehicle' });
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for an invalid object id', async () => {
      await expect(service.findOne('not-an-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the audit log is missing', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne(VALID_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns the mapped view when found', async () => {
      repo.findById.mockResolvedValue(buildDoc());

      const result = await service.findOne(VALID_ID);

      expect(result.id).toBe(VALID_ID);
    });
  });
});
