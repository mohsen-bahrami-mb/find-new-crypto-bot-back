import { Injectable } from '@nestjs/common';
import { BinanceNews } from 'src/types/finder.type';

@Injectable()
export class TradeService {
  maximumRequstTime = 20000; // in miliseconds
  public newCryptos(newCryptosList: BinanceNews[]) {
    const whiteList = newCryptosList
      .map((crypto) => {
        const startTime = crypto.request_start.getTime();
        const endTime = crypto.request_end.getTime();
        if (startTime - endTime < this.maximumRequstTime) return crypto;
        else return undefined;
      })
      .filter((crypto) => crypto);
    console.log({ whiteList });
    // start to disde trade and save on mongo in ohter functions
    // cron job to check the trade in cron job
  }
}
