import { Injectable } from '@nestjs/common';
import { Template, BLANK_PDF, Schema } from '@pdfme/common';
import { generate } from '@pdfme/generator';
import { Response } from 'express';

@Injectable()
export class PdfService {
  async generateTradeStatement(res: Response) {
    const template: Template = {
      basePdf: BLANK_PDF,
      schemas: [
        {
          state: {
            type: 'text',
            position: { x: 20, y: 10 },
            width: 500,
            height: 10,
          },
          broker: {
            type: 'text',
            position: { x: 20, y: 20 },
            width: 500,
            height: 10,
          },
          cryptoName: {
            type: 'text',
            position: { x: 20, y: 30 },
            width: 500,
            height: 10,
          },
          cryptoSymbol: {
            type: 'text',
            position: { x: 20, y: 40 },
            width: 500,
            height: 10,
          },
          cryptoPairSymbol: {
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
          endPositionsPrice: {
            type: 'text',
            position: { x: 20, y: 90 },
            width: 500,
            height: 10,
          },
        },
      ],
    };
    const inputs = [
      {
        state: `state:                                ${'state'}`,
        broker: `broker:                              ${'broker'}`,
        cryptoName: `cryptoName:                   ${'cryptoName'}`,
        cryptoSymbol: `cryptoSymbol:                ${'cryptoSymbol'}`,
        cryptoPairSymbol: `cryptoPairSymbol:         ${'cryptoPairSymbol'}`,
        startPositionsPrice: `startPositionsPrice:      ${'startPositionsPrice'}`,
        startPositionAmount: `startPositionAmount:   ${'startPositionAmount'}`,
        endPositionAmount: `endPositionAmount:     ${'endPositionAmount'}`,
        endPositionsPrice: `endPositionsPrice:
        
        ${'endPositionsPrice'}
`,
      },
    ];

    const pdf = await generate({ template: template as any, inputs });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  }
}
