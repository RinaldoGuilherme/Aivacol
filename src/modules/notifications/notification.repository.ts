import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { NotificationFiltersDto } from './dto/notification-filters.dto';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    return this.model.findById(id).exec();
  }

  async listForUser(
    userId: number,
    filters: NotificationFiltersDto,
  ): Promise<{ data: NotificationDocument[]; total: number }> {
    const query: FilterQuery<NotificationDocument> = { userId };
    if (filters.read !== undefined) query.read = filters.read;
    if (filters.type) query.type = filters.type;

    const sortDir = filters.sortOrder === 'asc' ? 1 : -1;
    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ [filters.sortBy]: sortDir })
        .skip(skip)
        .limit(filters.limit)
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async markAsRead(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { read: true } }).exec();
  }
}
