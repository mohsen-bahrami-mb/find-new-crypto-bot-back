import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from 'src/app-config/app-config.service';
import { MonitorService } from 'src/monitor/monitor.service';
import { MonitorLogType } from 'src/enums/monitor.enum';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private appConfigService: AppConfigService,
    private monitorService: MonitorService,
  ) {}

  async login({ username, password }: LoginDto): Promise<{ token: string }> {
    const config = await this.appConfigService.getConfig(true);
    const isValidPassword = bcrypt.compareSync(password, config.password);
    if (!isValidPassword || username !== config.username)
      throw new UnauthorizedException();
    delete config.password;
    try {
      const token = await this.jwtService.signAsync(config);
      return { token };
    } catch (error) {
      const log = 'login service is broken';
      this.logger.error(log, error.stack);
      this.monitorService.addNewMonitorLog([
        { type: MonitorLogType.error, log: log },
      ]);
      throw new InternalServerErrorException();
    }
  }
}
