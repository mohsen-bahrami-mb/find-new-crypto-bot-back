import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FinderModule } from './finder/finder.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeModule } from './trade/trade.module';
import { BrowserModule } from './browser/browser.module';
import { BullModule } from '@nestjs/bullmq';
import { queue } from './types/redis.enum';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.test', '.env.production', '.env'],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: process.env.MONGO_URI,
      }),
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({ name: queue.finder }),
    BullModule.registerQueue({ name: queue.trade }),
    FinderModule,
    TradeModule,
    BrowserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
