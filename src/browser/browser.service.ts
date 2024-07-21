import { Injectable, Logger } from '@nestjs/common';
import type * as Puppeteer from 'puppeteer';
import puppeteer from 'puppeteer';

@Injectable()
export class BrowserService {
  CHROME_APP_PATH = process.env.CHROME_APP_PATH;
  logger = new Logger();
  browser: Puppeteer.Browser;

  async onApplicationBootstrap() {
    await this.initBrowser();
  }

  async beforeApplicationShutdown() {
    await this.closeBrowserPage();
  }

  async initBrowser() {
    this.browser = await puppeteer.launch({
      headless: false,
      executablePath: this.CHROME_APP_PATH,
    });
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
}
