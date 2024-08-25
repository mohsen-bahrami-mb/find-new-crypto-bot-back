import type { EndPositionsPrice } from 'src/types/trade.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TradeState } from 'src/enums/trade.enum';

export type TradeDocument = HydratedDocument<Trade>;

@Schema({ timestamps: true })
export class Trade {
  @Prop({ type: String, enum: Object.values(TradeState), required: true })
  state: TradeState;

  @Prop({ type: String, required: true, index: true })
  cryptoName: string;

  @Prop({ type: String, required: true, index: true })
  cryptoSymbol: string;

  @Prop({ type: String, required: true, index: true })
  cryptoPairSymbol: string;

  @Prop({ type: [Number], required: true })
  startPositionsPrice: number[];

  @Prop({
    type: [
      {
        tp: Number,
        sl: Number,
        percentOfAmount: Number,
        endPrice: Number,
      },
    ],
    required: true,
  })
  endPositionsPrice: EndPositionsPrice[];

  @Prop({ type: Number, required: true })
  startPositionAmount: number;

  @Prop({ type: Number, required: true })
  endPositionAmount: number;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
