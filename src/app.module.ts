import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { requestLoggerMiddleware, AuthModule } from '@dashps/monmedx-common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from './modules/database/database.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { LookupsModule } from './modules/lookups/lookups.module';
import config from '../config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GeneralHealthIndicator } from './general-health.provider';
import { EventsModule } from './modules/events/events.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { FireEventService } from './fire-event.service';

@Module({
  imports: [
    TerminusModule,
    ConfigModule.forRoot({
      load: config,
      isGlobal: true,
    }),
    DatabaseModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    AppointmentsModule,
    AvailabilityModule,
    LookupsModule,
    EventsModule,
    CalendarModule,
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
