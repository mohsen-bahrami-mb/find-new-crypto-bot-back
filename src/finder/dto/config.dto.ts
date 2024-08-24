import { IsDate, IsOptional, IsString } from 'class-validator';

export class ConfigDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsDate()
  finderStartAt?: Date;

  @IsOptional()
  @IsDate()
  finderEndAt?: Date;
}
