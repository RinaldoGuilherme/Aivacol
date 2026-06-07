import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'BRA2E19', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsOptional()
  licensePlate?: string;

  @ApiPropertyOptional({ example: '9BWZZZ377VT004251', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  chassis?: string;

  @ApiPropertyOptional({ example: '12345678901', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsOptional()
  renavam?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  modelId?: number;
}
