import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorGateway } from './monitor.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Monitor, MonitorSchema } from './schema/monitor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Monitor.name, schema: MonitorSchema }]),
  ],
  providers: [MonitorService, MonitorGateway],
})
export class MonitorModule {}
