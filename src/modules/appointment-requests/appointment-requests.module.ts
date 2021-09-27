import { forwardRef, Module } from '@nestjs/common';
import { DatabaseModule } from 'modules/database/database.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { LookupsModule } from '../lookups/lookups.module';
import { AppointmentRequestsController } from './appointment-requests.controller';
import { appointmentRequestsProviders } from './appointment-requests.providers';
import { AppointmentRequestsService } from './appointment-requests.service';

@Module({
  imports: [DatabaseModule, forwardRef(() => AppointmentsModule), LookupsModule],
  controllers: [AppointmentRequestsController],
  providers: [AppointmentRequestsService, ...appointmentRequestsProviders],
  exports: [AppointmentRequestsService, ...appointmentRequestsProviders],
})
export class AppointmentRequestsModule {}
