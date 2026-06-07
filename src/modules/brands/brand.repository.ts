import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BrandEntity } from './entities/brand.entity';
import { StatusFilter } from '../../common/query/query.types';
import { BrandFiltersDto } from './dto/brand-filters.dto';

@Injectable()
export class BrandRepository {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly repo: Repository<BrandEntity>,
  ) {}

  async findByName(name: string): Promise<BrandEntity | null> {
    return this.repo.findOne({ where: { name }, withDeleted: true });
  }

  async findById(id: number): Promise<BrandEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(name: string, createdBy: number): Promise<BrandEntity> {
    return this.repo.save(this.repo.create({ name, createdBy }));
  }

  async update(brand: BrandEntity, name: string): Promise<BrandEntity> {
    brand.name = name;
    return this.repo.save(brand);
  }

  async softDelete(brand: BrandEntity): Promise<void> {
    await this.repo.softRemove(brand);
  }

  async list(
    filters: BrandFiltersDto,
  ): Promise<{ data: BrandEntity[]; total: number }> {
    const qb: SelectQueryBuilder<BrandEntity> = this.repo.createQueryBuilder('brand');

    if (filters.status === StatusFilter.DELETED) {
      qb.withDeleted().andWhere('brand.deleted_at IS NOT NULL');
    } else if (filters.status === StatusFilter.ALL) {
      qb.withDeleted();
    }

    if (filters.name) {
      qb.andWhere('brand.name LIKE :name', { name: `%${filters.name}%` });
    }

    const columnMap: Record<string, string> = {
      name: 'brand.name',
      createdAt: 'brand.createdAt',
      updatedAt: 'brand.updatedAt',
    };
    const orderCol = columnMap[filters.sortBy] ?? 'brand.createdAt';
    qb.orderBy(orderCol, filters.sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const offset = (filters.page - 1) * filters.limit;
    qb.skip(offset).take(filters.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
