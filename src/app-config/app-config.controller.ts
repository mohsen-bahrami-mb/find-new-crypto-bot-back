import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { ConfigDto } from './dto/config.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('app-config')
export class AppConfigController {
  constructor(readonly appConfigService: AppConfigService) {}

  @UseGuards(AuthGuard)
  @Get()
  getConfig() {
    return this.appConfigService.getConfig();
  }

  @UseGuards(AuthGuard)
  @Put()
  putConfig(@Body() body: ConfigDto) {
    return this.appConfigService.putConfig(body);
  }
}
