import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { random } from 'src/utils/random';

@Injectable()
export class FinderTask {
  private readonly logger = new Logger(FinderTask.name);

  constructor(@InjectQueue(queue.finder) private finderQueue: Queue) {}

  @Cron('*/4 * * * * *')
  async handleCron() {
    setTimeout(
      () => {
        this.finderQueue.add(
          queueJob.checkNews,
          {},
          { removeOnComplete: true },
        );
      },
      random(800, 1300),
    );
  }
}
