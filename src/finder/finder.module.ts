import { Module, OnModuleInit } from '@nestjs/common';
import { FinderService } from './finder.service';
import { FinderController } from './finder.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Finder, FinderSchema } from './schema/finder.schema';
import { TradeService } from 'src/trade/trade.service';
import { Trade, TradeSchema } from 'src/trade/schema/trade.schema';
import { FinderTask } from './task/finder.task';
import { FinderProcess } from './process/finder.process';
import { BullModule } from '@nestjs/bull';
import { queue } from 'src/enums/redis.enum';
import { DefaultTrade, DefaultTradeSchema } from 'src/trade/schema/defaultTrade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finder.name, schema: FinderSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: DefaultTrade.name, schema: DefaultTradeSchema },
    ]),
    BullModule.registerQueue({ name: queue.finder }),
  ],
  providers: [FinderService, TradeService, FinderTask, FinderProcess],
  controllers: [FinderController],
})
export class FinderModule {}
