import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { FinderDocument } from 'src/finder/schema/finder.schema';
import { TradeDocument } from 'src/trade/schema/trade.schema';

@Injectable()
export class XlsService {
  async generateTradeStatement(
    res: Response,
    tradeData: TradeDocument,
    finderData: FinderDocument,
    /** without exec */ fileName?: string,
  ) {
    const data = [
      ['Crypto Name', tradeData.cryptoName],
      ['Crypto Symbol', tradeData.cryptoSymbol],
      ['Crypto Pair Symbol', tradeData.cryptoPairSymbol],
      ['State', tradeData.state],
      ['Broker', tradeData.broker],
      ['Start Positions Price', ...tradeData.startPositionsPrice],
      ['Start Position Amount', tradeData.startPositionAmount],
      ['Position Amount', tradeData.positionAmount],
      ['Report Time', `${new Date().toISOString()} (ISO TIME)`],
      [
        'Start Finding Time',
        `${finderData.requestStart.toISOString()} (ISO TIME)`,
      ],
      ['End Finding Time', `${finderData.requestEnd.toISOString()} (ISO TIME)`],
      ['Start Trade Time', `${tradeData.createdAt.toISOString()} (ISO TIME)`],
      [],
      ['tp', 'sl', 'Percent Of Amount', 'End Price'],
      ...tradeData.endPositionsPrice.map((item) => Object.values(item)),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    });
    this.sendXlsx(res, excelBuffer, fileName);
  }

  private sendXlsx(res: Response, xlsx: any, fileName?: string) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName || 'statement'}.xlsx`,
    );

    res.setHeader('Content-Length', xlsx.length);
    res.end(xlsx);
  }
}
