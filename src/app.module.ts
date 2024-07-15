import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FinderModule } from './finder/finder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.test', '.env.production', '.env'],
      isGlobal: true,
    }),
    FinderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
