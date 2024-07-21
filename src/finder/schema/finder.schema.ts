import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Trade } from 'src/trade/schema/trade.schema';

export type FinderDocument = HydratedDocument<Finder>;

@Schema({ timestamps: true })
export class Finder {
  @Prop({ type: String, required: true })
  news_url: string;

  @Prop({ type: String, required: true })
  news_title: string;

  @Prop({ type: Date, required: true })
  news_date: Date;

  @Prop({ type: String, required: true, index: true })
  crypto_name: string;

  @Prop({ type: String, required: true, index: true })
  crypto_symbol: string;

  @Prop({ type: Types.ObjectId, ref: Trade.name })
  trade?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  request_start: Date;

  @Prop({ type: Date, required: true })
  request_end: Date;
}

export const FinderSchema = SchemaFactory.createForClass(Finder);
