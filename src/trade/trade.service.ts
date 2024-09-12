// موارد باقی مانده:

// بخاطر اینکه کال استک جاوااسکرپت پر نشه صدا زدن این فانکشن ها باید توی صف باشه و توش دیتا ست بشه
// دیتایی که به فانکشن خرید داده میشه همون مواردیه که از فایندر پیدا شده. و دیتای چکر ایدی دیتابیس ترید میشه

// فانکشن چکر روی صفحات گیت و مکسی
// فانکشن چکر در مواقع خرید باید از طرف بقیه موارد این فانکشن بن بشه
// فانکشن سلر بایید برای گیت و مکسی زده بشه

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as Puppeteer from 'puppeteer';
import { BrowserService } from 'src/browser/browser.service';
import { Response, Request } from 'express';
import { Model, Types } from 'mongoose';
import { Trade, TradeDocument } from './schema/trade.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SnapshotDtoParams } from './dto/snapshot.dto';
import { DefaultTrade } from './schema/defaultTrade.schema';
import { EndPositionsPriceDto, ManagerDto } from './dto/manager.dto';
import { StatementParamDto, StatementQueryDto } from './dto/statement.dto';
import { TradeBroker, TradeState } from 'src/enums/trade.enum';
import { FinderDocument } from 'src/finder/schema/finder.schema';
import {
  ChosenTradeOfPageManagment,
  TradeOfPageManagment,
} from 'src/types/trade.type';
import { MonitorService } from 'src/monitor/monitor.service';
import { MonitorLogType } from 'src/enums/monitor.enum';

@Injectable()
export class TradeService {
  logger = new Logger();
  LINK_GATEIO_LOGIN_PAGE = 'https://www.gate.io/login';
  LINK_GATEIO_TRADE_PAGE = 'https://www.gate.io/trade';
  LINK_MEXC_LOGIN_PAGE = 'https://www.mexc.com/login';
  LINK_MEXC_TRADE_PAGE = 'https://www.mexc.com/exchange';
  BaseCryptoSymbol = 'USDT';
  GateIoPage: Puppeteer.Page;
  MexcPage: Puppeteer.Page;
  isLoginGateIoPage = false;
  isLoginMexcPage = false;
  /** in miliseconds */ maximumRequstTime = 20000;
  /** (0 - 1) * 100% */ percentOfAmount = 1;
  GateAvailableMoney: number;
  MexcAvailableMoney: number;
  defaultEndPositionsPrice: EndPositionsPriceDto[] = [];
  isCheckBrokerCryptosBusy: boolean = false;

  tradeModle: Model<Trade>;
  defaultTradeModle: Model<DefaultTrade>;

  constructor(
    private browserService: BrowserService,
    private monitorService: MonitorService,
    @InjectModel(Trade.name) private TradeModle: Model<Trade>,
    @InjectModel(DefaultTrade.name)
    private DefaultTradeModle: Model<DefaultTrade>,
  ) {
    this.tradeModle = TradeModle;
    this.defaultTradeModle = DefaultTradeModle;
  }

  async onApplicationBootstrap() {
    if (this.browserService.browser) {
      await this.initGateIoPage();
      await this.initMexcPage();
    }
    const defaultTrader = await this.defaultTradeModle.findOne({});
    if (defaultTrader) {
      this.defaultEndPositionsPrice = defaultTrader.endPositionsPrice;
      this.maximumRequstTime = defaultTrader.maximumRequstTime;
      this.percentOfAmount = defaultTrader.percentOfAmount;
    } else {
      const saveRes = {
        endPositionsPrice: this.defaultEndPositionsPrice,
        maximumRequstTime: this.maximumRequstTime,
        percentOfAmount: this.percentOfAmount,
      };
      try {
        await this.defaultTradeModle.create(saveRes);
      } catch (error) {
        const log = 'cannot create default trade in db';
        this.logger.error(log, error.stack);
        this.monitorService.addNewMonitorLog([
          { type: MonitorLogType.error, log },
        ]);
      }
    }
  }

