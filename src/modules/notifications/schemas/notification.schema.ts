import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

/**
 * User-scoped notification persisted asynchronously by the Worker.
 * Stored in the `notifications` collection. `userId` always equals the
 * originating event actor id.
 */
@Schema({ collection: 'notifications', timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  @Prop({ required: true, index: true })
  userId: number;

  @Prop({ required: true, index: true })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  read: boolean;

  createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
