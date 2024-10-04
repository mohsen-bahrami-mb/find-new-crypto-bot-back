import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { random } from 'src/utils/random';
import { TradeService } from '../trade.service';

@Injectable()
export class TradeTask {
  private readonly logger = new Logger(TradeTask.name);

  constructor(
    @InjectQueue(queue.trade) private tradeQueue: Queue,
    private tradeService: TradeService,
  ) {}
  @Cron('*/2 * * * * *')
  async checkCryptos() {
    setTimeout(
      async () => {
        await this.tradeQueue.add(
          queueJob.checkTradesInProccess,
          {},
          { removeOnComplete: true },
        );
      },
      random(800, 1300),
    );
  }

  @Cron('20 */3 * * * *')
  async MexcAllWalletCryptoReload() {
    await this.tradeService.MexcAllWalletCryptoReload();
  }

  @Cron('55 */3 * * * *')
  async checkLogins() {
    setTimeout(
      async () => {
        await this.tradeQueue.add(
          queueJob.checkLogins,
          {},
          { removeOnComplete: true },
        );
      },
      random(3000, 10000),
    );
  }
}
