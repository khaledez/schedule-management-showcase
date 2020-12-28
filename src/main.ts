import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerApp } from '@mon-medic/common';
import { ValidationPipe } from '@nestjs/common';
import { CONFIG_SERVICE, PORT, SERVICE_NAME } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get(CONFIG_SERVICE);
  const serviceName = appConfig.get(SERVICE_NAME);
  const port = appConfig.get(PORT);

  registerApp(app, serviceName);
  /**
   * use global pipes to be accessible by app's controllers
   */
  app.setGlobalPrefix(serviceName);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
