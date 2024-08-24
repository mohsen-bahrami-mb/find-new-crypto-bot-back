import { IsEnum, IsString } from 'class-validator';

export class SnapshotDtoParams {
  @IsString()
  @IsEnum(['mexc', 'gate'])
  broker: 'mexc' | 'gate';
}
