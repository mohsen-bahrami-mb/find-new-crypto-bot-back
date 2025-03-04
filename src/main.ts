import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SocketIoAdapter } from './utils/socket/socketIoAdapter';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    httpsOptions: {
      key: readFileSync(process.env.PRIVATE_KEY),
      cert: readFileSync(process.env.PUBLIC_KEY),
    },
  });
  const appConfigService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new SocketIoAdapter(app, appConfigService));
  // app.enableShutdownHooks();
  await app.listen(process.env.PORT);
}
bootstrap();
