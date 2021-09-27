import { AuthModule, requestLoggerMiddleware } from '@monmedx/monmedx-common';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TerminusModule } from '@nestjs/terminus';
import { AppointmentCronJobModule } from 'modules/appointment-cron-job/appointment-cron-job.module';
import { AppointmentHistoryModule } from 'modules/appointment-history/appointment-history.module';
import { AppointmentRequestsModule } from 'modules/appointment-requests/appointment-requests.module';
import { AppointmentsModule } from 'modules/appointments/appointments.module';
import { AvailabilityTemplateModule } from 'modules/availability-template/availability-template.module';
import { AvailabilityModule } from 'modules/availability/availability.module';
import { CalendarModule } from 'modules/calendar/calendar.module';
import { ClinicSettingsModule } from 'modules/clinic-settings/clinic-settings.module';
import { ConfigurationModule } from 'modules/config/config.module';
import { DatabaseModule } from 'modules/database/database.module';
import { EventsModule } from 'modules/events/events.module';
import { LookupsModule } from 'modules/lookups/lookups.module';
import { PatientInfoModule } from 'modules/patient-info';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FireEventService } from './fire-event.service';
import { GeneralHealthIndicator } from './general-health.provider';

@Module({
  imports: [
    TerminusModule,
    ConfigurationModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    AppointmentsModule,
    AvailabilityModule,
    LookupsModule,
    EventsModule,
    CalendarModule,
    AvailabilityTemplateModule,
    PatientInfoModule,
    AppointmentRequestsModule,
    AppointmentHistoryModule,
    AppointmentCronJobModule,
    ClinicSettingsModule,
    // TelemetryModule.register({
    //   serviceName: `${process.env.NODE_ENV}-schedule-management`,
    //   routesToExclude: ['/health-check', '/metrics'],
    // }),
  ],
  controllers: [AppController],
  providers: [AppService, GeneralHealthIndicator, FireEventService],
})
export class AppModule {
  // apply logger middleware in all-over the modules.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestLoggerMiddleware).forRoutes('*');
  }
}
