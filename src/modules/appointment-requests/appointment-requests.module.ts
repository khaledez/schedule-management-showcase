import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppointmentRequestsService } from './appointment-requests.service';
import { AppointmentRequestsController } from './appointment-requests.controller';
import { appointmentRequestsProviders } from './appointment-requests.providers';
import { AppointmentsModule } from '../appointments/appointments.module';
import { LookupsModule } from '../lookups/lookups.module';

@Module({
  imports: [DatabaseModule, AppointmentsModule, LookupsModule],
  controllers: [AppointmentRequestsController],
  providers: [AppointmentRequestsService, ...appointmentRequestsProviders],
})
export class AppointmentRequestsModule {}
