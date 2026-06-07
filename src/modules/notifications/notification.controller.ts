import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';
import { NotificationService } from './notification.service';
import { NotificationFiltersDto } from './dto/notification-filters.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications of the authenticated user' })
  async findAll(
    @Query() filters: NotificationFiltersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { data, meta } = await this.notificationService.findAllForUser(
      user.id,
      filters,
    );
    return { data, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one notification owned by the authenticated user' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.notificationService.findOneForUser(id, user.id);
    return { data, message: 'Operation completed successfully' };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read (owner only)' })
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.notificationService.markAsRead(id, user.id);
    return { message: 'Notification marked as read' };
  }
}
