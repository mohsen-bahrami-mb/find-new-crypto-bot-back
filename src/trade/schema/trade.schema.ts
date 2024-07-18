import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TradeDocument = HydratedDocument<Trade>;

@Schema({ timestamps: true })
export class Trade {
  @Prop({ type: String, required: true, index: true })
  crypto_name: string;

  @Prop({ type: String, required: true, index: true })
  crypto_symbol: string;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
