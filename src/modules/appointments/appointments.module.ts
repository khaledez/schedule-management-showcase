import { Module } from '@nestjs/common';
import { appointmentsProviders } from './appointments.provider';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  // imports: [DatabaseModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, ...appointmentsProviders],
})
export class AppointmentsModule {}
