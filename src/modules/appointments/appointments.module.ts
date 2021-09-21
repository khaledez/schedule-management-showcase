import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PatientInfoModule } from 'modules/patient-info';
import { AvailabilityModule } from '../availability/availability.module';
import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';
import { LookupsModule } from '../lookups/lookups.module';
import { AppointmentsController } from './appointments.controller';
import { appointmentsProviders } from './appointments.provider';
import { AppointmentsService } from './appointments.service';
import { AppointmentEventPublisher } from './appointments.event-publisher';
import { AppointmentRequestsModule } from '../appointment-requests/appointment-requests.module';

@Module({
  imports: [
    LookupsModule,
    forwardRef(() => AvailabilityModule),
    EventsModule,
    DatabaseModule,
    forwardRef(() => PatientInfoModule),
    forwardRef(() => AppointmentRequestsModule),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppointmentsController],
  providers: [...appointmentsProviders],
  exports: [AppointmentsService, AppointmentEventPublisher],
})
export class AppointmentsModule {}
