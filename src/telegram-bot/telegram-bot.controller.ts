import { Controller, Post, Req } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { Request } from 'express';

@Controller('telegram-bot')
export class TelegramBotController {
  constructor(private readonly botService: TelegramBotService) {}

  @Post()
  handleUpdate(@Req() req: Request) {
    const update = req.body;
    this.botService.bot.processUpdate(update);
  }
}
