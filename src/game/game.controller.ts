import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  async getAllGames() {
    try {
      return await this.gameService.findAll();
    } catch {
      throw new HttpException(
        'Failed to fetch games',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  async getGameHistory(
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 10;
      return await this.gameService.getGameHistory(parsedLimit, status);
    } catch {
      throw new HttpException(
        'Failed to fetch game history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createGame() {
    try {
      return await this.gameService.create();
    } catch {
      throw new HttpException(
        'Failed to create game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getGame(@Param('id') id: string) {
    try {
      const game = await this.gameService.findById(id);
      if (!game) {
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      }
      return game;
    } catch {
      throw new HttpException(
        'Failed to get game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/move')
  async makeMove(
    @Param('id') id: string,
    @Body() moveData: { row: number; col: number },
  ) {
    try {
      const game = await this.gameService.makeMove(
        id,
        moveData.row,
        moveData.col,
      );
      if (game.status === 'IN_PROGRESS') {
        return await this.gameService.makeAIMove(id);
      }
      return game;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to make move';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}
