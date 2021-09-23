import { forwardRef, HttpModule, Module } from '@nestjs/common';
import { DatabaseModule } from 'modules/database/database.module';
import { AppointmentCronJobModel } from './appointment-cron-job.model';
import { AppointmentCronJobService } from './appointment-cron-job.service';
import { APPOINTMENT_CRON_JOB_REPOSITORY } from 'common/constants';
import { AppointmentCronJobListener } from './appointment-cron-job.listener';
import { AppointmentsModule } from 'modules/appointments/appointments.module';
import { LookupsModule } from 'modules/lookups/lookups.module';

const repoProviders = [
  {
    provide: APPOINTMENT_CRON_JOB_REPOSITORY,
    useValue: AppointmentCronJobModel,
  },
];

@Module({
  imports: [DatabaseModule, HttpModule, LookupsModule, forwardRef(() => AppointmentsModule)],
  providers: [AppointmentCronJobService, AppointmentCronJobListener, ...repoProviders],
  exports: [AppointmentCronJobService],
})
export class AppointmentCronJobModule {}
