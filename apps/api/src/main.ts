import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AuthConfig } from './auth/auth.config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const auth = app.get(AuthConfig);
  app.set('trust proxy', auth.trustProxy);
  app.enableCors({
    origin: auth.frontendOrigin,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'X-CSRF-Token'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Wallet API')
    .setDescription('Wallet app API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}
void bootstrap();
