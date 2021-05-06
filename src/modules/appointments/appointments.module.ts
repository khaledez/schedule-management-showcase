import { Module } from '@nestjs/common';
import { appointmentsProviders } from './appointments.provider';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { LookupsModule } from '../lookups/lookups.module';
import { DatabaseModule } from '../database/database.module';
import { AvailabilityModule } from '../availability/availability.module';
import { EventsModule } from '../events/events.module';
import { AppointmentsListener } from './appointments.listener';

@Module({
  imports: [LookupsModule, AvailabilityModule, EventsModule, DatabaseModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsListener, ...appointmentsProviders],
})
export class AppointmentsModule {}
