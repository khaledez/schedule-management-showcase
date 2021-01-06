import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { requestLoggerMiddleware } from '@mon-medic/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from './modules/database/database.module';
import { AppointmentsController } from './modules/appointments/appointments.controller';
import { AvailabilityController } from './modules/availability/availability.controller';
import { AppointmentsService } from './modules/appointments/appointments.service';
import { AvailabilityService } from './modules/availability/availability.service';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import config from '../config';

@Module({
  imports: [
    TerminusModule,
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    DatabaseModule,
    AppointmentsModule,
    AvailabilityModule,
  ],
  controllers: [AppController, AppointmentsController, AvailabilityController],
  providers: [AppService, AppointmentsService, AvailabilityService],
})
export class AppModule {
  // apply logger middleware in all-over the modules.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestLoggerMiddleware).forRoutes('*');
  }
}
