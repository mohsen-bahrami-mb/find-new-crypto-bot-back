import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { AppConfigService } from 'src/app-config/app-config.service';
import * as bcrypt from 'bcrypt';
import internal from 'stream';
import { MonitorService } from 'src/monitor/monitor.service';
import { MonitorLogType } from 'src/enums/monitor.enum';

@Injectable()
export class TelegramBotService {
  public bot: TelegramBot;
  private TELEGRAM_TOKEN: string | undefined = process.env.TELEGRAM_TOKEN;
  private HOST: string | undefined = process.env.HOST;

  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    @Inject(forwardRef(() => AppConfigService))
    private appConfigService: AppConfigService,
    private monitorService: MonitorService,
  ) {}

  async onApplicationBootstrap() {
    const config = await this.appConfigService.getConfig(true);
    const token = config.telegramToken || this.TELEGRAM_TOKEN;
    if (token) this.startBot(token);
  }

  public startBot(token: string) {
    this.initBot(token);
    this.onStart();
    this.onCheckPassword();
  }

  public async sendMessage(msg: string) {
    try {
      await Promise.all(
        this.appConfigService.config.telegramValidChatIds.map(
          async (chatId) => {
            await this.bot.sendMessage(chatId, msg);
          },
        ),
      );
    } catch (error) {
      const log = 'send text messsage in telegram bot is faield';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
  }
  public async sendDoc(
    doc: string | internal.Stream | Buffer,
    filename: string,
  ) {
    try {
      await Promise.all(
        this.appConfigService.config.telegramValidChatIds.map(
          async (chatId) => {
            await this.bot.sendDocument(chatId, doc, {}, { filename });
          },
        ),
      );
    } catch (error) {
      const log = 'send documents in telegram bot is faield';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
  }

  private initBot(token: string) {
    this.bot = new TelegramBot(token, { webHook: true });
    this.bot.setWebHook(`${this.HOST}/telegram-bot`);
  }

  private onStart() {
    this.bot.onText(/\/start/i, async (msg) => {
      const config = this.appConfigService.config;
      const chatId = msg.chat.id;
      if (config.telegramValidChatIds.includes(chatId))
        this.bot.sendMessage(chatId, 'you are connected to server...');
      else this.bot.sendMessage(chatId, 'please send password...');
    });
  }

  private onCheckPassword() {
    this.bot.on('message', async (msg) => {
      const config = this.appConfigService.config;
      const chatId = msg.chat.id;
      const text = msg.text;
      const isValidPassword = bcrypt.compareSync(text, config.password);
      if (config.telegramValidChatIds.includes(chatId))
        this.bot.sendMessage(chatId, 'you are connected to server...');
      else if (isValidPassword) {
        this.bot.sendMessage(chatId, 'successed connect to server ;)');
      } else this.bot.sendMessage(chatId, 'failed connect to server! :(');
    });
  }
}
