import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { Inject, Logger } from '@nestjs/common';
import { TradeService } from '../trade.service';
import { FinderDocument } from 'src/finder/schema/finder.schema';
import { TradeBroker } from 'src/enums/trade.enum';

@Processor(queue.trade)
export class TradeProcess {
  private readonly logger = new Logger(TradeProcess.name);
  timeAvaliable = NaN;
  constructor(@Inject() private tradeService: TradeService) {}

  @Process(queueJob.checkLogins)
  async checkLogins(job: Job<unknown>) {
    this.tradeService.MexcUserIsLogin();
    // deactive gate website
    // this.tradeService.GateIoUserIsLogin();
  }

  @Process(queueJob.buyChecking)
  async buyChecking(
    job: Job<{ crypto: FinderDocument; broker: keyof typeof TradeBroker }>,
  ) {
    this.tradeService.buyChecking(job.data.crypto, job.data.broker);
  }

  @Process(queueJob.checkTradesInProccess)
  async checkTradesInProccess(job: Job<unknown>) {
    if (!this.timeAvaliable || this.timeAvaliable < Date.now()) {
      this.tradeService.checkCryptosInProccess();
      this.timeAvaliable = Date.now() + 3000;
    }
  }

  @Process(queueJob.newCryptos)
  async newCryptos(job: Job<{ result: FinderDocument[] }>) {
    this.tradeService.newCryptos(job.data.result);
  }
}
