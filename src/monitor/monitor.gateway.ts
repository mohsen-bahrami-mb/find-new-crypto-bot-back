import { forwardRef, Inject, Injectable } from '@nestjs/common';
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

  constructor(
    @Inject(forwardRef(() => MonitorService)) private monitorService,
  ) {}

  @SubscribeMessage(EventListener.getTailLogs)
  private async getTailLogs(@MessageBody() count: string) {
    const result = await this.monitorService.getTailLogs(count);
    this.addTailLogs(result);
  }
  @SubscribeMessage(EventListener.getHeadLogs)
  private async getHeadLogs(@MessageBody() count: string) {
    const result = await this.monitorService.getHeadLogs(count);
    this.addHeadLogs(result);
  }

  public async addTailLogs(data: MonitorLog[]) {
    this.server.emit(EventEmitter.addTailLogs, data);
  }
  public async addHeadLogs(data: MonitorLog[]) {
    this.server.emit(EventEmitter.addHeadLogs, data);
  }
}
