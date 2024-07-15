import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class FinderService {
  CHROME_APP_PATH = process.env.CHROME_APP_PATH;
  LINK_BINANCE_NEW_CRYPTO_LIST = process.env.LINK_BINANCE_NEW_CRYPTO_LIST;

  logger = new Logger();

  async newsList() {
    const list_cssSelector = '.css-14d7djd .css-5bvwfc + div .css-1q4wrpt';
    try {
      // scarping - open browser
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: this.CHROME_APP_PATH,
      });
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const acceptedResourceTypes = ['document', 'xhr', 'fetch', 'script'];
        if (acceptedResourceTypes.includes(resourceType)) {
          request.continue();
        } else {
          request.abort();
        }
      });
      // scarping - load page
      await page.goto(this.LINK_BINANCE_NEW_CRYPTO_LIST);
      await page.waitForSelector(list_cssSelector);
      // scarping - chose section
      const data = await page.evaluate((list_cssSelector) => {
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
      console.log({ data });
      await browser.close();
      return data;
    } catch (error) {
      this.logger.error(error, error.stack);
    }
  }
}
