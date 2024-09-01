import { Injectable, Res } from '@nestjs/common';
import { Template, BLANK_PDF, Schema } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { Response } from 'express';
import { FinderDocument } from 'src/finder/schema/finder.schema';
import { TradeDocument } from 'src/trade/schema/trade.schema';

@Injectable()
export class PdfService {
  async generateTradeStatement(
    res: Response,
    tradeData: TradeDocument,
    finderData: FinderDocument,
    /** without exec */ fileName?: string,
  ) {
    const template: Template = {
      basePdf: BLANK_PDF,
      schemas: [
        {
          cryptoName: {
            type: 'text',
            position: { x: 20, y: 10 },
            width: 500,
            height: 10,
          },
          cryptoSymbol: {
            type: 'text',
            position: { x: 20, y: 20 },
            width: 500,
            height: 10,
          },
          cryptoPairSymbol: {
            type: 'text',
            position: { x: 20, y: 30 },
            width: 500,
            height: 10,
          },
          state: {
            type: 'text',
            position: { x: 20, y: 40 },
            width: 500,
            height: 10,
          },
          broker: {
            type: 'text',
            position: { x: 20, y: 50 },
            width: 500,
            height: 10,
          },
          startPositionsPrice: {
            type: 'text',
            position: { x: 20, y: 60 },
            width: 500,
            height: 10,
          },
          startPositionAmount: {
            type: 'text',
            position: { x: 20, y: 70 },
            width: 500,
            height: 10,
          },
          endPositionAmount: {
            type: 'text',
            position: { x: 20, y: 80 },
            width: 500,
            height: 10,
          },
          reportTime: {
            type: 'text',
            position: { x: 20, y: 90 },
            width: 500,
            height: 10,
          },
          startFinding: {
            type: 'text',
            position: { x: 20, y: 100 },
            width: 500,
            height: 10,
          },
          endFinding: {
            type: 'text',
            position: { x: 20, y: 110 },
            width: 500,
            height: 10,
          },
          startTrading: {
            type: 'text',
            position: { x: 20, y: 120 },
            width: 500,
            height: 10,
          },
          endPositionsPrice: {
            type: 'text',
            position: { x: 20, y: 130 },
            width: 500,
            height: 10,
          },
        },
      ],
    };
    const endPositionsPriceStr = tradeData.endPositionsPrice.map(
      (item) =>
        `${item.tp}                ${item.sl}                          ${item.percentOfAmount}                              ${item.endPrice || ''}`,
    );
    const inputs = [
      {
        cryptoName: `Crypto Name:                      ${tradeData.cryptoName}`,
        cryptoSymbol: `Crypto Symbol:                   ${tradeData.cryptoSymbol}`,
        cryptoPairSymbol: `Crypto Pair Symbol:           ${tradeData.cryptoPairSymbol}`,
        state: `State:                                    ${tradeData.state}`,
        broker: `Broker:                                  ${tradeData.broker}`,
        startPositionsPrice: `Start Positions Price:         ${tradeData.startPositionsPrice.join(' AND ')}`,
        startPositionAmount: `Start Position Amount:      ${tradeData.startPositionAmount}`,
        endPositionAmount: `End Position Amount:        ${tradeData.endPositionAmount}`,
        reportTime: `Report Time:                        ${new Date().toISOString()} (ISO TIME)`,
        startFinding: `Start Finding Time:             ${finderData.requestStart.toISOString()} (ISO TIME)`,
        endFinding: `End Finding Time:               ${finderData.requestEnd.toISOString()} (ISO TIME)`,
        startTrading: `Start Trade Time:                ${tradeData.createdAt.toISOString()} (ISO TIME)`,
        endPositionsPrice: `End Positions Price:

    tp                    sl                   Percent Of Amount              End Price
___________________________________________________________________

${endPositionsPriceStr.join('\n\n')}
`,
      },
    ];

    const pdf = await generate({ template: template as any, inputs });
    this.sendPdf(res, pdf, fileName);
  }

  private sendPdf(res: Response, pdf: Uint8Array, fileName?: string) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${fileName || 'statement'}.pdf`,
    );
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  }
}
