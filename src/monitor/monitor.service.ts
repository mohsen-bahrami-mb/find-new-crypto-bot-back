import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Monitor } from './schema/monitor.schema';
import { Model } from 'mongoose';
@Injectable()
export class MonitorService {
  monitorModel: Model<Monitor>;
  monitorLogCountSize = 6;
  constructor(@InjectModel(Monitor.name) private MonitorModel: Model<Monitor>) {
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
}
