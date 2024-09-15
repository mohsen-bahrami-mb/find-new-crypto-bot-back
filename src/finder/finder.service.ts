import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import type * as Puppeteer from 'puppeteer';
import { BinanceNews } from 'src/types/finder.type';
import { Finder, FinderDocument } from './schema/finder.schema';
import { InjectModel } from '@nestjs/mongoose';
import { TradeService } from 'src/trade/trade.service';
import { BrowserService } from 'src/browser/browser.service';
import { MonitorService } from 'src/monitor/monitor.service';
import { MonitorLogType } from 'src/enums/monitor.enum';
import { AppConfigService } from 'src/app-config/app-config.service';

@Injectable()
export class FinderService {
  logger = new Logger(FinderService.name);
  LINK_BINANCE_NEW_CRYPTO_LIST =
    'https://www.binance.com/en/support/announcement/new-cryptocurrency-listing?c=48&navId=48&hl=en';

  finderModel: Model<Finder>;

  private page: Puppeteer.Page;

  constructor(
    @InjectModel(Finder.name) private FinderModel: Model<Finder>,
    private appConfigService: AppConfigService,
    private tradeService: TradeService,
    private browserService: BrowserService,
    private monitorService: MonitorService,
  ) {
    this.finderModel = FinderModel;
  }

  async onApplicationBootstrap() {
    if (this.browserService.browser) await this.initPage();
  }

  public async initPage() {
    try {
      this.page?.close();
      this.page = await this.browserService.browser.newPage();
    } catch (error) {
      const log = 'cannot init binance page in browser';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
  }

  private async newsList() {
    try {
      if (!this.browserService.browser) return;
      if (!this.page) await this.initPage();
      const list_cssSelector = '.css-14d7djd .css-5bvwfc + div .css-1q4wrpt';
      // scarping - load page
      const requestStart = new Date();
      await this.page.goto(this.LINK_BINANCE_NEW_CRYPTO_LIST);
      await this.page.waitForSelector(list_cssSelector);
      // scarping - chose section
      let data: BinanceNews[] = await this.page.evaluate((list_cssSelector) => {
        const list = document.querySelectorAll(list_cssSelector)[1];
        let target = [];
        list.querySelectorAll('div > div').forEach((el) => {
          const result = {
            newsUrl: el.querySelector('a')?.href,
            newsTitle: el.querySelector('div')?.innerText,
            newsDate: el.querySelector('div h6')?.innerHTML,
          };
          result.newsTitle = result.newsTitle.slice(
            0,
            result.newsTitle.length - result.newsDate.length,
          );
          target.push(result);
        });
        return target;
      }, list_cssSelector);
      const requestEnd = new Date();
      data = data.map((news) => ({
        ...news,
        requestStart,
        requestEnd,
      }));
      return data;
    } catch (error) {
      const log = 'Cannot get data from binance';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
  }

  private async isNewOne(newsList: BinanceNews[]) {
    let result: BinanceNews[] = [];
    try {
      await Promise.all(
        newsList.map(async (news) => {
          const cryptoName_rgx = new RegExp(news?.cryptoName, 'i');
          const cryptoSymbol_rgx = new RegExp(news?.cryptoSymbol, 'i');
          const newsDate = new Date(news.newsDate);
          const cryptos = await this.finderModel.find({
            $and: [
              {
                $or: [
                  { cryptoName: { $regex: cryptoName_rgx } },
                  { cryptoSymbol: { $regex: cryptoSymbol_rgx } },
                ],
              },
              {
                newsDate: { $gte: newsDate },
              },
            ],
          });
          if (!cryptos.length) {
            result.push({
              ...news,
              newsDate,
            });
          }
        }),
      );
    } catch (error) {
      const log = 'cannot check on db finded crypto is new';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
    return result;
  }

  async checkTargetNews() {
    const newList = await this.newsList();
    const rgxPattern = /Binance Will List (.+) \((.+)\).* with .+/gi;

    const newCryptoWillList = newList
      .map((item) => {
        const matched = item?.newsTitle
          ? [...item.newsTitle.matchAll(rgxPattern)]?.[0]
          : [];
        if (matched) {
          return {
            ...item,
            cryptoName: matched?.[1],
            cryptoSymbol: matched?.[2],
          };
        } else return undefined;
      })
      .filter((item) => item);
    const newCryptos = await this.isNewOne(newCryptoWillList);
    if (newCryptos.length) {
      try {
        const result = (await this.finderModel.insertMany(
          newCryptos,
        )) as FinderDocument[];
        const monitorlogs = newCryptos.map((crypto) => {
          const cryptoName = `${crypto.cryptoName} (${crypto.cryptoSymbol})`;
          const findTime =
            (crypto.requestEnd.getTime() - crypto.requestStart.getTime()) /
            1000;
          return {
            log: ` find crypto ${cryptoName} - find time: ${findTime.toFixed(2)}s`,
            type: MonitorLogType.info,
          };
        });
        this.monitorService.addNewMonitorLog(monitorlogs);
        const startTime = new Date(this.appConfigService.config.finderStartAt);
        const endTime = new Date(this.appConfigService.config.finderEndAt);
        const nowTime = new Date();
        if (nowTime > startTime && nowTime < endTime)
          await this.tradeService.newCryptos(result);
      } catch (error) {
        const log =
          'cannot insert new crypot finded in db, therefore cannot call trade service';
        this.logger.error(log, error.stack);
        this.monitorService.addNewMonitorLog([
          { type: MonitorLogType.error, log: log },
        ]);
      }
    }
  }
  async testStart(binanceNews: BinanceNews[]) {
    // test function - start
    const newList = binanceNews;
    const rgxPattern = /Binance Will List (.+) \((.+)\).* with .+/gi;

    const newCryptoWillList = newList
      .map((item) => {
        const matched = item?.newsTitle
          ? [...item.newsTitle.matchAll(rgxPattern)]?.[0]
          : [];
        if (matched) {
          return {
            ...item,
            cryptoName: matched?.[1],
            cryptoSymbol: matched?.[2],
          };
        } else return undefined;
      })
      .filter((item) => item);
    const newCryptos = await this.isNewOne(newCryptoWillList);
    if (newCryptos.length) {
      try {
        const result = (await this.finderModel.insertMany(
          newCryptos,
        )) as FinderDocument[];
        const monitorlogs = newCryptos.map((crypto) => {
          const cryptoName = `${crypto.cryptoName} (${crypto.cryptoSymbol})`;
          const findTime =
            (crypto.requestEnd.getTime() - crypto.requestStart.getTime()) /
            1000;
          return {
            log: ` find crypto ${cryptoName} - find time: ${findTime.toFixed(2)}s`,
            type: MonitorLogType.info,
          };
        });
        this.monitorService.addNewMonitorLog(monitorlogs);
        const startTime = new Date(this.appConfigService.config.finderStartAt);
        const endTime = new Date(this.appConfigService.config.finderEndAt);
        const nowTime = new Date();
        if (nowTime > startTime && nowTime < endTime)
          await this.tradeService.newCryptos(result);
        return 'call test function successfully';
      } catch (error) {
        const log =
          'cannot insert new crypot finded in db, therefore cannot call trade service';
        this.logger.error(log, error.stack);
        this.monitorService.addNewMonitorLog([
          { type: MonitorLogType.error, log: log },
        ]);
      }
    }
    // test function - end
  }
}
