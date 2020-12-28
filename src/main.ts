import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerApp } from '@mon-medic/common';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const serviceName = 'user-management';
  registerApp(app, serviceName);
  /**
   * use global pipes to be accessible by app's controllers
   */
  app.setGlobalPrefix(serviceName);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const appConfig = app.get('ConfigService');
  const port = appConfig.get('port');
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
