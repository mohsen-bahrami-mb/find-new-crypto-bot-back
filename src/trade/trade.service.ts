import { Injectable, Logger } from '@nestjs/common';
import * as Puppeteer from 'puppeteer';
import { BrowserService } from 'src/browser/browser.service';
import { BinanceNews } from 'src/types/finder.type';

@Injectable()
export class TradeService {
  maximumRequstTime = 20000; // in miliseconds
  LINK_BINANCE_NEW_CRYPTO_LIST = process.env.LINK_BINANCE_NEW_CRYPTO_LIST;
  logger = new Logger();

  private page: Puppeteer.Page;

  constructor(private browserService: BrowserService) {}

  async onApplicationBootstrap() {
    if (this.browserService.browser) await this.initPage();
  }

  public async initPage() {
    this.page = await this.browserService.browser.newPage();
  }

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
