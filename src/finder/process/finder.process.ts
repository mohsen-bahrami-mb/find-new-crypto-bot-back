import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { queue } from 'src/types/redis.enum';
import { Inject, Logger } from '@nestjs/common';
import { FinderService } from '../finder.service';

@Processor(queue.finder)
export class FinderProcess {
  private readonly logger = new Logger(FinderProcess.name);

  constructor(@Inject() private finderService: FinderService) {}

  @Process('try_check')
  async tryit(job: Job<unknown>) {
    try {
      console.log(job.id);
      await this.finderService.checkTargetNews();
    } catch (err) {
      console.log(err.stack);
    }
  }
}
