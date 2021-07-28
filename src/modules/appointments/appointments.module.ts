import { Module } from '@nestjs/common';
import { PatientInfoModule } from 'modules/patient-info';
import { AvailabilityModule } from '../availability/availability.module';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { LookupsModule } from '../lookups/lookups.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsListener } from './appointments.listener';
import { appointmentsProviders } from './appointments.provider';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [LookupsModule, AvailabilityModule, EventsModule, DatabaseModule, PatientInfoModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsListener, ...appointmentsProviders],
})
export class AppointmentsModule {}
