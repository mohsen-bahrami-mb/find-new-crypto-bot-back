import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Config, ConfigSchema } from 'src/app-config/schema/config.schema';
import { AppConfigService } from 'src/app-config/app-config.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: process.env.JWT_SECRET_KEY,
        // signOptions: { expiresIn: '60s' },
      }),
    }),
  ],
  providers: [AuthService, AppConfigService, TelegramBotService],
  controllers: [AuthController],
})
export class AuthModule {}
