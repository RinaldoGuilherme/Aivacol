import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditLogFiltersDto } from './dto/audit-log-filters.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs (ADMIN only)' })
  async findAll(@Query() filters: AuditLogFiltersDto) {
    const { data, meta } = await this.auditService.findAll(filters);
    return { data, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an audit log by id (ADMIN only)' })
  async findOne(@Param('id') id: string) {
    const data = await this.auditService.findOne(id);
    return { data, message: 'Operation completed successfully' };
  }
}
