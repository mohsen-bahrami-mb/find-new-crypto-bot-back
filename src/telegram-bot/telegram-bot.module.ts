import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';
import { AppConfigService } from 'src/app-config/app-config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Config, ConfigSchema } from 'src/app-config/schema/config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
  ],
  providers: [TelegramBotService, AppConfigService],
  controllers: [TelegramBotController]
})
export class TelegramBotModule {}
