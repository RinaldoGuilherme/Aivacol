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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandFiltersDto } from './dto/brand-filters.dto';

@ApiTags('Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @ApiOperation({ summary: 'Create a brand' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateBrandDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.brandService.create(dto, user.id);
    return { data, message: 'Operation completed successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List brands with pagination and filters' })
  async findAll(@Query() filters: BrandFiltersDto) {
    const { data, meta } = await this.brandService.findAll(filters);
    return { data, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.brandService.findOne(id);
    return { data, message: 'Operation completed successfully' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a brand' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.brandService.update(id, dto, user.id);
    return { data, message: 'Operation completed successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a brand' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.brandService.remove(id);
    return { message: 'Operation completed successfully' };
  }
}
