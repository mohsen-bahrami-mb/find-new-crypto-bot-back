import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { FinderService } from './finder.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('finder')
export class FinderController {
  constructor(private readonly finderService: FinderService) {}

  @UseGuards(AuthGuard)
  @Post('testStart')
  async testStart(@Body() newsTitle: string[]) {
    const result = newsTitle?.map((t) => ({
      requestStart: new Date(),
      requestEnd: new Date(Date.now() + 3000),
      newsDate: new Date(),
      newsUrl: 'test-url',
      newsTitle: t,
    }));
    return await this.finderService.testStart(result);
  }
}
