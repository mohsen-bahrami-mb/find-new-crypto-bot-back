import { Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Config, ConfigSchema } from './schema/config.schema';
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
  ],
  providers: [AppConfigService, TelegramBotService],
  controllers: [AppConfigController],
})
export class AppConfigModule {}
