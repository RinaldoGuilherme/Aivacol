import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { AuditLogFiltersDto } from './dto/audit-log-filters.dto';

@Injectable()
export class AuditRepository {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly model: Model<AuditLogDocument>,
  ) {}

  async create(data: Partial<AuditLog>): Promise<AuditLogDocument> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<AuditLogDocument | null> {
    return this.model.findById(id).exec();
  }

  async list(
    filters: AuditLogFiltersDto,
  ): Promise<{ data: AuditLogDocument[]; total: number }> {
    const query: FilterQuery<AuditLogDocument> = {};
    if (filters.event) query.event = filters.event;
    if (filters.entity) query.entity = filters.entity;
    if (filters.entityId !== undefined) query.entityId = filters.entityId;
    if (filters.actorId !== undefined) query['actor.id'] = filters.actorId;

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
}
