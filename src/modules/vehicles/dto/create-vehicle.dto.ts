import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'BRA2E19', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  licensePlate: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  chassis: string;

  @ApiProperty({ example: '12345678901', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  renavam: string;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @IsPositive()
  year: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  modelId: number;
}