  // api
  async getManager() {
    if (
      this.defaultEndPositionsPrice?.length &&
      this.maximumRequstTime &&
      this.percentOfAmount
    ) {
      return returns.bind(this)();
    }
    const dbDefault = await this.defaultTradeModle.findOne();
    if (dbDefault) {
      this.defaultEndPositionsPrice = dbDefault.endPositionsPrice;
      this.maximumRequstTime = dbDefault.maximumRequstTime;
      this.percentOfAmount = dbDefault.percentOfAmount;
      return returns.bind(this)();
    }
    return returns.bind(this)();
    function returns() {
      return {
        endPositionsPrice: this.defaultEndPositionsPrice,
        maximumRequstTime: this.maximumRequstTime,
        percentOfAmount: this.percentOfAmount,
      };
    }
  }

  async putManager(body: ManagerDto) {
    try {
      await this.defaultTradeModle.findOneAndUpdate({}, body);
      this.defaultEndPositionsPrice =
        body?.endPositionsPrice || this.defaultEndPositionsPrice;
      this.maximumRequstTime = body.maximumRequstTime;
      this.percentOfAmount = body.percentOfAmount;
      return {
        endPositionsPrice: this.defaultEndPositionsPrice,
        maximumRequstTime: this.maximumRequstTime,
        percentOfAmount: this.percentOfAmount,
      };
    } catch (error) {
      const log = 'cannot update trade manager in db';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    }
  }

  async getStatement({ limit = 0, skip = 0 }: StatementQueryDto) {
    return await this.tradeModle.find().limit(limit).skip(skip);
  }

  async getIdStatement({ id }: StatementParamDto) {
    const trade = await this.tradeModle.findById(id);
    if (!trade)
      return new NotFoundException('Not Found Trade', {
        description: `Not Found Trade id: ${id}`,
      });
    return trade;
  }

  async patchIdStatement(
    { id }: StatementParamDto,
    body: EndPositionsPriceDto[],
  ) {
    const trade = await this.tradeModle.findById(id);
    if (
      !trade ||
      [TradeState.endTrade, TradeState.startFailed].includes(trade.state)
    )
      return new NotFoundException('Not Found Trade', {
        description: `Not Found Trade id: ${id}`,
      });
    const newEndPos = [...trade.endPositionsPrice];
    body.forEach((endPos, index) => {
      if (!newEndPos?.[index]?.endPrice) newEndPos[index] = endPos;
    });
    try {
      return await trade.updateOne(
        { endPositionsPrice: newEndPos },
        { new: true },
      );
    } catch (error) {
      const log =
        'cannot update trade statment manager: ' + trade._id.toString();
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    }
  }

  async initGateIoPage() {
    try {
      this.GateIoPage?.close();
      this.GateIoPage = await this.browserService.browser.newPage();
      await this.GateIoPage.setViewport({ width: 1200, height: 700 });
    } catch (error) {
      const log = 'wrong on opening the init Gate page';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    }
  }

  async initMexcPage() {
    try {
      this.MexcPage?.close();
      this.MexcPage = await this.browserService.browser.newPage();
      await this.MexcPage.setViewport({ width: 1200, height: 700 });
    } catch (error) {
      const log = 'wrong on opening the init Mexc page';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    }
  }

