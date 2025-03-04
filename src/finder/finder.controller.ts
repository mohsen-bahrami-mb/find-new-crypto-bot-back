import { Body, Controller, Get } from '@nestjs/common';
import { FinderService } from './finder.service';
import { InjectQueue } from '@nestjs/bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { Queue } from 'bull';

@Controller('finder')
export class FinderController {
  // constructor(private readonly finderService: FinderService) {}
  constructor(@InjectQueue(queue.finder) private finderQueue: Queue) {}

  // @Get('')
  // async test() {
  // await this.finderQueue.add(
  //   queueJob.checkNews,
  //   {},
  //   // { removeOnComplete: true, attempts: 1, backoff: 5000 },
  // );
  // }
}
