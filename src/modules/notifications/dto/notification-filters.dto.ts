import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { SortOrder } from '../../../common/query/query.types';

/** Allowed notification event types. */
export enum NotificationType {
  VEHICLE_CREATED = 'vehicle.created',
  VEHICLE_UPDATED = 'vehicle.updated',
  VEHICLE_DELETED = 'vehicle.deleted',
}

/** Allowed sort fields for notification listing. */
export enum NotificationSortBy {
  CREATED_AT = 'createdAt',
}

export class NotificationFiltersDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationSortBy, default: NotificationSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(NotificationSortBy)
  sortBy: NotificationSortBy = NotificationSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;
}
