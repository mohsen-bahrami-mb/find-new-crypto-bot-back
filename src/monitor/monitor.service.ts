import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Monitor } from './schema/monitor.schema';
import { MonitorLogDto } from './dto/monitor.dto';
import { MonitorGateway } from './monitor.gateway';

@Injectable()
export class MonitorService {
  monitorModel: Model<Monitor>;
  monitorLogCountSize = 6;

  constructor(
    @InjectModel(Monitor.name) private MonitorModel: Model<Monitor>,
    @Inject(forwardRef(() => MonitorGateway))
    private monitorGateway: MonitorGateway,
  ) {
    this.monitorModel = MonitorModel;
  }

  async getTailLogs(count: string) {
    const fromCount = Number(count);
    if (Number.isNaN(fromCount)) return [];
    const result = await this.monitorModel
      .find({ count: { $gt: count } })
      .sort({ count: 1 })
      .limit(this.monitorLogCountSize);
    return result;
  }
  async getHeadLogs(count: string) {
    const fromCount = Number(count);
    if (Number.isNaN(fromCount)) return [];
    const result = await this.monitorModel
      .find({ count: { $lt: count } })
      .sort({ count: 1 })
      .limit(this.monitorLogCountSize);
    return result;
  }

  async addNewMonitorLog(data: MonitorLogDto[]) {
    const insertData = await this.monitorModel.insertMany(data);
    const result = insertData.map((d) => d.toObject());
    this.monitorGateway.addTailLogs(result);
  }
}
