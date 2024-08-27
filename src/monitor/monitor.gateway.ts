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
import { MonitorLog } from 'src/types/monitor.type';
import { MonitorService } from './monitor.service';

@Injectable()
@WebSocketGateway({ namespace: SocketNameSpace.monitor })
export class MonitorGateway {
  @WebSocketServer()
  server: Server;

  constructor(private monitorService: MonitorService) {}

  @SubscribeMessage(EventListener.getTailLogs)
  private async getTailLogs(@MessageBody() count: string) {
    return await this.monitorService.getTailLogs(count);
  }
  @SubscribeMessage(EventListener.getHeadLogs)
  private async getHeadLogs(@MessageBody() count: string) {
    return await this.monitorService.getHeadLogs(count);
  }

  public addTailLogs(data: MonitorLog[]) {
    this.server.emit(EventEmitter.addTailLogs, data);
  }
  public addHeadLogs(data: MonitorLog[]) {
    this.server.emit(EventEmitter.addHeadLogs, data);
  }
}
