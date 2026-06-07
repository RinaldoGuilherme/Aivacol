import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFiltersDto } from './dto/vehicle-filters.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vehicle' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.vehicleService.create(dto, user);
    return { data, message: 'Operation completed successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List vehicles with pagination and filters' })
  async findAll(@Query() filters: VehicleFiltersDto) {
    const { data, meta } = await this.vehicleService.findAll(filters);
    return { data, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.vehicleService.findOne(id);
    return { data, message: 'Operation completed successfully' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a vehicle' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.vehicleService.update(id, dto, user);
    return { data, message: 'Operation completed successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a vehicle' })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.vehicleService.remove(id, user);
    return { message: 'Operation completed successfully' };
  }
}
