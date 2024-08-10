import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import type * as Puppeteer from 'puppeteer';
import { BinanceNews } from 'src/types/finder.type';
import { Finder } from './schema/finder.schema';
import { InjectModel } from '@nestjs/mongoose';
import { TradeService } from 'src/trade/trade.service';
import { BrowserService } from 'src/browser/browser.service';

@Injectable()
export class FinderService {
  LINK_BINANCE_NEW_CRYPTO_LIST = process.env.LINK_BINANCE_NEW_CRYPTO_LIST;
  logger = new Logger(FinderService.name);

  finderModel: Model<Finder>;

  private page: Puppeteer.Page;

  constructor(
    @InjectModel(Finder.name) private FinderModel: Model<Finder>,
    private readonly tradeService: TradeService,
    private browserService: BrowserService,
  ) {
    this.finderModel = FinderModel;
  }

  async onApplicationBootstrap() {
    if (this.browserService.browser) await this.initPage();
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
      const request_start = new Date();
      await this.page.goto(this.LINK_BINANCE_NEW_CRYPTO_LIST);
      await this.page.waitForSelector(list_cssSelector);
      // scarping - chose section
      let data: BinanceNews[] = await this.page.evaluate((list_cssSelector) => {
        const list = document.querySelectorAll(list_cssSelector)[1];
        let target = [];
        list.querySelectorAll('div > div').forEach((el) => {
          const result = {
            news_url: el.querySelector('a')?.href,
            news_title: el.querySelector('div')?.innerText,
            news_date: el.querySelector('div h6')?.innerHTML,
          };
          result.news_title = result.news_title.slice(
            0,
            result.news_title.length - result.news_date.length,
          );
          target.push(result);
        });
        return target;
      }, list_cssSelector);
      const request_end = new Date();
      data = data.map((news) => ({
        ...news,
        request_start,
        request_end,
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
        const crypto_name_rgx = new RegExp(news?.crypto_name, 'i');
        const crypto_symbol_rgx = new RegExp(news?.crypto_symbol, 'i');
        const news_date = new Date(news.news_date);
        const cryptos = await this.finderModel.find({
          $and: [
            {
              $or: [
                { crypto_name: { $regex: crypto_name_rgx } },
                { crypto_symbol: { $regex: crypto_symbol_rgx } },
              ],
            },
            {
              news_date: { $gte: news_date },
            },
          ],
        });
        if (!cryptos.length) {
          result.push({
            ...news,
            news_date,
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
        const matched = item?.news_title
          ? [...item.news_title.matchAll(rgxPattern)]?.[0]
          : [];
        if (matched) {
          return {
            ...item,
            crypto_name: matched?.[1],
            crypto_symbol: matched?.[2],
          };
        } else return undefined;
      })
      .filter((item) => item);
    const newCryptos = await this.isNewOne(newCryptoWillList);
    if (newCryptos.length) {
      await this.finderModel.insertMany(newCryptos);
      this.tradeService.newCryptos(newCryptos);
    }
  }
}
