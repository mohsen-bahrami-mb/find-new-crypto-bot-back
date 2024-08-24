import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as Puppeteer from 'puppeteer';
import { BrowserService } from 'src/browser/browser.service';
import { BinanceNews } from 'src/types/finder.type';
import { Response, Request } from 'express';
import { Model } from 'mongoose';
import { Trade } from './schema/trade.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SnapshotDtoParams } from './dto/snapshot.dto';

@Injectable()
export class TradeService {
  LINK_GATEIO_LOGIN_PAGE = 'https://www.gate.io/login';
  LINK_GATEIO_TRADE_PAGE = 'https://www.gate.io/trade';
  LINK_MEXC_LOGIN_PAGE = 'https://www.mexc.com/login';
  LINK_MEXC_TRADE_PAGE = 'https://www.mexc.com/exchange';
  GateIoPage: Puppeteer.Page;
  MexcPage: Puppeteer.Page;
  isLoginGateIoPage = false;
  isLoginMexcPage = false;
  maximumRequstTime = 20000; // in miliseconds
  logger = new Logger();
  tradeModle: Model<Trade>;
  defaultEndPositionsPrice: { tp: number; ls: number } = { tp: null, ls: null };

  constructor(
    private browserService: BrowserService,
    @InjectModel(Trade.name) private TradeModle: Model<Trade>,
  ) {
    this.tradeModle = TradeModle;
  }

  async onApplicationBootstrap() {
    if (this.browserService.browser) {
      await this.initGateIoPage();
      await this.initMexcPage();
    }
  }

  async initGateIoPage() {
    this.GateIoPage?.close();
    this.GateIoPage = await this.browserService.browser.newPage();
    await this.GateIoPage.setViewport({ width: 1200, height: 700 });
  }

  async initMexcPage() {
    this.MexcPage?.close();
    this.MexcPage = await this.browserService.browser.newPage();
    await this.MexcPage.setViewport({ width: 1200, height: 700 });
  }

