import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import Mongoose, { HydratedDocument, Types } from 'mongoose';
import { Trade } from 'src/trade/schema/trade.schema';

export type ConfigDocument = HydratedDocument<Config>;

@Schema({ timestamps: true })
export class Config {
  @Prop({ type: String, required: true })
  username: string;
  
  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String })
  telegramToken?: string;

  @Prop({ type: [Mongoose.Schema.Types.Mixed] })
  telegramValidChatIds?: (number | string)[];

  @Prop({ type: String })
  timezone?: string;

  @Prop({ type: Date })
  finderStartAt?: Date;

  @Prop({ type: Date })
  finderEndAt?: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
