import { Module } from '@nestjs/common';
import { FinderService } from './finder.service';
import { FinderController } from './finder.controller';

@Module({
  providers: [FinderService],
  controllers: [FinderController]
})
export class FinderModule {}
