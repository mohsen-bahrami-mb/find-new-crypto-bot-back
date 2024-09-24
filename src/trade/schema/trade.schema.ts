import type { EndPositionsPrice } from 'src/types/trade.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TradeBroker, TradeState } from 'src/enums/trade.enum';

export type TradeDocument = HydratedDocument<Trade>;

@Schema({ timestamps: true })
export class Trade {
  @Prop({ type: String, enum: Object.values(TradeState), required: true })
  state: TradeState;

  @Prop({ type: String, enum: Object.values(TradeBroker), required: true })
  broker: TradeBroker;

  @Prop({ type: String, required: true, index: true })
  cryptoName: string;

  @Prop({ type: String, required: true, index: true })
  cryptoSymbol: string;

  @Prop({ type: String, required: true, index: true })
  cryptoPairSymbol: string;

  @Prop({ type: [Number], required: true, default: [] })
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
    default: [],
  })
  endPositionsPrice: EndPositionsPrice[];

  @Prop({ type: Number, required: true, default: 0 })
  startPositionAmount: number;

  @Prop({ type: Number, required: true })
  positionAmount: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);
