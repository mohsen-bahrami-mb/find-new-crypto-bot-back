import { Controller, Get } from '@nestjs/common';
import { FinderService } from './finder.service';

@Controller('finder')
export class FinderController {
  constructor(readonly finderService: FinderService) {}

  @Get()
  newsList() {
    return this.finderService.checkTargetNews();
  }
}
