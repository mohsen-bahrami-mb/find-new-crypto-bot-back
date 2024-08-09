import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FinderService } from '../finder.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { queue } from 'src/types/redis.enum';

@Injectable()
export class FinderTask {
  private readonly logger = new Logger(FinderTask.name);

  constructor(
    @InjectQueue(queue.finder) private finderQueue: Queue,
  ) {}

  @Cron('*/10 * * * * *')
  async handleCron() {
    this.finderQueue.add(
      'try_check',
      { hi: 'hello world' },
      // { removeOnComplete: true },
    );
    this.finderQueue.add(
      'try_check',
      { hi: 'hello world' },
      { removeOnComplete: true },
    );
  }
}
