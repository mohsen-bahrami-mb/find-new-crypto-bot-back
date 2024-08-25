import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { TradeService } from './trade.service';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { SnapshotDtoParams } from './dto/snapshot.dto';
import { EndPositionsPriceDto, ManagerDto } from './dto/manager.dto';
import { StatementParamDto, StatementQueryDto } from './dto/statement.dto';

@Controller('trade')
export class TradeController {
  constructor(readonly tradeService: TradeService) {}

  @Get()
  test() {
    return this.tradeService.GateIoCheckCryptoExist('BTC');
  }
  @Get('snapshot/:broker')
  brokerSnapshot(@Res() res: Response, @Param() params: SnapshotDtoParams) {
    return this.tradeService.brokerSnapshot(res, params);
  }
  @Get('brokerState')
  getBrokerState() {
    return {
      gate: { isLogin: this.tradeService.isLoginGateIoPage },
      mexc: { isLogin: this.tradeService.isLoginMexcPage },
    };
  }
  @Get('manager')
  getManager() {
    return this.tradeService.getManager();
  }
  @Put('manager')
  PutManager(@Body() body: ManagerDto) {
    return this.tradeService.putManager(body);
  }
  @Get('statement')
  getStatement(@Query() query: StatementQueryDto) {
    return this.tradeService.getStatement(query);
  }
  @Get(':id/statement')
  getIdStatement(@Param() param: StatementParamDto) {
    return this.tradeService.getIdStatement(param);
  }
  @Put(':id/statement')
  PutIdStatement(
    @Param() param: StatementParamDto,
    @Body() body: EndPositionsPriceDto[],
  ) {
    return this.tradeService.putIdStatement(param, body);
  }
}
