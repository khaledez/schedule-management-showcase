import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppointmentRequestsService } from './appointment-requests.service';
import { AppointmentRequestsController } from './appointment-requests.controller';
import { appointmentRequestsProviders } from './appointment-requests.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentRequestsController],
  providers: [AppointmentRequestsService, ...appointmentRequestsProviders],
})
export class AppointmentRequestsModule {}
