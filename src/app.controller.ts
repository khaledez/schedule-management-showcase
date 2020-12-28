import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  HealthCheckService,
  DNSHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private health: HealthCheckService,
    private dns: DNSHealthIndicator,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health-check')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.dns.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
    ]);
  }
}
