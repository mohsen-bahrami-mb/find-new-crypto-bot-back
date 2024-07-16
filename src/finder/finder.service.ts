import { Injectable, Logger } from '@nestjs/common';
import type * as Puppeteer from 'puppeteer';
import puppeteer from 'puppeteer';

@Injectable()
export class FinderService {
  CHROME_APP_PATH = process.env.CHROME_APP_PATH;
  LINK_BINANCE_NEW_CRYPTO_LIST = process.env.LINK_BINANCE_NEW_CRYPTO_LIST;

  logger = new Logger();

  private browser: Puppeteer.Browser;
  private page: Puppeteer.Page;

  async onApplicationBootstrap() {
    await this.initBrowserPage();
  }

  async beforeApplicationShutdown() {
    await this.closeBrowserPage();
  }

  async initBrowserPage() {
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: this.CHROME_APP_PATH,
    });
    this.page = await this.browser.newPage();
  }

  async closeBrowserPage() {
    try {
      await this.browser?.close();
      return true;
    } catch (error) {
      this.logger.error(`Cannot close browser - ${error}`, error.stack);
      return false;
    }
  }

  async newsList() {
    try {
      if (!this.browser) return;
      const list_cssSelector = '.css-14d7djd .css-5bvwfc + div .css-1q4wrpt';
      // scarping - load page
      await this.page.goto(this.LINK_BINANCE_NEW_CRYPTO_LIST);
      await this.page.waitForSelector(list_cssSelector);
      // scarping - chose section
      const data: {
        url: string;
        news_title: string;
        date: string;
      }[] = await this.page.evaluate((list_cssSelector) => {
        const list = document.querySelectorAll(list_cssSelector)[1];
        const target = [];
        list.querySelectorAll('div > div').forEach((el) => {
          const result = {
            news_url: el.querySelector('a').href,
            news_title: el.querySelector('div').innerText,
            news_date: el.querySelector('div h6').innerHTML,
          };
          result.news_title = result.news_title.slice(
            0,
            result.news_title.length - result.news_date.length,
          );
          target.push(result);
        });

        return target;
      }, list_cssSelector);
      return data;
    } catch (error) {
      this.logger.error(`Cannot get data from binance - ${error}`, error.stack);
    }
  }

  async isTargetNews() {
    const newList = await this.newsList();
    const rgxPattern = /Binance Will List (.+) \((.+)\).* with .+/gi;

    const newCryptoWillList = newList
      .map((item) => {
        const matched = [...item.news_title.matchAll(rgxPattern)]?.[0];
        if (matched) {
          return {
            ...item,
            crypto_name: matched[1],
            crypto_symbol: matched[2],
          };
        } else return undefined;
      })
      .filter((item) => item);
      // check is new? (from db)
      // if true -> analys & save on db
      // if false -> reject and don't continue
  }
}
