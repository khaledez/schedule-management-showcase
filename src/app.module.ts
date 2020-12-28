import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { requestLoggerMiddleware } from '@mon-medic/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from './modules/database/database.module';
import config from '../config';

@Module({
  imports: [
    TerminusModule,
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    DatabaseModule,
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
