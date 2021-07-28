import { Public } from '@dashps/monmedx-common';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SERVICE_NAME } from 'common/constants';
import { GeneralHealthIndicator } from './general-health.provider';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private health: HealthCheckService,
    private generalHealthIndicator: GeneralHealthIndicator,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.configService.get(SERVICE_NAME);
  }

  @Public()
  @Get('health-check')
  @HealthCheck()
  check() {
    return this.health.check([() => this.generalHealthIndicator.isHealthy()]);
  }
}
