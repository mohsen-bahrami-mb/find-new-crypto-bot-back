import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { AppConfigService } from 'src/app-config/app-config.service';
import bcrypt from 'bcrypt';
import internal from 'stream';

@Injectable()
export class TelegramBotService {
  public bot: TelegramBot;
  private TELEGRAM_TOKEN: string | undefined = process.env.TELEGRAM_TOKEN;
  private HOST: string | undefined = process.env.HOST;

  private readonly logger = new Logger(TelegramBotService.name);

  constructor(private appConfigService: AppConfigService) {
    if (this.TELEGRAM_TOKEN) {
      this.startBot(this.TELEGRAM_TOKEN);
    }
  }

  public startBot(token: string) {
    this.initBot(token);
    this.onStart();
    this.onCheckPassword();
  }

  public async sendMessage(msg: string) {
    await Promise.all(
      this.appConfigService.config.telegramValidChatIds.map(async (chatId) => {
        await this.bot.sendMessage(chatId, msg);
      }),
    );
  }
  public async sendDoc(
    doc: string | internal.Stream | Buffer,
    filename: string,
  ) {
    await Promise.all(
      this.appConfigService.config.telegramValidChatIds.map(async (chatId) => {
        await this.bot.sendDocument(chatId, doc, {}, { filename });
      }),
    );
  }

  private initBot(token: string) {
    this.bot = new TelegramBot(token, { webHook: true });
    this.bot.setWebHook(`${this.HOST}/telegram-bot`);
  }

  private onStart() {
    this.bot.onText(/\/start/i, async (msg) => {
      const chatId = msg.chat.id;
      if (this.appConfigService.config.telegramValidChatIds.includes(chatId))
        this.bot.sendMessage(chatId, 'you are connected to server...');
      else this.bot.sendMessage(chatId, 'please send password...');
    });
  }

  private onCheckPassword() {
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;
      const isValidPassword = bcrypt.compareSync(text, 'hash');
      if (this.appConfigService.config.telegramValidChatIds.includes(chatId))
        this.bot.sendMessage(chatId, 'you are connected to server...');
      else if (isValidPassword) {
        this.bot.sendMessage(chatId, 'successed connect to server ;)');
      } else this.bot.sendMessage(chatId, 'failed connect to server! :(');
    });
  }
}
