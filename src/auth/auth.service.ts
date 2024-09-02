import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from 'src/app-config/app-config.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private appConfigService: AppConfigService,
  ) {}

  async login({ username, password }: LoginDto): Promise<{ token: string }> {
    const config = await this.appConfigService.getConfig(true);
    const isValidPassword = bcrypt.compareSync(password, config.password);
    if (!isValidPassword || username !== config.username)
      throw new UnauthorizedException();
    delete config.password;
    const token = await this.jwtService.signAsync(config);
    return { token };
  }
}
