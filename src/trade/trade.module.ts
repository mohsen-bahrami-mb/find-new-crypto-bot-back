import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trade, TradeSchema } from './schema/trade.schema';
import { TradeService } from './trade.service';
import { TradeController } from './trade.controller';
import { DefaultTrade, DefaultTradeSchema } from './schema/defaultTrade.schema';
import { TradeTask } from './task/trade.task';
import { BullModule } from '@nestjs/bull';
import { queue } from 'src/enums/redis.enum';
import { TradeProcess } from './process/trade.process';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Trade.name, schema: TradeSchema },
      { name: DefaultTrade.name, schema: DefaultTradeSchema },
    ]),
    BullModule.registerQueue({ name: queue.trade }),
    BullModule.registerQueue({ name: queue.finder }),
  ],
  providers: [TradeService, TradeTask, TradeProcess],
  controllers: [TradeController],
})
export class TradeModule {}
