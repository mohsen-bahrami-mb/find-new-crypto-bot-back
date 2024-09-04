import { Transform } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';

export class ConfigDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  telegramToken?: string;

  @IsOptional()
  @IsArray({ each: true })
  @IsOptional()
  @IsString()
  telegramValidChatIds?: (string | number)[];

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  finderStartAt?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  finderEndAt?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : null))
  @IsDate()
  updatedAt?: Date;
}
