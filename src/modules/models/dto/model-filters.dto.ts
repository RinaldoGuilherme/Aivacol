import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SortOrder, StatusFilter } from '../../../common/query/query.types';

export enum ModelSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export class ModelFiltersDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;

  @ApiPropertyOptional({ example: 'Corolla' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  brandId?: number;

  @ApiPropertyOptional({ enum: StatusFilter, default: StatusFilter.ACTIVE })
  @IsEnum(StatusFilter)
  @IsOptional()
  status: StatusFilter = StatusFilter.ACTIVE;

  @ApiPropertyOptional({ enum: ModelSortBy, default: ModelSortBy.CREATED_AT })
  @IsEnum(ModelSortBy)
  @IsOptional()
  sortBy: ModelSortBy = ModelSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder: SortOrder = SortOrder.DESC;
}
