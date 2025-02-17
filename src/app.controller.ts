import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Res() res: Response): void {
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to 3 Raya API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            color: #333;
            text-align: center;
            padding: 50px;
          }
          h1 {
            color: #4a90e2;
          }
          p {
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <h1>Welcome to the 3 Raya API</h1>
        <p>This API allows you to manage and play the Tic Tac Toe game.</p>
        <p>Check the documentation for more details.</p>
      </body>
      </html>
    `);
  }
}
