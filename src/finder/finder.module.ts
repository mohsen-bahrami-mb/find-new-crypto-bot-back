import { Module, OnModuleInit } from '@nestjs/common';
import { FinderService } from './finder.service';
import { FinderController } from './finder.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Finder, FinderSchema } from './schema/finder.schema';
import { TradeService } from 'src/trade/trade.service';
import { Trade, TradeSchema } from 'src/trade/schema/trade.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finder.name, schema: FinderSchema },
      { name: Trade.name, schema: TradeSchema },
    ]),
    // BrowserModule,
  ],
  providers: [FinderService, TradeService],
  controllers: [FinderController],
})
export class FinderModule {}
