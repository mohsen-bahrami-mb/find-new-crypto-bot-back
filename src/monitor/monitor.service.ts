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

  async getTailLogs(count?: string) {
    let fromCount = Number(count);
    const docCount = await this.monitorModel.countDocuments();
    if (
      Number.isNaN(fromCount) ||
      (!Number.isNaN(fromCount) && fromCount > docCount)
    )
      fromCount = docCount - this.monitorLogCountSize;
    const result = await this.monitorModel
      .find({ count: { $gt: fromCount } })
      .sort({ count: 1 })
      .limit(this.monitorLogCountSize);
    return result;
  }
  async getHeadLogs(count: string) {
    const fromCount = Number(count);
    if (Number.isNaN(fromCount)) return [];
    let result = await this.monitorModel
      .find({ count: { $lt: fromCount } })
      .sort({ count: -1 })
      .limit(this.monitorLogCountSize);
    result = result.sort((a, b) => {
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      return 0;
    });
    return result;
  }

  async addNewMonitorLog(data: MonitorLogDto[]) {
    const docCount = await this.monitorModel.countDocuments();
    const maopData = data.map((d, i) => ({
      count: docCount + i + 1,
      type: d.type,
      log: d.log,
    }));
    const insertData = await this.monitorModel.insertMany(maopData);
    const result = insertData.map((d) => d.toObject());
    this.monitorGateway.addTailLogs(result);
  }
}
