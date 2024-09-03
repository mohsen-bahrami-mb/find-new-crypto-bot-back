import { IsEnum, IsNumber, IsString } from 'class-validator';
import { MonitorLogType } from 'src/enums/monitor.enum';

export class MonitorLogDto {
  @IsNumber()
  count?: number;

  @IsEnum(MonitorLogType)
  type: MonitorLogType;

  @IsString()
  log: string;
}
