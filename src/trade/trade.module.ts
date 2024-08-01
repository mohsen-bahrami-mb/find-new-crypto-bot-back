import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trade, TradeSchema } from './schema/trade.schema';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trade.name, schema: TradeSchema }]),
  ],
  providers: [TradeService],
  controllers: [TradeController],
})
export class TradeModule {}
