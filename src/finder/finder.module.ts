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
import {
  DefaultTrade,
  DefaultTradeSchema,
} from 'src/trade/schema/defaultTrade.schema';
import { AppConfigService } from 'src/app-config/app-config.service';
import { Config, ConfigSchema } from 'src/app-config/schema/config.schema';
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';
import { XlsService } from 'src/file-generator/xls/xls.service';
import { PdfService } from 'src/file-generator/pdf/pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finder.name, schema: FinderSchema },
      { name: Trade.name, schema: TradeSchema },
      { name: DefaultTrade.name, schema: DefaultTradeSchema },
      { name: Config.name, schema: ConfigSchema },
    ]),
    BullModule.registerQueue({ name: queue.finder }),
    BullModule.registerQueue({ name: queue.trade }),
  ],
  providers: [
    FinderService,
    TradeService, 
    FinderTask,
    FinderProcess,
    AppConfigService,
    TelegramBotService,
    XlsService,
    PdfService,
  ],
  controllers: [FinderController],
})
export class FinderModule {}
