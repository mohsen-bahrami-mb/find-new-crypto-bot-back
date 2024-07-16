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
      headless: false,
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
      const data = await this.page.evaluate((list_cssSelector) => {
        const list = document.querySelectorAll(list_cssSelector)[1];
        const target = [];
        list.querySelectorAll('div > div').forEach((el) => {
          const result = {
            url: el.querySelector('a').href,
            newsTitle: el.querySelector('div').innerText,
            date: el.querySelector('div h6').innerHTML,
          };
          result.newsTitle = result.newsTitle.slice(
            0,
            result.newsTitle.length - result.date.length,
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
}
