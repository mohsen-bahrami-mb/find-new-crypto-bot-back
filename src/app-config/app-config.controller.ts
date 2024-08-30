import { Body, Controller, Get, Put } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { ConfigDto } from './dto/config.dto';

@Controller('app-config')
export class AppConfigController {
  constructor(readonly appConfigService: AppConfigService) {}

  @Get()
  getConfig() {
    this.appConfigService.getConfig();
  }
  @Put()
  putConfig(@Body() body: ConfigDto) {
    this.appConfigService.putConfig(body);
  }
}
