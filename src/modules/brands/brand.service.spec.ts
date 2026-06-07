import { ConflictException, NotFoundException } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandRepository } from './brand.repository';
import { BrandEntity } from './entities/brand.entity';
import { BrandFiltersDto } from './dto/brand-filters.dto';

describe('BrandService', () => {
  let service: BrandService;
  let repo: jest.Mocked<
    Pick<
      BrandRepository,
      'findByName' | 'findById' | 'create' | 'update' | 'softDelete' | 'list'
    >
  >;

  const brand = { id: 1, name: 'Toyota' } as BrandEntity;

  beforeEach(() => {
    repo = {
      findByName: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      list: jest.fn(),
    } as never;
    service = new BrandService(repo as unknown as BrandRepository);
  });

  describe('create', () => {
    it('creates a brand when the name is free', async () => {
      repo.findByName.mockResolvedValue(null);
      repo.create.mockResolvedValue(brand);

      const result = await service.create({ name: 'Toyota' }, 1);

      expect(repo.create).toHaveBeenCalledWith('Toyota', 1);
      expect(result).toBe(brand);
    });

    it('rejects a duplicated brand name', async () => {
      repo.findByName.mockResolvedValue(brand);

      await expect(service.create({ name: 'Toyota' }, 1)).rejects.toThrow(
        ConflictException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns data with pagination meta', async () => {
      repo.list.mockResolvedValue({ data: [brand], total: 1 });

      const result = await service.findAll({
        page: 1,
        limit: 10,
      } as BrandFiltersDto);

      expect(result.data).toEqual([brand]);
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the brand is missing', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the brand name', async () => {
      repo.findById.mockResolvedValue(brand);
      repo.findByName.mockResolvedValue(null);
      repo.update.mockResolvedValue({ ...brand, name: 'Toyota BR' } as BrandEntity);

      const result = await service.update(1, { name: 'Toyota BR' }, 1);

      expect(repo.update).toHaveBeenCalledWith(brand, 'Toyota BR');
      expect(result.name).toBe('Toyota BR');
    });

    it('rejects when the new name belongs to another brand', async () => {
      repo.findById.mockResolvedValue(brand);
      repo.findByName.mockResolvedValue({ id: 2, name: 'Fiat' } as BrandEntity);

      await expect(
        service.update(1, { name: 'Fiat' }, 1),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing brand', async () => {
      repo.findById.mockResolvedValue(brand);

      await service.remove(1);

      expect(repo.softDelete).toHaveBeenCalledWith(brand);
    });
  });
});
