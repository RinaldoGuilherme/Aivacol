import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModelRepository } from './model.repository';
import { BrandService } from '../brands/brand.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { ModelFiltersDto } from './dto/model-filters.dto';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../../common/query/query.types';
import { ModelEntity } from './entities/model.entity';

@Injectable()
export class ModelService {
  constructor(
    private readonly modelRepository: ModelRepository,
    private readonly brandService: BrandService,
  ) {}

  async create(dto: CreateModelDto, userId: number): Promise<ModelEntity> {
    // Validate that the brand exists and is active (not soft-deleted)
    await this.brandService.findOne(dto.brandId);
    return this.modelRepository.create(dto.name, dto.brandId, userId);
  }

  async findAll(
    filters: ModelFiltersDto,
  ): Promise<{ data: ModelEntity[]; meta: PaginationMeta }> {
    const { data, total } = await this.modelRepository.list(filters);
    return { data, meta: buildPaginationMeta(total, filters.page, filters.limit) };
  }

  async findOne(id: number): Promise<ModelEntity> {
    const model = await this.modelRepository.findById(id);
    if (!model) {
      throw new NotFoundException(`Model #${id} not found`);
    }
    return model;
  }

  async update(
    id: number,
    dto: UpdateModelDto,
    _userId: number,
  ): Promise<ModelEntity> {
    const model = await this.findOne(id);

    if (dto.brandId !== undefined && dto.brandId !== model.brandId) {
      // Validate that the new brand exists and is active
      const brand = await this.brandService.findOne(dto.brandId).catch(() => null);
      if (!brand) {
        throw new BadRequestException(
          `Brand #${dto.brandId} not found or is deleted`,
        );
      }
    }

    return this.modelRepository.update(model, dto.name, dto.brandId);
  }

  async remove(id: number): Promise<void> {
    const model = await this.findOne(id);
    await this.modelRepository.softDelete(model);
  }
}
