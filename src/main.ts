import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 🌍 Permitir CORS de cualquier origen (para pruebas)
  app.enableCors({
    origin: true, // 🔥 Acepta cualquier origen (en producción, especifica dominios permitidos)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: '*', // 🔥 Permite cualquier encabezado
    exposedHeaders: ['Access-Control-Allow-Origin'],
  });

  // 📄 Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Tic Tac Toe API')
    .setDescription('The Tic Tac Toe game API')
    .setVersion('1.0')
    .addBearerAuth() // Si usas JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 🚀 Iniciar servidor
  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
