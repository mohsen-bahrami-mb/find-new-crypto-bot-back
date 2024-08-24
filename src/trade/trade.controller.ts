import { Body, Controller, Get, Param, Put, Req, Res } from '@nestjs/common';
import { TradeService } from './trade.service';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { SnapshotDtoParams } from './dto/snapshot.dto';

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
  getManager(@Req() req: Request) {
    // send configs if default is exist. costants exist in app to make faster bot. if app has not. find it in db
  }
  @Put('manager')
  PutManager(@Req() req: Request, @Body() body: any) {
    // update configs in app const and db
  }
  @Get('manager/:id')
  getIdManager(@Req() req: Request, @Param('id') id: Types.ObjectId) {
    // send configs if default is exist. costants exist in app to make faster bot. if app has not. find it in db
  }
  @Put('manager/:id')
  PutIdManager(
    @Req() req: Request,
    @Param('id') id: Types.ObjectId,
    @Body() body: any,
  ) {
    // update configs in app const and db
  }
}
