import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

/**
 * Global system audit record persisted asynchronously by the Worker.
 * Stored in the `audit_logs` collection. Never stores sensitive data
 * (passwords, hashes, tokens or credentials).
 */
@Schema({ collection: 'audit_logs', timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ required: true, index: true })
  event: string;

  @Prop({ required: true, index: true })
  entity: string;

  @Prop({ required: true, index: true })
  entityId: number;

  @Prop({ type: Object, required: true })
  actor: {
    id: number;
    nickname: string;
    name: string;
    email: string;
    role: string;
  };

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
