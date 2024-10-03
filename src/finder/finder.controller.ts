import { Body, Controller, Get } from '@nestjs/common';
import { FinderService } from './finder.service';

@Controller('finder')
export class FinderController {
  constructor(private readonly finderService: FinderService) {}
}
