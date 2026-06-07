import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { VehicleEntity } from './entities/vehicle.entity';
import { StatusFilter } from '../../common/query/query.types';
import { VehicleFiltersDto } from './dto/vehicle-filters.dto';

@Injectable()
export class VehicleRepository {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly repo: Repository<VehicleEntity>,
  ) {}

  async findByField(
    field: 'licensePlate' | 'chassis' | 'renavam',
    value: string,
  ): Promise<VehicleEntity | null> {
    return this.repo.findOne({ where: { [field]: value }, withDeleted: true });
  }

  async findById(id: number): Promise<VehicleEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Loads a vehicle with its model and brand relations. Includes soft-deleted
   * rows so domain events (e.g. vehicle.deleted) can still resolve the model
   * and brand names for the event payload.
   */
  async findByIdWithRelations(id: number): Promise<VehicleEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: { model: { brand: true } },
      withDeleted: true,
    });
  }

  async create(data: {
    licensePlate: string;
    chassis: string;
    renavam: string;
    year: number;
    modelId: number;
    createdBy: number;
  }): Promise<VehicleEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(vehicle: VehicleEntity, patch: Partial<VehicleEntity>): Promise<VehicleEntity> {
    Object.assign(vehicle, patch);
    return this.repo.save(vehicle);
  }

  async softDelete(vehicle: VehicleEntity): Promise<void> {
    await this.repo.softRemove(vehicle);
  }

  async list(
    filters: VehicleFiltersDto,
  ): Promise<{ data: VehicleEntity[]; total: number }> {
    const qb: SelectQueryBuilder<VehicleEntity> =
      this.repo.createQueryBuilder('vehicle');

    // Join model to allow filtering by brandId
    qb.leftJoin('vehicle.model', 'model');

    if (filters.status === StatusFilter.DELETED) {
      qb.withDeleted().andWhere('vehicle.deleted_at IS NOT NULL');
    } else if (filters.status === StatusFilter.ALL) {
      qb.withDeleted();
    }

    if (filters.licensePlate) {
      qb.andWhere('vehicle.license_plate LIKE :lp', { lp: `%${filters.licensePlate}%` });
    }
    if (filters.chassis) {
      qb.andWhere('vehicle.chassis LIKE :chassis', { chassis: `%${filters.chassis}%` });
    }
    if (filters.renavam) {
      qb.andWhere('vehicle.renavam LIKE :renavam', { renavam: `%${filters.renavam}%` });
    }
    if (filters.modelId) {
      qb.andWhere('vehicle.model_id = :modelId', { modelId: filters.modelId });
    }
    if (filters.brandId) {
      qb.andWhere('model.brand_id = :brandId', { brandId: filters.brandId });
    }
    if (filters.year) {
      qb.andWhere('vehicle.year = :year', { year: filters.year });
    }
    if (filters.createdBy) {
      qb.andWhere('vehicle.created_by = :createdBy', { createdBy: filters.createdBy });
    }

    const columnMap: Record<string, string> = {
      createdAt: 'vehicle.createdAt',
      updatedAt: 'vehicle.updatedAt',
      year: 'vehicle.year',
      licensePlate: 'vehicle.licensePlate',
    };
    const orderCol = columnMap[filters.sortBy] ?? 'vehicle.createdAt';
    qb.orderBy(orderCol, filters.sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const offset = (filters.page - 1) * filters.limit;
    qb.skip(offset).take(filters.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }
}
