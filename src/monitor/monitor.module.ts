import { Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorGateway } from './monitor.gateway';

@Module({
  providers: [MonitorService, MonitorGateway],
})
export class MonitorModule {}
