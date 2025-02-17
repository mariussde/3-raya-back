import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument } from './game.schema';

@Injectable()
export class GameService {
  constructor(@InjectModel(Game.name) private gameModel: Model<GameDocument>) {}

  async create(): Promise<GameDocument> {
    const newGame = new this.gameModel();
    return newGame.save();
  }

  async findAll(): Promise<GameDocument[]> {
    return this.gameModel.find().sort({ createdAt: -1 }).exec();
  }

  async getGameHistory(
    limit: number = 10,
    status?: string,
  ): Promise<GameDocument[]> {
    const query = status ? { status } : {};
    return this.gameModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<GameDocument> {
    const game = await this.gameModel.findById(id).exec();
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  async makeMove(
    gameId: string,
    row: number,
    col: number,
  ): Promise<GameDocument> {
    const game = await this.findById(gameId);

    // Validate game state
    if (game.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Game is already finished');
    }

    // Validate board boundaries
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      throw new BadRequestException('Invalid move: Position out of bounds');
    }

    // Validate cell is empty
    if (game.board[row][col] !== '') {
      throw new BadRequestException('Invalid move: Cell is already occupied');
    }

    // Validate board integrity
    if (!this.isValidBoard(game.board)) {
      throw new BadRequestException('Invalid game state: Corrupted board');
    }

    // Make the move
    game.board[row][col] = game.currentPlayer;

    // Check for win or draw
    const status = this.checkGameStatus(game.board);
    if (status) {
      game.status = status;
    } else {
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    }

    return game.save();
  }

  async makeAIMove(gameId: string): Promise<GameDocument> {
    const game = await this.findById(gameId);
    if (game.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Game is already finished');
    }
    if (game.currentPlayer !== 'O') {
      throw new BadRequestException("Not AI's turn");
    }

    if (!this.isValidBoard(game.board)) {
      throw new BadRequestException('Invalid game state: Corrupted board');
    }

    const move = this.calculateAIMove(game.board);
    return this.makeMove(gameId, move.row, move.col);
  }

  private isValidBoard(board: string[][]): boolean {
    // Check board dimensions
    if (board.length !== 3 || !board.every((row) => row.length === 3)) {
      return false;
    }

    // Check valid symbols
    const validSymbols = ['', 'X', 'O'];
    return board.every((row) =>
      row.every((cell) => validSymbols.includes(cell)),
    );
  }

  private calculateAIMove(board: string[][]): { row: number; col: number } {
    const emptyCells: { row: number; col: number }[] = [];

    // Collect empty cells
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    if (emptyCells.length === 0) {
      throw new BadRequestException('No valid moves available');
    }

    // Try center if available
    const center = emptyCells.find((cell) => cell.row === 1 && cell.col === 1);
    if (center) return center;

    // If no strategic move, choose random empty cell
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
  }

  private checkGameStatus(board: string[][]): string | null {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (
        board[i][0] &&
        board[i][0] === board[i][1] &&
        board[i][1] === board[i][2]
      ) {
        return board[i][0] === 'X' ? 'X_WON' : 'O_WON';
      }
    }

    // Check columns
    for (let j = 0; j < 3; j++) {
      if (
        board[0][j] &&
        board[0][j] === board[1][j] &&
        board[1][j] === board[2][j]
      ) {
        return board[0][j] === 'X' ? 'X_WON' : 'O_WON';
      }
    }

    // Check diagonals
    if (
      board[0][0] &&
      board[0][0] === board[1][1] &&
      board[1][1] === board[2][2]
    ) {
      return board[0][0] === 'X' ? 'X_WON' : 'O_WON';
    }
    if (
      board[0][2] &&
      board[0][2] === board[1][1] &&
      board[1][1] === board[2][0]
    ) {
      return board[0][2] === 'X' ? 'X_WON' : 'O_WON';
    }

    // Check for draw
    const isDraw = board.every((row) => row.every((cell) => cell !== ''));
    if (isDraw) return 'DRAW';

    return null;
  }
}
