import { Injectable } from '@nestjs/common';
import { BinanceNews } from 'src/types/finder.type';

@Injectable()
export class TradeService {
  public newCryptos(newCryptosList: BinanceNews[]) {
    // start to disde trade and save on mongo in ohter functions
    // cron job to check the trade in cron job
  }
}