  async sendSnapshot(res: Response, page: Puppeteer.Page) {
    try {
      const screenshot = await page.screenshot({ encoding: 'base64' });
      const pic = Buffer.from(screenshot, 'base64');
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=login-page.jpg',
      );
      return res.send(pic);
    } catch (error) {
      const log = `cannot take snapshot from: ${page.url()}`;
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
      throw new InternalServerErrorException();
    }
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
  async newCryptos(newCryptosList: FinderDocument[]) {
    const whiteList = newCryptosList
      .map((crypto) => {
        const startTime = crypto.requestStart.getTime();
        const endTime = crypto.requestEnd.getTime();
        if (startTime - endTime < this.maximumRequstTime) return crypto;
        else return undefined;
      })
      .filter((crypto) => crypto);
    if (!whiteList.length) {
      const findedCryptos = newCryptosList
        .map((c) => c.cryptoSymbol)
        .join(', ');
      const log = `Time limit did not allow to buy cryptos finded: ${findedCryptos}`;
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.info, log },
      ]);
      return;
    }
    // just select first one for trade. based on the employer document
    const buy = await this.buyIsAppropriate(whiteList[0]);
    const log = `Try to buy ${whiteList[0].cryptoSymbol} crypto in ${buy.broker} broker. Broker message: ${buy.notif}`;
    this.monitorService.addNewMonitorLog([{ type: MonitorLogType.info, log }]);
    while (true) {
      const checker = await this.checkSaveTrade(whiteList[0], buy.broker);
      if (!checker) {
        const log = `Buying ${whiteList[0].cryptoSymbol} in ${buy.broker} broker is successed.`;
        this.monitorService.addNewMonitorLog([
          { type: MonitorLogType.success, log },
        ]);
        break;
      }
      if (checker.state === TradeState.startFailed) {
        const log = `Buying ${whiteList[0].cryptoSymbol} in ${buy.broker} broker was failed.`;
        this.monitorService.addNewMonitorLog([
          { type: MonitorLogType.error, log },
        ]);
        break;
      }
    }
  }

  private timeAppropriateFromNow(requestEnd?: Date) {
    return requestEnd?.getTime() - Date.now() < this.maximumRequstTime;
  }

  private async buyIsAppropriate({ cryptoSymbol, requestEnd }: FinderDocument) {
    const existOnGateIoBuy = await this.GateIoCheckCryptoExist(cryptoSymbol);
    if (existOnGateIoBuy && this.timeAppropriateFromNow(requestEnd)) {
      let notif: string | undefined;
      const broker = TradeBroker.gate;
      try {
        notif = await this.GateIoBuyCrypto();
        return { notif, broker };
      } catch (error) {
        return { notif: 'buying process had wrong', broker };
      }
    }

    const existOnMexcBuy = await this.MexcCheckCryptoExist(cryptoSymbol);
    if (existOnMexcBuy && this.timeAppropriateFromNow(requestEnd)) {
      let notif: string | undefined;
      const broker = TradeBroker.mexc;
      try {
        notif = await this.MexcBuyCrypto();
        return { notif, broker };
      } catch (error) {
        return { notif: 'buying process had wrong', broker };
      }
    }
  }

  private async checkSaveTrade(
    crypto: FinderDocument,
    broker: keyof typeof TradeBroker,
  ): Promise<TradeDocument | void> {
    const cryptoPairSymbol = `${crypto.cryptoSymbol}_${this.BaseCryptoSymbol}`;
    let succedFullTradeStart: boolean = false;
    let newStartPositionPrice: number;
    let newStartPositionAmount: number;

    const tradeOfPageManagment = await this.checkBrokerCryptos(broker, true);
    if (tradeOfPageManagment) checkTradeStatus(tradeOfPageManagment);

    if (succedFullTradeStart) return;

    const existTrade = await this.tradeModle.findOne({
      cryptoPairSymbol: cryptoPairSymbol,
    });

    try {
      if (existTrade && this.timeAppropriateFromNow(crypto.requestEnd))
        return await existTrade.updateOne(
          {
            startPositionsPrice: [
              ...existTrade.startPositionsPrice,
              newStartPositionPrice,
            ],
            startPositionAmount:
              existTrade.startPositionAmount + newStartPositionAmount,
          },
          { new: true },
        );
      else if (!existTrade && this.timeAppropriateFromNow(crypto.requestEnd)) {
        const trade = await this.tradeModle.create({
          broker,
          cryptoPairSymbol,
          state: TradeState.onTrade,
          cryptoName: crypto.cryptoName,
          cryptoSymbol: crypto.cryptoSymbol,
          startPositionsPrice: [newStartPositionPrice],
          startPositionAmount: newStartPositionAmount,
          endPositionsPrice: this.defaultEndPositionsPrice.map((def) => ({
            tp: def.tp,
            sl: def.sl,
            percentOfAmount: def.percentOfAmount,
          })),
        });
        await crypto.updateOne({ trade: trade._id });
        return trade;
      } else if (!existTrade && !this.timeAppropriateFromNow(crypto.requestEnd))
        return await this.tradeModle.create({
          broker,
          cryptoPairSymbol,
          state: TradeState.startFailed,
          cryptoName: crypto.cryptoName,
          cryptoSymbol: crypto.cryptoSymbol,
        });
    } catch (error) {
      const log = 'Cannot update or create trade itme in db.';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    }

    function checkTradeStatus({
      tradeList,
      acountAmount,
    }: TradeOfPageManagment) {
      let result: ChosenTradeOfPageManagment;
      tradeList?.map((t) => {
        if (
          t.symbol === cryptoPairSymbol &&
          t.amount / acountAmount >
            this.GateAvailableMoney * (this.percentOfAmount - 0.05) // to ensure the fee: 5 percent tolerance
        ) {
          succedFullTradeStart = true;
          newStartPositionAmount = t.amount;
          result = t;
        }
      });
      return result;
    }
  }

  // تا اینجا پیام ها هندل شده
  /** this function check db to recive to target or position and call seller function */
  private async manageCryptos(
    { tradeList }: TradeOfPageManagment | undefined,
    broker: keyof typeof TradeBroker,
  ) {
    await Promise.all(
      tradeList.map(async (t) => {
        if (t.amount > 1) {
          const existTrade = await this.tradeModle.findOne({
            state: TradeState.onTrade,
            cryptoSymbol: t.symbol,
          });
          let sellAmount = NaN;
          let state = existTrade.state;
          let endPrice = { index: NaN, value: NaN };
          // check is target or stop lost toched
          existTrade.endPositionsPrice.forEach((endP, index, arr) => {
            const slPrice =
              endP.sl *
              existTrade.startPositionsPrice[0] *
              (index === 0 ? 1 : arr[index - 1].tp);
            if (!endP.endPrice && slPrice >= t.price) {
              sellAmount = t.amount;
              state = TradeState.endTrade;
              endPrice = { index, value: t.price };
            }
            if (
              !endP.endPrice &&
              existTrade.startPositionsPrice[0] * endP.tp <= t.price
            ) {
              sellAmount =
                endP.percentOfAmount * existTrade.startPositionAmount;
              endPrice = { index, value: t.price };
            }
          });
          // call sell in borkers and pass sellAmount and update sellAmount and endAmount
          const sellData = await this.sellBrokerCryptos(
            broker,
            t.symbol,
            sellAmount,
          );
          if (!sellData) return;
          const { sellAmountBroker, endPositionPriceBroker } = sellData;
          sellAmount = sellAmountBroker;
          await existTrade.updateOne({
            state,
            endPositionsPrice: [
              ...existTrade.endPositionsPrice,
              endPositionPriceBroker,
            ],
            endPositionAmount: (existTrade.endPositionAmount ?? 0) + sellAmount,
          });
        }
      }),
    );
  }

  public async checkCryptosInProccess() {
    const gatePageManagment = await this.checkBrokerCryptos(TradeBroker.gate);
    if (gatePageManagment)
      await this.manageCryptos(gatePageManagment, TradeBroker.gate);
    const mexcPageManagment = await this.checkBrokerCryptos(TradeBroker.mexc);
    if (mexcPageManagment)
      await this.manageCryptos(mexcPageManagment, TradeBroker.mexc);
  }

  private async checkBrokerCryptos(
    broker: keyof typeof TradeBroker,
    isBusy?: boolean,
  ): Promise<TradeOfPageManagment | undefined> {
    if (this.isCheckBrokerCryptosBusy) return;
    if (isBusy) this.isCheckBrokerCryptosBusy = true;
    let result: TradeOfPageManagment = undefined;
    try {
      if (broker === TradeBroker.gate) {
        // call check in broker
        // return await (async () => {});
      }
      if (broker === TradeBroker.mexc) {
        // call check in broker
        // return await (async () => {});
      }
    } finally {
      this.isCheckBrokerCryptosBusy = false;
      return result;
    }
  }

  private async sellBrokerCryptos(
    broker: keyof typeof TradeBroker,
    cryptoSymbol: string,
    sellAmount: number,
  ): Promise<
    | {
        sellAmountBroker: number;
        endPositionPriceBroker: number;
      }
    | undefined
  > {
    let result: {
      sellAmountBroker: number;
      endPositionPriceBroker: number;
    } = undefined;
    if (broker === TradeBroker.gate) {
      // call sell in broker
      // return await (async () => {});
    }
    if (broker === TradeBroker.mexc) {
      // call sell in broker
      // return await (async () => {});
    }
    return result;
  }

  // gateio trade
  async GateIoCheckCryptoExist(cryptoSymbol: string) {
    if (!(await this.GateIoUserIsLogin())) return;
    // check cryto exist with usdt
    const trade_symbol = `${cryptoSymbol}_${this.BaseCryptoSymbol}`;
    const rgxPattern = /(.+\/)(.+)$/g;
    await this.GateIoPage.goto(
      `${this.LINK_GATEIO_TRADE_PAGE}/${trade_symbol}`,
    );
    const url = this.GateIoPage.url();
    const matchPath = [...url.matchAll(rgxPattern)][0][2];
    if (trade_symbol === matchPath) return true;
    return false;
  }

  async GateIoUserIsLogin() {
    if (this.isLoginGateIoPage) return true;
    const loginBtn = await this.GateIoPage.$('#loginLink');
    if (loginBtn) return false;
    this.isLoginGateIoPage = true;
    return true;
  }

  async GateIoBuyCrypto() {
    const { notifHTMLStr, availAbleMoney } = await this.GateIoPage.evaluate(
      (percentOfAmount) => {
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
        ).value = (100 * percentOfAmount).toFixed(2);
        // buy action
        const availAbleMoney: string = undefined;
        (document.querySelector(buyBtnSelector) as HTMLElement).click();
        const notifHTMLStr =
          document.querySelector(notifListSelector).innerHTML;
        return { notifHTMLStr, availAbleMoney };
      },
      this.percentOfAmount,
    );
    this.GateAvailableMoney = Number(availAbleMoney) ?? 0;
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
  async MexcCheckCryptoExist(cryptoSymbol: string) {
    if (!(await this.MexcUserIsLogin())) return;
    // check cryto exist with usdt;
    const trade_symbol = `${cryptoSymbol}_${this.BaseCryptoSymbol}`;
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
    if (!noCrypto) return true;
    return false;
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
    this.MexcAvailableMoney = Number(availableMoney) ?? 0;
    await this.MexcPage.type(
      'input[data-testid=spot-trade-buyTotal]',
      (this.MexcAvailableMoney * this.percentOfAmount).toFixed(2),
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
    const qrHoverToShowSeloctor = '.Form_qrcodeTxt__8TIo0';
    const qrCodeSelector = '.QrcodeLogin_qrcode__IGJHy';
    if (!this.browserService.browser) await this.browserService.initBrowser();
    if (!this.MexcPage) await this.initMexcPage();
    await this.MexcPage.goto(this.LINK_MEXC_LOGIN_PAGE);
    await this.MexcPage.hover(qrHoverToShowSeloctor);
    await this.MexcPage.waitForSelector(qrCodeSelector);
    // send screenshot for clinet to accept login
    return this.sendSnapshot(res, this.MexcPage);
  }

  async MexcAllWalletCrypto() {}
  async MexcCryptoState() {}
  async MexcCloseCryptoPosition() {}
}
