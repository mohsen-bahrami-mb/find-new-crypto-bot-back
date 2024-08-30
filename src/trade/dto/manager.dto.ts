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

  /** (0 - 1) * 100% */ 
  @IsOptional()
  @IsNumber()
  percentOfAmount: number;
}

export class EndPositionsPriceDto {
  /** (0 - 1) * 100% */ 
  @IsOptional()
  @IsNumber()
  tp: number;

  /** (0 - 1) * 100% */ 
  @IsOptional()
  @IsNumber()
  sl: number;

  /** (0 - 1) * 100% */ 
  @IsOptional()
  @IsNumber()
  percentOfAmount: number;
}
