import { Controller, Get, Param } from '@nestjs/common';
import { TradeService } from './trade.service';

@Controller('trade')
export class TradeController {
  constructor(readonly tradeService: TradeService) {}

  @Get( )
  test() {
    return this.tradeService.GateIoCheckCryptoExist("BTC");
  }
}
