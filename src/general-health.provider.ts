import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class GeneralHealthIndicator extends HealthIndicator {
  // eslint-disable-next-line require-await
  async isHealthy(): Promise<HealthIndicatorResult> {
    return this.getStatus('requisition-management', true);
  }
}
