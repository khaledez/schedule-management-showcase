import { forwardRef, Module } from '@nestjs/common';
import { AppointmentsModule } from 'modules/appointments/appointments.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { AvailabilityController } from './availability.controller';
import { availabilityProviders } from './availability.provider';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [DatabaseModule, EventsModule, LookupsModule, forwardRef(() => AppointmentsModule)],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, ...availabilityProviders],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
