import type { EndPositionsPrice } from 'src/types/trade.type';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export class ManagerDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EndPositionsPriceDto)
  endPositionsPrice: EndPositionsPriceDto[];

  @IsOptional()
  @IsNumber()
  maximumRequstTime: number;

  @IsOptional()
  @IsNumber()
  percentOfAmount: number;
}

export class EndPositionsPriceDto {
  @IsOptional()
  @IsNumber()
  tp: number;

  @IsOptional()
  @IsNumber()
  sl: number;

  @IsOptional()
  @IsNumber()
  percentOfAmount: number;
}
