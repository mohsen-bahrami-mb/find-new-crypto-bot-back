import type { EndPositionsPrice } from 'src/types/trade.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EndPositionsPriceDto } from '../dto/manager.dto';

export type DefaultTradeDocument = HydratedDocument<DefaultTrade>;

@Schema()
export class DefaultTrade {
  @Prop({
    type: [
      {
        tp: Number,
        sl: Number,
        percentOfAmount: Number,
      },
    ],
    default: [],
  })
  endPositionsPrice: EndPositionsPriceDto[];

  @Prop({ type: Number })
  maximumRequstTime: number;

  @Prop({ type: Number })
  percentOfAmount: number;
}

export const DefaultTradeSchema = SchemaFactory.createForClass(DefaultTrade);
