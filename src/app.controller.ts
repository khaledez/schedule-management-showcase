import { Controller, Get } from '@nestjs/common';
import { Public } from '@mon-medic/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { AppService } from './app.service';
import { GeneralHealthIndicator } from './general-health.provider';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private health: HealthCheckService,
    private generalHealthIndicator: GeneralHealthIndicator,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getStatusOk();
  }

  @Public()
  @Get('health-check')
  @HealthCheck()
  check() {
    return this.health.check([
      // eslint-disable-next-line require-await
      async () => this.generalHealthIndicator.isHealthy(),
    ]);
  }
}
