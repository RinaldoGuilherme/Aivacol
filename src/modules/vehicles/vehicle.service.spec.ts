import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { VehicleService } from './vehicle.service';
import { VehicleRepository } from './vehicle.repository';
import { ModelService } from '../models/model.service';
import { QueueService } from '../queue/queue.service';
import { CacheService } from '../cache/cache.service';
import { VehicleEntity } from './entities/vehicle.entity';
import { VehicleFiltersDto } from './dto/vehicle-filters.dto';
import { UserEntity } from '../users/entities/user.entity';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { VEHICLE_EVENTS } from '../queue/interfaces/vehicle-event.interface';

const ACTOR: AuthenticatedUser = { id: 1, email: 'admin@x.com', role: 'ADMIN' };

const VEHICLE = {
  id: 100,
  licensePlate: 'BRA2E19',
  chassis: 'CHS1',
  renavam: 'RNV1',
  year: 2022,
  modelId: 1,
  model: { name: 'Corolla', brand: { name: 'Toyota' } },
} as unknown as VehicleEntity;

const DB_USER = {
  id: 1,
  nickname: 'aivacol',
  name: 'Admin',
  email: 'admin@x.com',
  role: { value: 'ADMIN' },
} as unknown as UserEntity;

const CREATE_DTO = {
  licensePlate: 'BRA2E19',
  chassis: 'CHS1',
  renavam: 'RNV1',
  year: 2022,
  modelId: 1,
};

describe('VehicleService', () => {
  let service: VehicleService;
  let repo: jest.Mocked<VehicleRepository>;
  let modelService: jest.Mocked<Pick<ModelService, 'findOne'>>;
  let queueService: jest.Mocked<Pick<QueueService, 'publishVehicleEvent'>>;
  let cacheService: jest.Mocked<
    Pick<CacheService, 'get' | 'set' | 'del' | 'deleteByPattern'>
  >;
  let userRepository: jest.Mocked<Pick<Repository<UserEntity>, 'findOne'>>;

  beforeEach(() => {
    repo = {
      findByField: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      findByIdWithRelations: jest.fn().mockResolvedValue(VEHICLE),
      create: jest.fn().mockResolvedValue(VEHICLE),
      update: jest.fn().mockResolvedValue(VEHICLE),
      softDelete: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
    } as never;
    modelService = { findOne: jest.fn().mockResolvedValue({ id: 1 }) } as never;
    queueService = { publishVehicleEvent: jest.fn().mockResolvedValue(undefined) } as never;
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      deleteByPattern: jest.fn(),
    } as never;
    userRepository = { findOne: jest.fn().mockResolvedValue(DB_USER) } as never;

    const config = {
      getOrThrow: jest.fn().mockReturnValue(60),
    } as unknown as ConfigService;

    service = new VehicleService(
      repo,
      modelService as unknown as ModelService,
      queueService as unknown as QueueService,
      cacheService as unknown as CacheService,
      config,
      userRepository as unknown as Repository<UserEntity>,
    );
  });

  describe('create', () => {
    it('creates a vehicle, publishes vehicle.created and invalidates list cache', async () => {
      const result = await service.create(CREATE_DTO, ACTOR);

      expect(modelService.findOne).toHaveBeenCalledWith(1);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ licensePlate: 'BRA2E19', createdBy: 1 }),
      );
      expect(queueService.publishVehicleEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: VEHICLE_EVENTS.CREATED, entityId: 100 }),
      );
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('vehicles:list:*');
      expect(result).toBe(VEHICLE);
    });

    it.each(['licensePlate', 'chassis', 'renavam'] as const)(
      'rejects a duplicated %s with 409',
      async (field) => {
        repo.findByField.mockImplementation(async (f) =>
          f === field ? ({ id: 999 } as VehicleEntity) : null,
        );

        await expect(service.create(CREATE_DTO, ACTOR)).rejects.toThrow(
          ConflictException,
        );
        expect(repo.create).not.toHaveBeenCalled();
      },
    );

    it('rejects creation with an invalid modelId', async () => {
      modelService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(CREATE_DTO, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const filters = { page: 1, limit: 10 } as VehicleFiltersDto;

    it('returns cached data on a HIT without querying the database', async () => {
      const cached = { data: [VEHICLE], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } };
      cacheService.get.mockResolvedValue(cached);

      const result = await service.findAll(filters);

      expect(result).toBe(cached);
      expect(repo.list).not.toHaveBeenCalled();
    });

    it('queries the database and populates the cache on a MISS', async () => {
      cacheService.get.mockResolvedValue(null);
      repo.list.mockResolvedValue({ data: [VEHICLE], total: 1 });

      const result = await service.findAll(filters);

      expect(repo.list).toHaveBeenCalledWith(filters);
      expect(cacheService.set).toHaveBeenCalledWith(expect.any(String), result, 60);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns cached data on a HIT', async () => {
      cacheService.get.mockResolvedValue(VEHICLE);

      expect(await service.findOne(100)).toBe(VEHICLE);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('queries the database and caches the result on a MISS', async () => {
      cacheService.get.mockResolvedValue(null);
      repo.findById.mockResolvedValue(VEHICLE);

      const result = await service.findOne(100);

      expect(repo.findById).toHaveBeenCalledWith(100);
      expect(cacheService.set).toHaveBeenCalledWith('vehicles:id:100', VEHICLE, 60);
      expect(result).toBe(VEHICLE);
    });

    it('throws NotFoundException when the vehicle is missing', async () => {
      cacheService.get.mockResolvedValue(null);
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne(404)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates, publishes vehicle.updated and invalidates list + detail cache', async () => {
      repo.findById.mockResolvedValue(VEHICLE);

      await service.update(100, { year: 2027 }, ACTOR);

      expect(queueService.publishVehicleEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: VEHICLE_EVENTS.UPDATED, entityId: 100 }),
      );
      expect(cacheService.del).toHaveBeenCalledWith('vehicles:id:100');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('vehicles:list:*');
    });

    it('rejects an update with a duplicated license plate', async () => {
      repo.findById.mockResolvedValue(VEHICLE);
      repo.findByField.mockResolvedValue({ id: 999 } as VehicleEntity);

      await expect(
        service.update(100, { licensePlate: 'OTHER01' }, ACTOR),
      ).rejects.toThrow(ConflictException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft-deletes, publishes vehicle.deleted and invalidates caches', async () => {
      repo.findById.mockResolvedValue(VEHICLE);

      await service.remove(100, ACTOR);

      expect(repo.softDelete).toHaveBeenCalledWith(VEHICLE);
      expect(queueService.publishVehicleEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: VEHICLE_EVENTS.DELETED, entityId: 100 }),
      );
      expect(cacheService.del).toHaveBeenCalledWith('vehicles:id:100');
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith('vehicles:list:*');
    });
  });
});
