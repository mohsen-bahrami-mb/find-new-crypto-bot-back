import { Types } from 'mongoose';
import {
  IsArray,
  IsMongoId,
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class StatementQueryDto {
  @IsOptional()
  @IsNumberString()
  skip?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;
}

export class StatementParamDto {
  @IsMongoId()
  id: Types.ObjectId;
}
