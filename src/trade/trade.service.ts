// موارد باقی مانده:

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
  OpenPositionRow,
  TradeOfPageManagment,
} from 'src/types/trade.type';
import { MonitorService } from 'src/monitor/monitor.service';
import { MonitorLogType } from 'src/enums/monitor.enum';
import { InjectQueue } from '@nestjs/bull';
import { queue, queueJob } from 'src/enums/redis.enum';
import { Queue } from 'bull';
import { Spot, Trade as mTrade } from 'mexc-api-sdk';

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
  MexcManageTradePage: Puppeteer.Page;
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
    @InjectQueue(queue.trade) private tradeQueue: Queue,
  ) {
    this.tradeModle = TradeModle;
    this.defaultTradeModle = DefaultTradeModle;
  }

  async onApplicationBootstrap() {
    if (this.browserService.browser) {
      // await this.initGateIoPage(); // deactive gate website
      await this.initMexcPage();
      await this.initMexcTradePage();
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
  async initMexcTradePage() {
    try {
      this.MexcManageTradePage?.close();
      this.MexcManageTradePage = await this.browserService.browser.newPage();
      await this.MexcManageTradePage.setViewport({ width: 1200, height: 700 });
    } catch (error) {
      const log = 'wrong on opening the init Mexc trade page';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
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
    // deactive gate website
    // if (broker === TradeBroker.gate) {
    //   if (await this.GateIoUserIsLogin())
    //     return this.sendSnapshot(res, this.GateIoPage);
    //   return this.GateIoLoginPage(res);
    // }
    if (broker === TradeBroker.mexc) {
      if (await this.MexcUserIsLogin())
        return this.sendSnapshot(res, this.MexcPage);
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
        const startTime = new Date(crypto.requestStart).getTime();
        const endTime = new Date(crypto.requestEnd).getTime();
        if (startTime - endTime < this.maximumRequstTime)
          return Object.assign(crypto, {
            ...crypto,
            createdAt: new Date(crypto.createdAt),
            updatedAt: new Date(crypto.updatedAt),
            newsDate: new Date(crypto.newsDate),
            requestStart: new Date(crypto.requestStart),
            requestEnd: new Date(crypto.requestEnd),
          });
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
    this.isCheckBrokerCryptosBusy = true;
    const buy = await this.buyIsAppropriate(whiteList[0]);
    const log = `Try to buy ${whiteList[0].cryptoSymbol} crypto in ${buy?.broker || 'No'} broker. Broker message: ${buy?.notif || ''}`;
    this.monitorService.addNewMonitorLog([{ type: MonitorLogType.info, log }]);
    // call check buy it in job
    if (buy)
      this.tradeQueue.add(
        queueJob.buyChecking,
        { crypto: whiteList[0], broker: buy.broker },
        { removeOnComplete: true },
      );
    this.isCheckBrokerCryptosBusy = false;
  }

  /** recursive function with cron job or directly call */
  public async buyChecking(
    crypto: FinderDocument,
    broker: keyof typeof TradeBroker,
  ) {
    const checker = await this.checkSaveTrade(crypto, broker);
    if (!checker) {
      const log = `Buying ${crypto.cryptoSymbol} in ${broker} broker is successed.`;
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.success, log },
      ]);
      return;
    }
    if (checker.state === TradeState.startFailed) {
      const log = `Buying ${crypto.cryptoSymbol} in ${broker} broker was failed.`;
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
      return;
    }
    // call recursive if buying is not completed
    this.tradeQueue.add(
      queueJob.buyChecking,
      { crypto, broker },
      { removeOnComplete: true },
    );
  }

  private timeAppropriateFromNow(requestEnd?: Date) {
    return requestEnd?.getTime() - Date.now() < this.maximumRequstTime;
  }

  private async buyIsAppropriate({ cryptoSymbol, requestEnd }: FinderDocument) {
    // deactive gate website
    // const existOnGateIoBuy = await this.GateIoCheckCryptoExist(cryptoSymbol);
    // if (existOnGateIoBuy && this.timeAppropriateFromNow(requestEnd)) {
    //   let notif: string | undefined;
    //   const broker = TradeBroker.gate;
    //   notif = await this.GateIoBuyCrypto();
    //   return { notif, broker };
    // }

    const existOnMexcBuy = await this.MexcCheckCryptoExist(cryptoSymbol);
    if (existOnMexcBuy && this.timeAppropriateFromNow(requestEnd)) {
      let notif: string | undefined;
      const broker = TradeBroker.mexc;
      notif = await this.MexcBuyCrypto();
      return { notif, broker };
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
          if (!existTrade) return;
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
          // call sell in borkers and pass sellAmount and update `positionAmount` (remainAmountBroker)
          const sellData = await this.sellBrokerCryptos(
            broker,
            t.symbol,
            sellAmount,
          );
          if (!sellData) return;
          const { remainAmountBroker, endPositionPriceBroker } = sellData;
          try {
            await existTrade.updateOne({
              state,
              endPositionsPrice: [
                ...existTrade.endPositionsPrice,
                endPositionPriceBroker,
              ],
              positionAmount: remainAmountBroker,
            });
          } catch (error) {
            const log = 'Cannot update trade state for mange it in db.';
            this.logger.error(log, error.stack);
            this.monitorService.addNewMonitorLog([
              { type: MonitorLogType.error, log },
            ]);
          }
        }
      }),
    );
  }

  public async checkCryptosInProccess() {
    // deactive gate website
    // if (this.isLoginGateIoPage) {
    //   const gatePageManagment = await this.checkBrokerCryptos(TradeBroker.gate);
    //   if (gatePageManagment)
    //     await this.manageCryptos(gatePageManagment, TradeBroker.gate);
    // }
    if (this.isLoginMexcPage) {
      const mexcPageManagment = await this.checkBrokerCryptos(TradeBroker.mexc);
      if (mexcPageManagment)
        await this.manageCryptos(mexcPageManagment, TradeBroker.mexc);
    }
  }

  private async checkBrokerCryptos(
    broker: keyof typeof TradeBroker,
    isBusy?: boolean,
  ): Promise<TradeOfPageManagment | undefined> {
    if (this.isCheckBrokerCryptosBusy) return;
    if (isBusy) this.isCheckBrokerCryptosBusy = true;
    let result: TradeOfPageManagment = undefined;
    try {
      // deactive gate website
      // if (broker === TradeBroker.gate) {
      //   // call check in broker
      //   // return await (async () => {});
      // }
      if (broker === TradeBroker.mexc) {
        const walletList = await this.MexcAllWalletCrypto();
        result = walletList;
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
        remainAmountBroker: number;
        endPositionPriceBroker: number;
      }
    | undefined
  > {
    let result: {
      remainAmountBroker: number;
      endPositionPriceBroker: number;
    } = undefined;
    try {
      // deactive gate website
      // if (broker === TradeBroker.gate) {
      //   // call sell in broker
      //   // return await (async () => {});
      // }
      if (broker === TradeBroker.mexc) {
        // call sell in broker
        // return await (async () => {});
      }
    } finally {
      return result;
    }
  }

  // gateio trade
  async GateIoCheckCryptoExist(cryptoSymbol: string) {
    if (!this.isLoginGateIoPage) return;
    // check cryto exist with usdt
    const trade_symbol = `${cryptoSymbol}_${this.BaseCryptoSymbol}`;
    const rgxPattern = /(.+\/)(.+)$/g;
    try {
      await this.GateIoPage.goto(
        `${this.LINK_GATEIO_TRADE_PAGE}/${trade_symbol}`,
      );
    } catch (error) {
      const log = `Scraper: Cannot load gate page for (${cryptoSymbol}).`;
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    }
    const url = this.GateIoPage.url();
    const matchPath = [...url.matchAll(rgxPattern)][0][2];
    if (trade_symbol === matchPath) {
      const log = `Scraper: Find crypto symbol (${cryptoSymbol}) in Gate.`;
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.info, log },
      ]);
      return true;
    }
    const log = `Scraper: Cannot find crypto symbol (${cryptoSymbol}) in Gate.`;
    this.monitorService.addNewMonitorLog([{ type: MonitorLogType.info, log }]);
    return false;
  }

  async GateIoUserIsLogin() {
    const loginSelector = '#loginLink';
    try {
      if (!this.browserService.browser) await this.browserService.initBrowser();
      if (!this.GateIoPage) await this.initGateIoPage();
      await this.GateIoPage.bringToFront();
      const loginBtn = await this.GateIoPage.$(loginSelector);
      const url = this.GateIoPage.url();
      if (!url.includes('gate.io') || loginBtn) {
        this.isLoginGateIoPage = false;
        return false;
      }
      this.isLoginGateIoPage = true;
      return true;
    } catch (error) {
      const log = 'Scraper: Cannot check user is login in Gate or not!';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
      return false;
    }
  }

  async GateIoBuyCrypto() {
    try {
      await this.GateIoPage.bringToFront();
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
    } catch (error) {
      const log = 'Scraper: Buying process in Gate had wrong.';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
      return log;
    }
  }

  async GateIoLoginPage(res: Response) {
    try {
      const qrCodeSelector = '#loginQRCode canvas';
      if (!this.browserService.browser) await this.browserService.initBrowser();
      if (!this.GateIoPage) await this.initGateIoPage();
      await this.GateIoPage.goto(this.LINK_GATEIO_LOGIN_PAGE);
      await this.GateIoPage.bringToFront();
      await this.GateIoPage.waitForSelector(qrCodeSelector);
    } catch (error) {
      const log = 'Scraper: Cannot get Gate login page.';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    } finally {
      // send screenshot for clinet to accept login
      return this.sendSnapshot(res, this.GateIoPage);
    }
  }

  async GateIoAllWalletCrypto() {}
  async GateIoCryptoState() {}
  async GateIoCloseCryptoPosition() {}

  // mexc trade
  async MexcCheckCryptoExist(cryptoSymbol: string) {
    if (!this.isLoginMexcPage) return;
    // check cryto exist with usdt;
    const trade_symbol = `${cryptoSymbol}_${this.BaseCryptoSymbol}`;
    try {
      await this.MexcPage.goto(`${this.LINK_MEXC_TRADE_PAGE}/${trade_symbol}`);
      await this.MexcPage.bringToFront();
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
      if (!noCrypto) {
        const log = `Scraper: Find crypto symbol (${cryptoSymbol}) in Mexc.`;
        this.monitorService.addNewMonitorLog([
          { type: MonitorLogType.info, log },
        ]);
        return true;
      }
      const log = `Scraper: Cannot find crypto symbol (${cryptoSymbol}) in Mexc.`;
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.info, log },
      ]);
      return false;
    } catch (error) {
      const log = `Scraper: Cannot load Mexc page for (${cryptoSymbol}).`;
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    }
  }

  async MexcUserIsLogin() {
    const loginBtnSelector = '.header_registerBtn__fsUiv.header_authBtn__Gch60';
    try {
      if (!this.browserService.browser) await this.browserService.initBrowser();
      if (!this.MexcPage) await this.initMexcPage();
      if (!this.LINK_MEXC_TRADE_PAGE.includes(this.MexcPage.url()))
        await this.MexcPage.goto(`${this.LINK_MEXC_TRADE_PAGE}/MX_USDT`);
      await this.MexcPage.bringToFront();
      let loginBtn: Puppeteer.ElementHandle<Element> | null = null;
      try {
        loginBtn = await this.MexcPage.waitForSelector(loginBtnSelector, {
          timeout: 10000,
        });
      } catch {}
      const url = this.MexcPage.url();
      if (
        !url.includes('mexc.com') ||
        (url !== this.LINK_MEXC_LOGIN_PAGE && loginBtn)
      ) {
        this.isLoginMexcPage = false;
        await this.MexcPage.goto(this.LINK_MEXC_LOGIN_PAGE);
        return false;
      }
      if (url !== this.LINK_MEXC_LOGIN_PAGE && !loginBtn) {
        this.isLoginMexcPage = true;
        return true;
      }
      await this.MexcPage.goto(this.LINK_MEXC_LOGIN_PAGE);
    } catch (error) {
      const log = 'Scraper: Cannot check user is login in Mexc or not!';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
      return undefined;
    }
  }

  async MexcBuyCrypto() {
    try {
      await this.MexcPage.bringToFront();
      const availableMoney = await this.MexcPage.evaluate(() => {
        const marketOrderTypeSelector =
          '.actions_textNowarp__3QcjB.actions_mode__nRnKJ';
        const availableMoneySelector = '.actions_itemContent__qOMXm';
        const unitMoneySelector = '.actions_unitsSpace__i8C7j';
        const amountMoneySelector = '.actions_valueContent__8bSMo';
        (
          [
            ...document.querySelectorAll(marketOrderTypeSelector),
          ] as HTMLElement[]
        )
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
            document.querySelector<HTMLElement>(notifSelector)?.textContent;
          return notifHTMLStr;
        },
        buyBtnSelector,
        notifSelector,
      );
      return notifHTMLStr;
    } catch (error) {
      const log = 'Scraper: Buying process in Mexc had wrong.';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
      return log;
    }
  }

  async MexcLoginPage(res: Response) {
    try {
      const qrHoverToShowSeloctor = '.Form_qrcodeTxt__8TIo0';
      const qrCodeSelector = '.QrcodeLogin_qrcode__IGJHy';
      if (!this.browserService.browser) await this.browserService.initBrowser();
      if (!this.MexcPage) await this.initMexcPage();
      await this.MexcPage.goto(this.LINK_MEXC_LOGIN_PAGE);
      await this.MexcPage.bringToFront();
      await this.MexcPage.waitForSelector(qrHoverToShowSeloctor);
      await this.MexcPage.hover(qrHoverToShowSeloctor);
      await this.MexcPage.waitForSelector(qrCodeSelector);
    } catch (error) {
      const log = 'Scraper: Cannot get Mexc login page.';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
    } finally {
      // send screenshot for clinet to accept login
      return this.sendSnapshot(res, this.MexcPage);
    }
  }

  async MexcAllWalletCrypto(): Promise<TradeOfPageManagment | undefined> {
    if (!this.isLoginMexcPage) return;
    const openPositionsSelector =
      '.orders_tab__F1mi5.mxc-short-tab.orders_statistic__34QOw';
    const formTableRowsSelector = '.ant-form.ant-form-horizontal';
    const availableMoneySelector = '.actions_itemContent__qOMXm';
    const unitMoneySelector = '.actions_unitsSpace__i8C7j';
    const amountMoneySelector = '.actions_valueContent__8bSMo';
    try {
      if (!this.MexcManageTradePage) await this.initMexcTradePage();
      await this.MexcManageTradePage.goto(
        `${this.LINK_MEXC_TRADE_PAGE}/MX_USDT`,
      );
      await this.MexcManageTradePage.waitForSelector(formTableRowsSelector);
      const { tableRows, acountAmount } =
        await this.MexcManageTradePage.evaluate(
          (
            openPositionsSelector,
            formTableRowsSelector,
            availableMoneySelector,
            unitMoneySelector,
            amountMoneySelector,
          ) => {
            document.querySelector<HTMLElement>(openPositionsSelector)?.click();
            const tableRows: OpenPositionRow[] = [
              ...document.querySelectorAll(`${formTableRowsSelector} > div`),
            ].map((el) =>
              [...el.querySelectorAll<HTMLElement>(':scope > div')].map(
                (childEl) => childEl.innerText,
              ),
            ) as OpenPositionRow[];
            // get available money
            const availableMoney: number | string = [
              ...document.querySelectorAll(availableMoneySelector),
            ]
              .filter(
                (el) =>
                  el
                    .querySelector(unitMoneySelector)
                    .textContent.toLowerCase() === 'usdt',
              )[0]
              .querySelector(amountMoneySelector).textContent;
            const acountAmount = Number(availableMoney);
            return { tableRows, acountAmount };
          },
          openPositionsSelector,
          formTableRowsSelector,
          availableMoneySelector,
          unitMoneySelector,
          amountMoneySelector,
        );

      const tradeList = tableRows.map((tr) => ({
        symbol: tr[0],
        state: TradeState.onTrade,
        price: Number(tr[4]),
        amount: Number(tr[1]),
      }));
      return { tradeList, acountAmount };
    } catch (error) {
      const log = 'Cannot load mexc mange trade page.';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log },
      ]);
      return undefined;
    }
  }
  async reloadMexcAllWalletCrypto() {
    // just reload page with job
  }
  async MexcCryptoState() {}
  async MexcCloseCryptoPosition() {}
}
