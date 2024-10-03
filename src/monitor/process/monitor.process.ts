import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { Inject, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { MonitorService } from '../monitor.service';
import { MonitorLogDto } from '../dto/monitor.dto';

@Processor(queue.monitor)
export class MonitorProcess {
  private readonly logger = new Logger(MonitorProcess.name);
  timeAvaliable = NaN;
  constructor(@Inject() private monitorService: MonitorService) {}

  @Process(queueJob.addMonitorLog)
  async updateFinderDoc(job: Job<{ monitorLogs: MonitorLogDto[] }>) {
    await this.monitorService.generateMonitorLog(job.data.monitorLogs);
  }
}
