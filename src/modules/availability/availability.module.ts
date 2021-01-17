import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { availabilityProviders } from './appointments.provider';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, ...availabilityProviders],
})
export class AvailabilityModule {}
