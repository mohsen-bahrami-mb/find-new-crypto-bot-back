import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Trade } from 'src/trade/schema/trade.schema';

export type ConfigDocument = HydratedDocument<Config>;

@Schema({})
export class Config {
  @Prop({ type: String })
  timezone?: string;

  @Prop({ type: Date })
  finderStartAt?: Date;

  @Prop({ type: Date })
  finderEndAt?: Date;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
