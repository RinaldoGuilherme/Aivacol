import { Injectable, NotFoundException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { AuditRepository } from './audit.repository';
import { AuditLogDocument } from './schemas/audit-log.schema';
import { AuditLogFiltersDto } from './dto/audit-log-filters.dto';
import { VehicleEvent } from '../queue/interfaces/vehicle-event.interface';
import {
  buildPaginationMeta,
  PaginationMeta,
} from '../../common/query/query.types';

/** API-facing audit log representation (Mongo _id exposed as `id`). */
export interface AuditLogView {
  id: string;
  event: string;
  entity: string;
  entityId: number;
  actor: AuditLogDocument['actor'];
  payload: Record<string, unknown>;
  createdAt: Date;
}

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  /** Persists an audit log derived from a domain event (Worker only). */
  async createFromEvent(event: VehicleEvent): Promise<void> {
    await this.auditRepository.create({
      event: event.event,
      entity: event.entity,
      entityId: event.entityId,
      actor: event.actor,
      payload: event.payload as unknown as Record<string, unknown>,
    });
  }

  async findAll(
    filters: AuditLogFiltersDto,
  ): Promise<{ data: AuditLogView[]; meta: PaginationMeta }> {
    const { data, total } = await this.auditRepository.list(filters);
    return {
      data: data.map((doc) => this.toView(doc)),
      meta: buildPaginationMeta(total, filters.page, filters.limit),
    };
  }

  async findOne(id: string): Promise<AuditLogView> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Audit log #${id} not found`);
    }
    const doc = await this.auditRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Audit log #${id} not found`);
    }
    return this.toView(doc);
  }

  private toView(doc: AuditLogDocument): AuditLogView {
    return {
      id: doc._id.toString(),
      event: doc.event,
      entity: doc.entity,
      entityId: doc.entityId,
      actor: doc.actor,
      payload: doc.payload,
      createdAt: doc.createdAt,
    };
  }
}
