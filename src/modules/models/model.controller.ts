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
import { ModelService } from './model.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { ModelFiltersDto } from './dto/model-filters.dto';

@ApiTags('Models')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post()
  @ApiOperation({ summary: 'Create a model' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateModelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.modelService.create(dto, user.id);
    return { data, message: 'Operation completed successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List models with pagination and filters' })
  async findAll(@Query() filters: ModelFiltersDto) {
    const { data, meta } = await this.modelService.findAll(filters);
    return { data, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a model by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.modelService.findOne(id);
    return { data, message: 'Operation completed successfully' };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a model' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.modelService.update(id, dto, user.id);
    return { data, message: 'Operation completed successfully' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a model' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.modelService.remove(id);
    return { message: 'Operation completed successfully' };
  }
}
