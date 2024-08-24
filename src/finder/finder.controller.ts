import { Body, Controller, Get, Put } from '@nestjs/common';
import { FinderService } from './finder.service';
import { ConfigDto } from './dto/config.dto';

@Controller('finder')
export class FinderController {
  constructor(readonly finderService: FinderService) {}

  @Get()
  newsList() {
    return this.finderService.checkTargetNews();
  }

  @Get('config')
  getConfig() {
    this.finderService.getConfig();
  }
  @Put('config')
  putConfig(@Body() body: ConfigDto) {
    this.finderService.putConfig(body);
  }
}
