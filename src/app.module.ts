import { AuthModule, requestLoggerMiddleware } from '@dashps/monmedx-common';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TerminusModule } from '@nestjs/terminus';
import { ConfigurationModule } from 'modules/config/config.module';
import { PatientInfoModule } from 'modules/patient-info';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FireEventService } from './fire-event.service';
import { GeneralHealthIndicator } from './general-health.provider';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DatabaseModule } from './modules/database/database.module';
import { EventsModule } from './modules/events/events.module';
import { LookupsModule } from './modules/lookups/lookups.module';

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
    PatientInfoModule,
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
