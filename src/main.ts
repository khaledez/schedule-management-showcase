import {
  CustomLoggerService,
  HttpExceptionFilter,
  JwtAuthGuard,
  PermissionsGuard,
  registerApp,
} from '@monmedx/monmedx-common';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { CONFIG_SERVICE, PORT, SERVICE_NAME } from './common/constants';
import { FireEventService } from './fire-event.service';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
    cors: true,
  });

  const appConfig = app.get(CONFIG_SERVICE);
  const serviceName = appConfig.get(SERVICE_NAME);
  const port = appConfig.get(PORT);
  registerApp(app, serviceName);
  /**
   * use global pipes to be accessible by app's controllers
   */
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new PermissionsGuard(reflector));
  app.setGlobalPrefix(serviceName);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const fireService = app.get(FireEventService);
  fireService.fireEvent();

  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
