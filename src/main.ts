import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SocketIoAdapter } from './utils/socket/socketIoAdapter';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';

async function bootstrap() {
  const privateKey = process.env.PRIVATE_KEY;
  const publicKey = process.env.PUBLIC_KEY;
  const httpsConfig =
    privateKey && publicKey
      ? {
          httpsOptions: {
            key: readFileSync(privateKey),
            cert: readFileSync(publicKey),
          },
        }
      : {};
  const app = await NestFactory.create(AppModule, {
    cors: true,
    ...httpsConfig,
  });
  const appConfigService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  app.useWebSocketAdapter(new SocketIoAdapter(app, appConfigService));
  // app.enableShutdownHooks();
  await app.listen(process.env.PORT);
}
bootstrap();
