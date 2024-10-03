import { Global, Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorGateway } from './monitor.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Monitor, MonitorSchema } from './schema/monitor.schema';
import { queue } from 'src/enums/redis.enum';
import { BullModule } from '@nestjs/bull';
import { MonitorProcess } from './process/monitor.process';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Monitor.name, schema: MonitorSchema }]),
    BullModule.registerQueue({ name: queue.monitor }),
  ],
  providers: [MonitorService, MonitorGateway, MonitorProcess],
  exports: [MonitorService],
})
export class MonitorModule {}
