import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { Inject, Logger } from '@nestjs/common';
import { FinderService } from '../finder.service';

@Processor(queue.finder)
export class FinderProcess {
  private readonly logger = new Logger(FinderProcess.name);
  timeAvaliable = NaN;
  constructor(@Inject() private finderService: FinderService) {}

  @Process(queueJob.checkNews)
  async tryit(job: Job<unknown>) {
    try {
      if (!this.timeAvaliable || this.timeAvaliable < Date.now()) {
        await this.finderService.checkTargetNews();
        this.timeAvaliable = Date.now() + 3000;
      }
    } catch (err) {
      this.logger.error(err, err.stack);
    }
  }
}
