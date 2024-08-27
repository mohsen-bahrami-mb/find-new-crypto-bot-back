import type { ConfigService } from '@nestjs/config';
import type { ServerOptions } from 'socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    port = this.configService.get<number>('SOCKETIO_PORT');
    const server = super.createIOServer(port, options);
    return server;
  }
}
