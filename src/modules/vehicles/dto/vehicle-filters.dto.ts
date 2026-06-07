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

export enum VehicleSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  YEAR = 'year',
  LICENSE_PLATE = 'licensePlate',
}

export class VehicleFiltersDto {
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

  @ApiPropertyOptional({ example: 'BRA' })
  @IsString()
  @IsOptional()
  licensePlate?: string;

  @ApiPropertyOptional({ example: '9BW' })
  @IsString()
  @IsOptional()
  chassis?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsString()
  @IsOptional()
  renavam?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  modelId?: number;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  brandId?: number;

  @ApiPropertyOptional({ example: 2025 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  createdBy?: number;

  @ApiPropertyOptional({ enum: StatusFilter, default: StatusFilter.ACTIVE })
  @IsEnum(StatusFilter)
  @IsOptional()
  status: StatusFilter = StatusFilter.ACTIVE;

  @ApiPropertyOptional({ enum: VehicleSortBy, default: VehicleSortBy.CREATED_AT })
  @IsEnum(VehicleSortBy)
  @IsOptional()
  sortBy: VehicleSortBy = VehicleSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder: SortOrder = SortOrder.DESC;
}
