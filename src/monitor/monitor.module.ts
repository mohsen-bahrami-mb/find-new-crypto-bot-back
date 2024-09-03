import { Global, Module } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorGateway } from './monitor.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Monitor, MonitorSchema } from './schema/monitor.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Monitor.name, schema: MonitorSchema }]),
  ],
  providers: [MonitorService, MonitorGateway],
  exports: [MonitorService],
})
export class MonitorModule {}
