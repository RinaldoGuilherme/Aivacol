import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BrandRepository } from './brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandFiltersDto } from './dto/brand-filters.dto';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../../common/query/query.types';
import { BrandEntity } from './entities/brand.entity';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async create(dto: CreateBrandDto, userId: number): Promise<BrandEntity> {
    const existing = await this.brandRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(
        `Brand with name "${dto.name}" already exists`,
      );
    }
    return this.brandRepository.create(dto.name, userId);
  }

  async findAll(
    filters: BrandFiltersDto,
  ): Promise<{ data: BrandEntity[]; meta: PaginationMeta }> {
    const { data, total } = await this.brandRepository.list(filters);
    return { data, meta: buildPaginationMeta(total, filters.page, filters.limit) };
  }

  async findOne(id: number): Promise<BrandEntity> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundException(`Brand #${id} not found`);
    }
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto, _userId: number): Promise<BrandEntity> {
    const brand = await this.findOne(id);
    if (dto.name !== brand.name) {
      const existing = await this.brandRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Brand with name "${dto.name}" already exists`,
        );
      }
    }
    return this.brandRepository.update(brand, dto.name);
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id);
    await this.brandRepository.softDelete(brand);
  }
}
