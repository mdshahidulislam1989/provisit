import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalConfig } from './config';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    // Your custom message here
    console.log('Server is up and running!');

    await app.listen(GlobalConfig.port);
  } catch (error) {
    console.error('Error starting the application:', error);
  }
}

bootstrap();