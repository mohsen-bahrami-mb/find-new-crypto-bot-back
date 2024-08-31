import { Module } from '@nestjs/common';
import { PdfService } from './pdf/pdf.service';
import { XlsService } from './xls/xls.service';
import { FileGeneratorController } from './file-generator.controller';

@Module({
  providers: [PdfService, XlsService],
  controllers: [FileGeneratorController]
})
export class FileGeneratorModule {}