  async sendSnapshot(res: Response, page: Puppeteer.Page) {
    const screenshot = await page.screenshot({ encoding: 'base64' });
    const pic = Buffer.from(screenshot, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', 'attachment; filename=login-page.jpg');
    return res.send(pic);
  }

  async brokerSnapshot(res: Response, { broker }: SnapshotDtoParams) {
    if (broker === 'gate') {
      if (this.isLoginGateIoPage)
        return this.sendSnapshot(res, this.GateIoPage);
      return this.GateIoLoginPage(res);
    }
    if (broker === 'mexc') {
      if (this.isLoginMexcPage) return this.sendSnapshot(res, this.MexcPage);
      return this.MexcLoginPage(res);
    }
    throw new BadRequestException('Invalid Param', {
      cause: new Error(),
      description: 'set param [mexc | gate]',
    });
  }

  // logic
  newCryptos(newCryptosList: BinanceNews[]) {
    const whiteList = newCryptosList
      .map((crypto) => {
        const startTime = crypto.request_start.getTime();
        const endTime = crypto.request_end.getTime();
        if (startTime - endTime < this.maximumRequstTime) return crypto;
        else return undefined;
      })
      .filter((crypto) => crypto);
    console.log({ whiteList });
    // موارد سرویس فایندر رو توی ترای کش هندل کنم کامل و فاینالیش رو هم بررسی کنم
    // اول باید بره که خرید رو بزنه و اونو ذخیره کنه و در اخر تحت هر شرایطی چک کردن رو صدا بزنه
    // فانکشن چک کردن باید زمان نهایی که برای مهلت ترید ثبت شده و یا اینکه ترید کامل انجام شده باشه رو چک کنه
    // و درصورت تموم شدن مهلت یا کامل بودن دوباره همین فانکشن رو کال نمکنه و در غیر این صورت این فانکشن کال میشه
    // بخاطر اینکه کال استک جاوااسکرپت پر نشه صدا زدن این فانکشن ها باید توی صف باشه و توش دیتا ست بشه
    // دیتایی که به فانکشن خرید داده میشه همون مواردیه که از فایندر پیدا شده. و دیتای چکر ایدی دیتابیس ترید میشه

    // start to disde trade and save on mongo in ohter functions
    // cron job to check the trade in cron job
  }

  async sellCrypto() {
    // this function check db to recive to target or position
    // change target? call it
    // change stop? call it
    // returns sell bool
  }
  async changeTarget() {}
  async changeStop() {}

  // gateio trade
  async GateIoCheckCryptoExist(crypto_symbol: string) {
    if (!(await this.GateIoUserIsLogin())) return;
    // check cryto exist with usdt
    const trade_symbol = `${crypto_symbol}_USDT`;
    const rgxPattern = /(.+\/)(.+)$/g;
    await this.GateIoPage.goto(
      `${this.LINK_GATEIO_TRADE_PAGE}/${trade_symbol}`,
    );
    const url = this.GateIoPage.url();
    const matchPath = [...url.matchAll(rgxPattern)][0][2];
    if (trade_symbol === matchPath) await this.GateIoBuyCrypto();
  }

  async GateIoUserIsLogin() {
    if (this.isLoginGateIoPage) return true;
    const loginBtn = await this.GateIoPage.$('#loginLink');
    if (loginBtn) return false;
    this.isLoginGateIoPage = true;
    return true;
  }

  async GateIoBuyCrypto() {
    const notifHTMLStr = await this.GateIoPage.evaluate(() => {
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

  async GateIoAllWalletCrypto() {}
  async GateIoCryptoState() {}
  async GateIoCloseCryptoPosition() {}

  async GateIoLoginPage(res: Response) {
    const qrCodeSelector = '#loginQRCode canvas';
    if (!this.browserService.browser) await this.browserService.initBrowser();
    if (!this.GateIoPage) await this.initGateIoPage();
    await this.GateIoPage.goto(this.LINK_GATEIO_LOGIN_PAGE);
    await this.GateIoPage.waitForSelector(qrCodeSelector);
    // send screenshot for clinet to accept login
    return this.sendSnapshot(res, this.GateIoPage);
  }

  // mexc trade
  async MexcCheckCryptoExist(crypto_symbol: string) {
    if (!(await this.MexcUserIsLogin())) return;
    // check cryto exist with usdt;
    const trade_symbol = `${crypto_symbol}_USDT`;
    await this.MexcPage.goto(`${this.LINK_MEXC_TRADE_PAGE}/${trade_symbol}`);
    const noCrypto = await this.MexcPage.evaluate(() => {
      const closeBtnPopUpSelector = 'button.ant-modal-close';
      const noCryptoSelector = '.error_tip__cFQf4';
      const noCrypto = document.querySelector<HTMLElement | undefined | null>(
        noCryptoSelector,
      );
      const closeBtnPopUp = document.querySelector<
        HTMLElement | undefined | null
      >(closeBtnPopUpSelector);
      closeBtnPopUp?.click();
      return noCrypto;
    });
    if (!noCrypto) await this.MexcBuyCrypto();
  }

  async MexcUserIsLogin() {
    if (this.isLoginMexcPage) return true;
    const loginBtnSelector = '.header_registerBtn__fsUiv.header_authBtn__Gch60';
    const loginBtn = await this.MexcPage.$(loginBtnSelector);
    const url = this.MexcPage.url();
    if (url !== this.LINK_MEXC_LOGIN_PAGE && loginBtn) {
      return false;
    } else if (url !== this.LINK_MEXC_LOGIN_PAGE && !loginBtn) {
      this.isLoginMexcPage = true;
      return true;
    } else {
      return undefined;
    }
  }

  async MexcBuyCrypto() {
    const availableMoney = await this.MexcPage.evaluate(() => {
      const marketOrderTypeSelector =
        '.actions_textNowarp__3QcjB.actions_mode__nRnKJ';
      const availableMoneySelector = '.actions_itemContent__qOMXm';
      const unitMoneySelector = '.actions_unitsSpace__i8C7j';
      const amountMoneySelector = '.actions_valueContent__8bSMo';
      ([...document.querySelectorAll(marketOrderTypeSelector)] as HTMLElement[])
        .filter((el) => el.innerText.toLowerCase() === 'market')[0]
        ?.click();
      // get available money
      const availableMoney = [
        ...document.querySelectorAll(availableMoneySelector),
      ]
        .filter(
          (el) =>
            el.querySelector(unitMoneySelector).textContent.toLowerCase() ===
            'usdt',
        )[0]
        .querySelector(amountMoneySelector).textContent;
      return availableMoney;
    });
    // set amount money to buy crypto
    await this.MexcPage.type(
      'input[data-testid=spot-trade-buyTotal]',
      availableMoney,
    );
    // buy action and get notif
    const buyBtnSelector = 'button[data-testid=spot-trade-orderBuyBtn]';
    const notifSelector = '.ant-message';
    const notifHTMLStr = await this.MexcPage.evaluate(
      (buyBtnSelector, notifSelector) => {
        document.querySelector<HTMLElement>(buyBtnSelector).click();
        const notifHTMLStr =
          document.querySelector<HTMLElement>(notifSelector).textContent;
        return notifHTMLStr;
      },
      buyBtnSelector,
      notifSelector,
    );
    return notifHTMLStr;
  }

  async MexcLoginPage(res: Response) {
    const qrCodeSelector = '.QrcodeLogin_qrcode__IGJHy';
    if (!this.browserService.browser) await this.browserService.initBrowser();
    if (!this.MexcPage) await this.initMexcPage();
    await this.MexcPage.goto(this.LINK_MEXC_LOGIN_PAGE);
    await this.MexcPage.waitForSelector(qrCodeSelector);
    // send screenshot for clinet to accept login
    return this.sendSnapshot(res, this.MexcPage);
  }

  async MexcAllWalletCrypto() {}
  async MexcCryptoState() {}
  async MexcCloseCryptoPosition() {}
}
