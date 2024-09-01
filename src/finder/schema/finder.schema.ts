import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Trade } from 'src/trade/schema/trade.schema';

export type FinderDocument = HydratedDocument<Finder>;

@Schema({ timestamps: true })
export class Finder {
  @Prop({ type: String, required: true })
  newsUrl: string;

  @Prop({ type: String, required: true })
  newsTitle: string;

  @Prop({ type: Date, required: true })
  newsDate: Date;

  @Prop({ type: String, required: true, index: true })
  cryptoName: string;

  @Prop({ type: String, required: true, index: true })
  cryptoSymbol: string;

  @Prop({ type: Types.ObjectId, ref: Trade.name })
  trade?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  requestStart: Date;

  @Prop({ type: Date, required: true })
  requestEnd: Date;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const FinderSchema = SchemaFactory.createForClass(Finder);
