import type { HydratedDocument } from 'mongoose';
import type { MonitorLogType } from 'src/types/monitor.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MonitorLogType as MonitorLogTypeEnum } from 'src/enums/monitor.enum';

export type MonitorDocument = HydratedDocument<Monitor>;

@Schema({ timestamps: true })
export class Monitor {
  @Prop({ type: Number, required: true })
  count: number;

  @Prop({
    type: String,
    enum: Object.values(MonitorLogTypeEnum),
    required: true,
  })
  type: MonitorLogType;

  @Prop({ type: String, required: true })
  log: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const MonitorSchema = SchemaFactory.createForClass(Monitor);
