import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { Inject, Logger } from '@nestjs/common';
import { FinderService } from '../finder.service';
import { FinderDocument } from '../schema/finder.schema';
import { Types } from 'mongoose';

@Processor(queue.finder)
export class FinderProcess {
  private readonly logger = new Logger(FinderProcess.name);
  timeAvaliable = NaN;
  constructor(@Inject() private finderService: FinderService) {}

  @Process(queueJob.checkNews)
  async checkTargetNews(job: Job<unknown>) {
    if (!this.timeAvaliable || this.timeAvaliable < Date.now()) {
      await this.finderService.checkTargetNews();
      this.timeAvaliable = Date.now() + 3000;
    }
  }

  @Process(queueJob.updateFinderDoc)
  async updateFinderDoc(job: Job<{ id: string | Types.ObjectId; doc: FinderDocument }>) {
    await this.finderService.updateFinderDoc(job.data.id, job.data.doc);
  }
}
