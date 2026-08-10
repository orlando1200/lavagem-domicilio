import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.enableCors({
    origin: (process.env.ADMIN_WEB_URL ?? 'http://localhost:3003').split(','),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Todo controller ja usa @ApiTags/@ApiOperation/@ApiBearerAuth, mas
  // ninguem nunca chamava SwaggerModule.setup — a documentacao ficava
  // morta, gerada em nenhum lugar. `/api/docs` fica fora do
  // setGlobalPrefix (prefixo so afeta rotas de controller).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GIUCAR API')
    .setDescription('Lavagem a domicilio — marketplace de lavadores, lojas e fidelidade')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap();
