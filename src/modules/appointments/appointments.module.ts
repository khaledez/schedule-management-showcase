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

@Module({
  imports: [
    LookupsModule,
    forwardRef(() => AvailabilityModule),
    EventsModule,
    DatabaseModule,
    forwardRef(() => PatientInfoModule),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppointmentsController],
  providers: [...appointmentsProviders],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
