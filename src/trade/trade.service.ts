import { Injectable, Logger } from '@nestjs/common';
import * as Puppeteer from 'puppeteer';
import { BrowserService } from 'src/browser/browser.service';
import { BinanceNews } from 'src/types/finder.type';
import { Response, Request } from 'express';

@Injectable()
export class TradeService {
  maximumRequstTime = 20000; // in miliseconds
  LINK_GATEIO_LOGIN_PAGE = 'https://www.gate.io/login';
  LINK_GATEIO_TRADE_PAGE = 'https://www.gate.io/trade';
  logger = new Logger();
  gateIoPage: Puppeteer.Page;

  constructor(private browserService: BrowserService) {}

  async onApplicationBootstrap() {
    if (this.browserService.browser) await this.initGateIoPage();
  }

  public async initGateIoPage() {
    this.gateIoPage = await this.browserService.browser.newPage();
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

  async GateIoCheckCryptoExist() {
    if (!(await this.GateIoUserIsLogin())) return;
    // check cryto exist with usdt
    const crypto_symbol = 'ZRO';
    const trade_symbol = `${crypto_symbol}_USDT`;
    const rgxPattern = /(.+\/)(.+)$/g;
    await this.gateIoPage.goto(
      `${this.LINK_GATEIO_TRADE_PAGE}/${trade_symbol}`,
    );
    const url = this.gateIoPage.url();
    const matchPath = [...url.matchAll(rgxPattern)][0][2];
    if (trade_symbol === matchPath) await this.GateIoBuyCrypto();
  }

  async GateIoUserIsLogin() {
    const loginBtn = await this.gateIoPage.$('#loginLink');
    if (loginBtn) return false;
    return true;
  }

  async GateIoBuyCrypto() {
    const notifHTMLStr = await this.gateIoPage.evaluate(() => {
      const marketOrderTypeSelector =
        '.tr-font-medium.trade-mode-list-item span';
      const availablePrecentageSelector =
        '.mantine-GateSlider-root.mantine-Slider-root.gui-font-face.mantine-1l1492h input';
      const buyBtnSelector =
        '.mantine-UnstyledButton-root.mantine-GateButton-root.mantine-Button-root.gui-font-face.mantine-11d65fe';
      const notifListSelector = '#noty_toast_layout_container';
      // change order tab to buy on the moment
      document.querySelector<HTMLElement>(marketOrderTypeSelector).click();
      // set perecentage for buy amount of crypto
      document.querySelector<HTMLInputElement>(
        availablePrecentageSelector,
      ).value = '100';
      // buy action
      (document.querySelector(buyBtnSelector) as HTMLElement).click();
      return document.querySelector(notifListSelector).innerHTML;
    });
    return notifHTMLStr;
  }

  async GateIoLoginPage(res: Response) {
    if (!this.browserService.browser) await this.browserService.initBrowser();
    if (!this.gateIoPage) await this.initGateIoPage();
    await this.gateIoPage.setViewport({ width: 1200, height: 700 });
    await this.gateIoPage.goto(this.LINK_GATEIO_LOGIN_PAGE);
    await this.gateIoPage.waitForSelector('#loginQRCode canvas');
    const screenshot = await this.gateIoPage.screenshot({ encoding: 'base64' });
    // send screenshot for clinet to accept login
    const pic = Buffer.from(screenshot, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', 'attachment; filename=login-page.jpg');
    return res.send(pic);
  }
}
