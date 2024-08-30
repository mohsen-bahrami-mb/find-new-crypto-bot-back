import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import type * as Puppeteer from 'puppeteer';
import { BinanceNews } from 'src/types/finder.type';
import { Finder, FinderDocument } from './schema/finder.schema';
import { InjectModel } from '@nestjs/mongoose';
import { TradeService } from 'src/trade/trade.service';
import { BrowserService } from 'src/browser/browser.service';
import { ConfigDto } from './dto/config.dto';
import { Config } from './schema/config.schema';

@Injectable()
export class FinderService {
  logger = new Logger(FinderService.name);
  LINK_BINANCE_NEW_CRYPTO_LIST = process.env.LINK_BINANCE_NEW_CRYPTO_LIST;
  config: ConfigDto = {
    timezone: undefined,
    finderStartAt: undefined,
    finderEndAt: undefined,
  };

  finderModel: Model<Finder>;
  configModel: Model<Config>;

  private page: Puppeteer.Page;

  constructor(
    @InjectModel(Finder.name) private FinderModel: Model<Finder>,
    @InjectModel(Config.name) private ConfigModel: Model<Config>,
    private readonly tradeService: TradeService,
    private browserService: BrowserService,
  ) {
    this.finderModel = FinderModel;
    this.configModel = ConfigModel;
  }

  async onApplicationBootstrap() {
    if (this.browserService.browser) await this.initPage();
  }

  async getConfig() {
    if (
      this.config.timezone ||
      this.config.finderStartAt ||
      this.config.finderEndAt
    ) {
      return this.config;
    }
    const dbConfig = await this.configModel.findOne();
    if (dbConfig) {
      this.config = {
        finderEndAt: dbConfig.finderEndAt,
        finderStartAt: dbConfig.finderStartAt,
        timezone: dbConfig.timezone,
      };
      return this.config;
    }
    return this.config;
  }

  async putConfig(body: ConfigDto) {
    this.config = body;
    await this.configModel.findOneAndUpdate({}, body);
    return this.config;
  }

  public async initPage() {
    this.page?.close();
    this.page = await this.browserService.browser.newPage();
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
      this.logger.error(`Cannot get data from binance - ${error}`, error.stack);
    }
  }

  private async isNewOne(newsList: BinanceNews[]) {
    let result: BinanceNews[] = [];
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
      const result = (await this.finderModel.insertMany(
        newCryptos,
      )) as FinderDocument[];
      await this.tradeService.newCryptos(result);
    }
  }
}
