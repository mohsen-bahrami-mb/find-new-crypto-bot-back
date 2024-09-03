import { Injectable, Logger } from '@nestjs/common';
import type * as Puppeteer from 'puppeteer';
import puppeteer from 'puppeteer';
import { MonitorLogType } from 'src/enums/monitor.enum';
import { MonitorService } from 'src/monitor/monitor.service';

@Injectable()
export class BrowserService {
  CHROME_APP_PATH = process.env.CHROME_APP_PATH;
  logger = new Logger(BrowserService.name);
  browser: Puppeteer.Browser;

  constructor(private monitorService: MonitorService) {}

  async onApplicationBootstrap() {
    await this.initBrowser();
  }

  async beforeApplicationShutdown() {
    await this.closeBrowserPage();
  }

  async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        executablePath: this.CHROME_APP_PATH,
      });
    } catch (error) {
      const log = 'cannot open browser';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
    }
  }

  async closeBrowserPage() {
    try {
      await this.browser?.close();
      return true;
    } catch (error) {
      const log = 'cannot close browser';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
      return false;
    }
  }
}
