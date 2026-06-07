import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ModelEntity } from './entities/model.entity';
import { StatusFilter } from '../../common/query/query.types';
import { ModelFiltersDto } from './dto/model-filters.dto';

@Injectable()
export class ModelRepository {
  constructor(
    @InjectRepository(ModelEntity)
    private readonly repo: Repository<ModelEntity>,
  ) {}

  async findById(id: number): Promise<ModelEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(
    name: string,
    brandId: number,
    createdBy: number,
  ): Promise<ModelEntity> {
    return this.repo.save(this.repo.create({ name, brandId, createdBy }));
  }

  async update(model: ModelEntity, name?: string, brandId?: number): Promise<ModelEntity> {
    if (name !== undefined) model.name = name;
    if (brandId !== undefined) model.brandId = brandId;
    return this.repo.save(model);
  }

  async softDelete(model: ModelEntity): Promise<void> {
    await this.repo.softRemove(model);
  }

  async list(
    filters: ModelFiltersDto,
  ): Promise<{ data: ModelEntity[]; total: number }> {
    const qb: SelectQueryBuilder<ModelEntity> =
      this.repo.createQueryBuilder('model');

    if (filters.status === StatusFilter.DELETED) {
      qb.withDeleted().andWhere('model.deleted_at IS NOT NULL');
    } else if (filters.status === StatusFilter.ALL) {
      qb.withDeleted();
    }

    if (filters.name) {
      qb.andWhere('model.name LIKE :name', { name: `%${filters.name}%` });
    }
    if (filters.brandId) {
      qb.andWhere('model.brand_id = :brandId', { brandId: filters.brandId });
    }

    const columnMap: Record<string, string> = {
      name: 'model.name',
      createdAt: 'model.createdAt',
      updatedAt: 'model.updatedAt',
    };
    const orderCol = columnMap[filters.sortBy] ?? 'model.createdAt';
    qb.orderBy(orderCol, filters.sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const offset = (filters.page - 1) * filters.limit;
    qb.skip(offset).take(filters.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
