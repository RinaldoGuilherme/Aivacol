import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelRepository } from './model.repository';
import { BrandService } from '../brands/brand.service';
import { ModelEntity } from './entities/model.entity';
import { ModelFiltersDto } from './dto/model-filters.dto';

describe('ModelService', () => {
  let service: ModelService;
  let repo: jest.Mocked<
    Pick<
      ModelRepository,
      'findById' | 'create' | 'update' | 'softDelete' | 'list'
    >
  >;
  let brandService: jest.Mocked<Pick<BrandService, 'findOne'>>;

  const model = { id: 1, name: 'Corolla', brandId: 1 } as ModelEntity;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      list: jest.fn(),
    } as never;
    brandService = { findOne: jest.fn() } as never;
    service = new ModelService(
      repo as unknown as ModelRepository,
      brandService as unknown as BrandService,
    );
  });

  describe('create', () => {
    it('creates a model after validating the brand exists', async () => {
      brandService.findOne.mockResolvedValue({ id: 1 } as never);
      repo.create.mockResolvedValue(model);

      const result = await service.create({ name: 'Corolla', brandId: 1 }, 1);

      expect(brandService.findOne).toHaveBeenCalledWith(1);
      expect(repo.create).toHaveBeenCalledWith('Corolla', 1, 1);
      expect(result).toBe(model);
    });

    it('propagates NotFoundException for an invalid brandId', async () => {
      brandService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create({ name: 'Corolla', brandId: 999 }, 1),
      ).rejects.toThrow(NotFoundException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns models with pagination meta', async () => {
      repo.list.mockResolvedValue({ data: [model], total: 1 });

      const result = await service.findAll({
        page: 1,
        limit: 10,
      } as ModelFiltersDto);

      expect(result.data).toEqual([model]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the model is missing', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the model name', async () => {
      repo.findById.mockResolvedValue(model);
      repo.update.mockResolvedValue({ ...model, name: 'Corolla XEi' } as ModelEntity);

      const result = await service.update(1, { name: 'Corolla XEi' }, 1);

      expect(repo.update).toHaveBeenCalledWith(model, 'Corolla XEi', undefined);
      expect(result.name).toBe('Corolla XEi');
    });

    it('rejects an update pointing to a deleted/invalid brand', async () => {
      repo.findById.mockResolvedValue(model);
      brandService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.update(1, { brandId: 999 }, 1),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing model', async () => {
      repo.findById.mockResolvedValue(model);

      await service.remove(1);

      expect(repo.softDelete).toHaveBeenCalledWith(model);
    });
  });
});
