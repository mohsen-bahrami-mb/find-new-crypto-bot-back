import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';
import { queue } from 'src/enums/redis.enum';
import { random } from 'src/utils/random';
import { TradeService } from '../trade.service';

@Injectable()
export class TradeTask {
  private readonly logger = new Logger(TradeTask.name);

  constructor(
    @InjectQueue(queue.trade) private tradeQueue: Queue,
    private tradeService: TradeService,
  ) {}
  @Cron('*/6 * * * * *')
  async handleCron() {
    setTimeout(
      () => {
        this.tradeService.checkCryptosInProccess();
      },
      random(800, 1300),
    );
  }
}
