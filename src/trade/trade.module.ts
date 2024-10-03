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
import { FinderService } from 'src/finder/finder.service';
import { XlsService } from 'src/file-generator/xls/xls.service';
import { PdfService } from 'src/file-generator/pdf/pdf.service';
import { Finder, FinderSchema } from 'src/finder/schema/finder.schema';
import { Config, ConfigSchema } from 'src/app-config/schema/config.schema';
import { AppConfigService } from 'src/app-config/app-config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finder.name, schema: FinderSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: DefaultTrade.name, schema: DefaultTradeSchema },
      { name: Config.name, schema: ConfigSchema },
    ]),
    BullModule.registerQueue({ name: queue.trade }),
    BullModule.registerQueue({ name: queue.finder }),
  ],
  providers: [
    TradeService,
    FinderService,
    AppConfigService,
    XlsService,
    PdfService,
    TradeTask,
    TradeProcess,
  ],
  controllers: [TradeController],
})
export class TradeModule {}
