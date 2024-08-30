import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Config } from './schema/config.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigDto } from './dto/config.dto';

@Injectable()
export class AppConfigService {
  logger = new Logger(AppConfigService.name);
  config: ConfigDto = {
    telegramToken: undefined,
    telegramValidChatIds: [],
    timezone: undefined,
    finderStartAt: undefined,
    finderEndAt: undefined,
  };

  configModel: Model<Config>;

  constructor(
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
  ) {
    this.configModel = ConfigModel;
  }

  async getConfig() {
    if (
      this.config.telegramToken ||
      this.config.timezone ||
      this.config.finderStartAt ||
      this.config.finderEndAt
    ) {
      return this.config;
    }
    const dbConfig = await this.configModel.findOne();
    if (dbConfig) {
      this.config = {
        finderEndAt: dbConfig.finderEndAt,
        finderStartAt: dbConfig.finderStartAt,
        timezone: dbConfig.timezone,
        telegramToken: dbConfig.telegramToken,
        telegramValidChatIds: dbConfig.telegramValidChatIds,
      };
      return this.config;
    }
    return this.config;
  }

  async putConfig(body: ConfigDto) {
    this.config = body;
    await this.configModel.findOneAndUpdate({}, body);
    return this.config;
  }
}
