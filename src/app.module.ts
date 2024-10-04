import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FinderModule } from './finder/finder.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TradeModule } from './trade/trade.module';
import { BrowserModule } from './browser/browser.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { MonitorModule } from './monitor/monitor.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { AppConfigModule } from './app-config/app-config.module';
import { FileGeneratorModule } from './file-generator/file-generator.module';
import { AuthModule } from './auth/auth.module';
import { AllExceptionsFilter } from './utils/exceptions/allExceptionsFilter';
import { APP_FILTER } from '@nestjs/core';

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
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        maxRetriesPerRequest: 100,
      },
    }),
    ScheduleModule.forRoot(),
    FinderModule,
    TradeModule,
    BrowserModule,
    MonitorModule,
    TelegramBotModule,
    AppConfigModule,
    FileGeneratorModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
