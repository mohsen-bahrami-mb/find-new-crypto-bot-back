import { Module } from '@nestjs/common';
import { PdfService } from './pdf/pdf.service';
import { XlsService } from './xls/xls.service';

@Module({
  providers: [PdfService, XlsService],
  controllers: [],
})
export class FileGeneratorModule {}
