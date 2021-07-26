import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { AvailabilityController } from './availability.controller';
import { availabilityProviders } from './availability.provider';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, ...availabilityProviders],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
