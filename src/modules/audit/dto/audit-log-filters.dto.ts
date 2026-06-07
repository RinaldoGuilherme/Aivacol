import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SortOrder } from '../../../common/query/query.types';

/** Allowed sort fields for audit log listing. */
export enum AuditLogSortBy {
  CREATED_AT = 'createdAt',
}

export class AuditLogFiltersDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Filter by event name, e.g. vehicle.created' })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiPropertyOptional({ description: 'Filter by entity, e.g. vehicle' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'Filter by entity id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entityId?: number;

  @ApiPropertyOptional({ description: 'Filter by actor id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actorId?: number;

  @ApiPropertyOptional({ enum: AuditLogSortBy, default: AuditLogSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(AuditLogSortBy)
  sortBy: AuditLogSortBy = AuditLogSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
