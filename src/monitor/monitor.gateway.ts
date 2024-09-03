import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  EventEmitter,
  EventListener,
  SocketNameSpace,
} from 'src/enums/event.enum';
import { MonitorLog } from 'src/types/monitor.type';
import { MonitorService } from './monitor.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({ namespace: SocketNameSpace.monitor })
export class MonitorGateway {
  @WebSocketServer()
  server: Server;

  JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => MonitorService))
    private monitorService: MonitorService,
  ) {}

  private extractTokenFromHandshake(client: Socket): string | undefined {
    const TOKEN =
      client.handshake.auth?.authorization ||
      client.handshake.headers?.authorization;
    const [type, token] = TOKEN?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  handleConnection(client: Socket) {
    const token = this.extractTokenFromHandshake(client);
    if (!token) {
      this.server.in(client.id).emit('message', 'Token Is Invalid!');
      this.server.in(client.id).disconnectSockets(false);
    }
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.JWT_SECRET_KEY,
      });
      client['appConfig'] = payload;
    } catch {
      this.server.in(client.id).emit('message', 'Token Is Invalid!');
      this.server.in(client.id).disconnectSockets(false);
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage(EventListener.getTailLogs)
  private async getTailLogs(client: Socket, count: string) {
    const result = await this.monitorService.getTailLogs(count);
    this.addTailLogs(result, client.id);
  }
  @SubscribeMessage(EventListener.getHeadLogs)
  private async getHeadLogs(client: Socket, count: string) {
    const result = await this.monitorService.getHeadLogs(count);
    this.addHeadLogs(result, client.id);
  }

  public async addTailLogs(data: MonitorLog[], clientRoomId?: string) {
    if (clientRoomId)
      this.server.in(clientRoomId).emit(EventEmitter.addTailLogs, data);
    else this.server.emit(EventEmitter.addTailLogs, data);
  }
  public async addHeadLogs(data: MonitorLog[], clientRoomId?: string) {
    if (clientRoomId)
      this.server.in(clientRoomId).emit(EventEmitter.addHeadLogs, data);
    else this.server.emit(EventEmitter.addHeadLogs, data);
  }
}
