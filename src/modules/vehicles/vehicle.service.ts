import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { QueueService } from '../queue/queue.service';
import { UserEntity } from '../users/entities/user.entity';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import {
  EventActor,
  VEHICLE_EVENTS,
  VehicleEventName,
} from '../queue/interfaces/vehicle-event.interface';

@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly modelService: ModelService,
    private readonly queueService: QueueService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private async checkUnique(
    field: 'licensePlate' | 'chassis' | 'renavam',
    value: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.vehicleRepository.findByField(field, value);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Vehicle with ${field} "${value}" already exists`,
      );
    }
  }

  async create(
    dto: CreateVehicleDto,
    user: AuthenticatedUser,
  ): Promise<VehicleEntity> {
    // Validate model is active
    await this.modelService.findOne(dto.modelId);

    await this.checkUnique('licensePlate', dto.licensePlate);
    await this.checkUnique('chassis', dto.chassis);
    await this.checkUnique('renavam', dto.renavam);

    const vehicle = await this.vehicleRepository.create({
      licensePlate: dto.licensePlate,
      chassis: dto.chassis,
      renavam: dto.renavam,
      year: dto.year,
      modelId: dto.modelId,
      createdBy: user.id,
    });

    await this.publishEvent(VEHICLE_EVENTS.CREATED, vehicle.id, user);

    return vehicle;
  }

  async findAll(
    filters: VehicleFiltersDto,
  ): Promise<{ data: VehicleEntity[]; meta: PaginationMeta }> {
    const { data, total } = await this.vehicleRepository.list(filters);
    return {
      data,
      meta: buildPaginationMeta(total, filters.page, filters.limit),
    };
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
    user: AuthenticatedUser,
  ): Promise<VehicleEntity> {
    const vehicle = await this.findOne(id);

    if (dto.modelId !== undefined && dto.modelId !== vehicle.modelId) {
      await this.modelService.findOne(dto.modelId);
    }
    if (
      dto.licensePlate !== undefined &&
      dto.licensePlate !== vehicle.licensePlate
    ) {
      await this.checkUnique('licensePlate', dto.licensePlate, id);
    }
    if (dto.chassis !== undefined && dto.chassis !== vehicle.chassis) {
      await this.checkUnique('chassis', dto.chassis, id);
    }
    if (dto.renavam !== undefined && dto.renavam !== vehicle.renavam) {
      await this.checkUnique('renavam', dto.renavam, id);
    }

    const updated = await this.vehicleRepository.update(
      vehicle,
      dto as Partial<VehicleEntity>,
    );

    await this.publishEvent(VEHICLE_EVENTS.UPDATED, updated.id, user);

    return updated;
  }

  async remove(id: number, user: AuthenticatedUser): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.softDelete(vehicle);
    await this.publishEvent(VEHICLE_EVENTS.DELETED, id, user);
  }

  /**
   * Fetches full vehicle relations and actor details to publish a domain event.
   */
  private async publishEvent(
    eventName: VehicleEventName,
    vehicleId: number,
    actor: AuthenticatedUser,
  ): Promise<void> {
    try {
      const [vehicle, user] = await Promise.all([
        this.vehicleRepository.findByIdWithRelations(vehicleId),
        this.userRepository.findOne({
          where: { id: actor.id },
          relations: { role: true },
        }),
      ]);

      if (!vehicle || !user) return;

      const eventActor: EventActor = {
        id: user.id,
        nickname: user.nickname,
        name: user.name,
        email: user.email,
        role: user.role.value,
      };

      await this.queueService.publishVehicleEvent({
        event: eventName,
        entity: 'vehicle',
        entityId: vehicle.id,
        actor: eventActor,
        payload: {
          licensePlate: vehicle.licensePlate,
          model: vehicle.model?.name || null,
          brand: vehicle.model?.brand?.name || null,
        },
      });
    } catch (error) {
      // We don't want to fail the main transaction if event publishing fails,
      // but we should log it. In a real scenario, an Outbox Pattern would be
      // used for reliability.
      console.error(`Failed to publish ${eventName} for vehicle #${vehicleId}:`, error);
    }
  }
}
