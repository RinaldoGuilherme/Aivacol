import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehicleRepository } from './vehicle.repository';
import { ModelService } from '../models/model.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFiltersDto } from './dto/vehicle-filters.dto';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../../common/query/query.types';
import { VehicleEntity } from './entities/vehicle.entity';

@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly modelService: ModelService,
  ) {}

  private async checkUnique(
    field: 'licensePlate' | 'chassis' | 'renavam',
    value: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.vehicleRepository.findByField(field, value);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Vehicle with ${field} "${value}" already exists`);
    }
  }

  async create(dto: CreateVehicleDto, userId: number): Promise<VehicleEntity> {
    // Validate model is active
    await this.modelService.findOne(dto.modelId);

    await this.checkUnique('licensePlate', dto.licensePlate);
    await this.checkUnique('chassis', dto.chassis);
    await this.checkUnique('renavam', dto.renavam);

    return this.vehicleRepository.create({
      licensePlate: dto.licensePlate,
      chassis: dto.chassis,
      renavam: dto.renavam,
      year: dto.year,
      modelId: dto.modelId,
      createdBy: userId,
    });
  }

  async findAll(
    filters: VehicleFiltersDto,
  ): Promise<{ data: VehicleEntity[]; meta: PaginationMeta }> {
    const { data, total } = await this.vehicleRepository.list(filters);
    return { data, meta: buildPaginationMeta(total, filters.page, filters.limit) };
  }

  async findOne(id: number): Promise<VehicleEntity> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle #${id} not found`);
    }
    return vehicle;
  }

  async update(
    id: number,
    dto: UpdateVehicleDto,
    _userId: number,
  ): Promise<VehicleEntity> {
    const vehicle = await this.findOne(id);

    if (dto.modelId !== undefined && dto.modelId !== vehicle.modelId) {
      await this.modelService.findOne(dto.modelId);
    }
    if (dto.licensePlate !== undefined && dto.licensePlate !== vehicle.licensePlate) {
      await this.checkUnique('licensePlate', dto.licensePlate, id);
    }
    if (dto.chassis !== undefined && dto.chassis !== vehicle.chassis) {
      await this.checkUnique('chassis', dto.chassis, id);
    }
    if (dto.renavam !== undefined && dto.renavam !== vehicle.renavam) {
      await this.checkUnique('renavam', dto.renavam, id);
    }

    return this.vehicleRepository.update(vehicle, dto as Partial<VehicleEntity>);
  }

  async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.softDelete(vehicle);
  }
}
