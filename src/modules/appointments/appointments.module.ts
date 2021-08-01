import { forwardRef, Module } from '@nestjs/common';
import { PatientInfoModule } from 'modules/patient-info';
import { appointmentsProviders } from './appointments.provider';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { LookupsModule } from '../lookups/lookups.module';
import { DatabaseModule } from '../database/database.module';
import { AvailabilityModule } from '../availability/availability.module';
import { EventsModule } from '../events/events.module';
import { AppointmentsListener } from './appointments.listener';

@Module({
  imports: [LookupsModule, forwardRef(() => AvailabilityModule), EventsModule, DatabaseModule, PatientInfoModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsListener, ...appointmentsProviders],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
