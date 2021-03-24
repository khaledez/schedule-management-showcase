import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { requestLoggerMiddleware, AuthModule } from '@mon-medic/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from './modules/database/database.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { LookupsModule } from './modules/lookups/lookups.module';
import config from '../config';
import { HttpTracingModule } from '@narando/nest-xray';

@Module({
  imports: [
    TerminusModule,
    ConfigModule.forRoot({
      load: config,
      isGlobal: true,
    }),
    HttpTracingModule.registerAsync({
      useFactory: (config: ConfigService) => {
        return {
          baseURL: config.get('apiURL'),
        };
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    AppointmentsModule,
    AvailabilityModule,
    LookupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // apply logger middleware in all-over the modules.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestLoggerMiddleware).forRoutes('*');
  }
}
