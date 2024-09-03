import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { Config } from './schema/config.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigDto } from './dto/config.dto';
import * as bcrypt from 'bcrypt';
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';
import { MonitorService } from 'src/monitor/monitor.service';
import { MonitorLogType } from 'src/enums/monitor.enum';

@Injectable()
export class AppConfigService {
  logger = new Logger(AppConfigService.name);
  config: ConfigDto = {
    username: 'root',
    password: 'Aa@123456',
    telegramToken: undefined,
    telegramValidChatIds: [],
    timezone: undefined,
    finderStartAt: undefined,
    finderEndAt: undefined,
  };

  configModel: Model<Config>;

  constructor(
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
    @Inject(forwardRef(() => TelegramBotService))
    private telegramBotService: TelegramBotService,
    private monitorService: MonitorService,
  ) {
    this.configModel = ConfigModel;
  }

  async onApplicationBootstrap() {
    const conf = await this.configModel.findOne({});
    if (conf) {
      this.config = conf.toObject();
    } else {
      const salt = bcrypt.genSaltSync(10);
      const password = bcrypt.hashSync(this.config.password, salt);
      await this.configModel.create({
        password,
        username: this.config.username,
      });
    }
  }

  async getConfig(returnAll: boolean = false): Promise<ConfigDto> {
    const returnFn = returnAll
      ? this.returnAllConfig.name
      : this.returnConfig.name;
    try {
      const dbConfig = await this.configModel.findOne({});
      if (dbConfig) this.config = dbConfig.toObject();
    } catch (error) {
      const log = 'find config in db is failed';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
    return this[returnFn]();
  }

  async putConfig(body: ConfigDto) {
    const updateObj = { ...body };
    if (!updateObj.password) updateObj.password = this.config.password;
    delete updateObj.username;
    delete updateObj.createdAt;
    delete updateObj.updatedAt;
    try {
      const newConfig = await this.configModel.findOneAndUpdate({}, updateObj, {
        new: true,
      });
      this.config = newConfig;
    } catch (error) {
      const log = 'find config in db is failed';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
    if (this.config.telegramToken)
      this.telegramBotService.startBot(this.config.telegramToken);
    return this.config;
  }

  private returnConfig() {
    return {
      finderEndAt: this.config.finderEndAt,
      finderStartAt: this.config.finderStartAt,
      timezone: this.config.timezone,
      telegramToken: this.config.telegramToken,
      username: this.config.username,
    };
  }

  private returnAllConfig() {
    return {
      finderEndAt: this.config.finderEndAt,
      finderStartAt: this.config.finderStartAt,
      timezone: this.config.timezone,
      telegramToken: this.config.telegramToken,
      telegramValidChatIds: this.config.telegramValidChatIds,
      password: this.config.password,
      username: this.config.username,
    };
  }
}
