import {
  IsArray,
  IsDate,
  IsEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsString()
  telegramValidChatIds?: (string | number)[];

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsDate()
  finderStartAt?: Date;

  @IsOptional()
  @IsDate()
  finderEndAt?: Date;

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}
