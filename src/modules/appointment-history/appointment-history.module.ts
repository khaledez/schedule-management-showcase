import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { AppointmentHistoryController } from './appointment-history.controller';
import { appointmentHistoryProviders } from './appointment-history.provider';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [AppointmentHistoryController],
  providers: [...appointmentHistoryProviders],
})
export class AppointmentHistoryModule {}
