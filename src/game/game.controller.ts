import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Query,
  ValidationPipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { GameService } from './game.service';
import { MoveDto } from './dto/move.dto';
import { Types } from 'mongoose';

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
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('status') status?: string,
  ) {
    try {
      if (
        status &&
        !['IN_PROGRESS', 'X_WON', 'O_WON', 'DRAW'].includes(status)
      ) {
        throw new BadRequestException('Invalid status value');
      }

      if (limit !== undefined && (limit < 1 || limit > 50)) {
        throw new BadRequestException('Limit must be between 1 and 50');
      }

      const parsedLimit = limit || 10;
      return await this.gameService.getGameHistory(parsedLimit, status);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
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
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid game ID format');
      }

      const game = await this.gameService.findById(id);
      if (!game) {
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      }
      return game;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof HttpException
      ) {
        throw error;
      }
      throw new HttpException(
        'Failed to get game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/move')
  async makeMove(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) moveData: MoveDto,
  ) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid game ID format');
      }

      const game = await this.gameService.makeMove(
        id,
        moveData.row,
        moveData.col,
      );
      if (game.status === 'IN_PROGRESS') {
        return await this.gameService.makeAIMove(id);
      }
      return game;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Failed to make move';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}
