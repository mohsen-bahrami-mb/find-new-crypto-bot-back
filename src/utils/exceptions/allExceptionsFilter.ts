import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MonitorLogType } from 'src/enums/monitor.enum';
import { MonitorService } from 'src/monitor/monitor.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private monitorService: MonitorService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host?.switchToHttp();
    const response = ctx?.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = (exception as any).message || 'Internal server error';

    if (status.toString().match(/5\d{2}/))
      this.logger.error(message, JSON.stringify(exception));

    try {
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: message },
      ]);
    } catch (error) {
      this.logger.error(
        'MONITOR SERVICE IS BROKEN!!!!! (fix it as soon as soon)',
        JSON.stringify(exception),
        error,
        error.stack,
      );
    }

    response?.status(status).send((exception as any)?.response);
  }
}
