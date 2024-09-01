import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { XlsService } from './xls/xls.service';

@Controller('file-generator')
export class FileGeneratorController {
  constructor(private xls: XlsService) {}
}
