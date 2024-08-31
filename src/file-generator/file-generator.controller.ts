import { Controller, Get, Res } from '@nestjs/common';
import { PdfService } from './pdf/pdf.service';
import { Response } from 'express';


@Controller('file-generator')
export class FileGeneratorController {
  constructor(private pdf: PdfService) {}
  
  @Get()
  generate(@Res() res: Response){
    return this.pdf.generateTradeStatement(res);
  }
}
