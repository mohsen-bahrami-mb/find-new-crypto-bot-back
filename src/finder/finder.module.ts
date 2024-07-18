import { Module } from '@nestjs/common';
import { FinderService } from './finder.service';
import { FinderController } from './finder.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Finder, FinderSchema } from './schema/finder.schema';
import { TradeService } from 'src/trade/trade.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Finder.name, schema: FinderSchema }]),
  ],
  providers: [FinderService, TradeService],
  controllers: [FinderController],
})
export class FinderModule {}
