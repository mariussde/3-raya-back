import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['https://3-raya-front-one.vercel.app'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: ['Access-Control-Allow-Origin'],
    },
  });
  
  const configService = app.get(ConfigService);

  // Additional security headers middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://3-raya-front-one.vercel.app');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.status(204).send();
    } else {
      next();
    }
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Tic Tac Toe API')
    .setDescription('The Tic Tac Toe game API')
    .setVersion('1.0')
    .addBearerAuth()  // Add this if you're using JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});