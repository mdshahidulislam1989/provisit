import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalConfig } from '././config';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({whitelist: true}));
  const options = new DocumentBuilder()
    .setTitle('ProVisit App: The Ultimate Field Task Tracker')
    .setDescription(
      `Pro Visit App is your go-to solution for efficient field task tracking. Streamline your operations, manage tasks, and keep your team in the same place, all in one powerful app. Whether you're in field service, sales, or any industry requiring on-the-go task management, Pro Visit App has got you covered. Say goodbye to paperwork and hello to productivity with Pro Visit App. Try it today and transform the way you work.`,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  await app.listen(GlobalConfig.port);
} catch (error) {
  console.error('Error starting the application:', error);
}
}
bootstrap();
