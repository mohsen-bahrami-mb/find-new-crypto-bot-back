import { Injectable } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  EventEmitter,
  EventListener,
  SocketNameSpace,
} from 'src/enums/event.enum';
import { MonitorLogJSON } from 'src/types/monitor.type';

@Injectable()
@WebSocketGateway({ namespace: SocketNameSpace.monitor })
export class MonitorGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage(EventListener.getTailLogs)
  private getTailLogs(@MessageBody() data: string) {}
  @SubscribeMessage(EventListener.getHeadLogs)
  private getHeadLogs(@MessageBody() data: string) {}

  public addTailLogs(data: MonitorLogJSON) {
    this.server.emit(EventEmitter.addTailLogs, data);
  }
  public addHeadLogs(data: MonitorLogJSON) {
    this.server.emit(EventEmitter.addHeadLogs, data);
  }
}
