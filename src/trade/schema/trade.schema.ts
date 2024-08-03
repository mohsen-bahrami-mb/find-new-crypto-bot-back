import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TradeDocument = HydratedDocument<Trade>;

@Schema({ timestamps: true })
export class Trade {
  @Prop({ type: String, required: true, index: true })
  crypto_name: string;

  @Prop({ type: String, required: true, index: true })
  crypto_symbol: string;

  @Prop({ type: String, required: true, index: true })
  crypto_pair_symbol: string;

  @Prop({ type: [Number], required: true })
  start_positions_price: number[];

  /** {`1`: {...}, `2`: {...}, ...} */
  @Prop({ type: Map, required: true })
  end_positions_price: Map<number, { tp: number; sl: number }>;

  @Prop({ type: Number, required: true })
  start_position_amount: number;

  @Prop({ type: Number, required: true })
  end_position_amount: number;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
