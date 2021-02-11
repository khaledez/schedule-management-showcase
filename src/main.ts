import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  registerApp,
  CustomLoggerService,
  AuthGuard,
  HttpExceptionFilter,
} from '@mon-medic/common';
import { ValidationPipe, Logger } from '@nestjs/common';
import { CONFIG_SERVICE, PORT, SERVICE_NAME } from './common/constants';

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
  app.useGlobalGuards(new AuthGuard(reflector));
  app.setGlobalPrefix(serviceName);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
