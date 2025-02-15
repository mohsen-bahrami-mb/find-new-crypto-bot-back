import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { TradeService } from './trade.service';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { SnapshotDtoParams } from './dto/snapshot.dto';
import { EndPositionsPriceDto, ManagerDto } from './dto/manager.dto';
import { StatementParamDto, StatementQueryDto } from './dto/statement.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { TradeState } from 'src/enums/trade.enum';

@Controller('trade')
export class TradeController {
  constructor(readonly tradeService: TradeService) {}

  // @Get('')
  // test(@Res() res: Response) {
  //   return this.tradeService.MexcLoginPage(res);
  // }

  @UseGuards(AuthGuard)
  @Get('snapshot/:broker')
  brokerSnapshot(@Res() res: Response, @Param() params: SnapshotDtoParams) {
    return this.tradeService.brokerSnapshot(res, params);
  }

  @UseGuards(AuthGuard)
  @Get('brokerState')
  getBrokerState() {
    return {
      gate: { isLogin: this.tradeService.isLoginGateIoPage },
      mexc: { isLogin: this.tradeService.isLoginMexcPage },
    };
  }

  @UseGuards(AuthGuard)
  @Get('manager')
  getManager() {
    return this.tradeService.getManager();
  }

  @UseGuards(AuthGuard)
  @Put('manager')
  PutManager(@Body() body: ManagerDto) {
    return this.tradeService.putManager(body);
  }

  @UseGuards(AuthGuard)
  @Get('statement')
  getStatement(@Query() query: StatementQueryDto) {
    return this.tradeService.getStatement(query);
  }

  @UseGuards(AuthGuard)
  @Get(':id/statement')
  getIdStatement(@Param() param: StatementParamDto) {
    return this.tradeService.getIdStatement(param);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/statement')
  PatchIdStatement(
    @Param() param: StatementParamDto,
    @Body() body: EndPositionsPriceDto[],
  ) {
    return this.tradeService.patchIdStatement(param, body);
  }
}
