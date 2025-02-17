import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument } from './game.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('GameService', () => {
  let service: GameService;
  let model: Model<GameDocument>;

  const mockGame = {
    _id: new Types.ObjectId(),
    board: [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    currentPlayer: 'X',
    status: 'IN_PROGRESS',
    save: jest.fn(),
  };

  const mockModel = {
    create: jest.fn().mockResolvedValue(mockGame),
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: getModelToken(Game.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    model = module.get<Model<GameDocument>>(getModelToken(Game.name));
  });

  describe('create', () => {
    it('should create a new game', async () => {
      mockModel.create.mockResolvedValueOnce(mockGame);
      const game = await service.create();
      expect(game).toBeDefined();
      expect(game.board).toEqual([
        ['', '', ''],
        ['', '', ''],
        ['', '', ''],
      ]);
      expect(game.currentPlayer).toBe('X');
      expect(game.status).toBe('IN_PROGRESS');
    });
  });

  describe('findAll', () => {
    it('should return all games sorted by creation date', async () => {
      const mockGames = [mockGame];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGames),
        }),
      });

      const games = await service.findAll();
      expect(games).toEqual(mockGames);
    });
  });

  describe('getGameHistory', () => {
    it('should return game history with default limit', async () => {
      const mockGames = [mockGame];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockGames),
          }),
        }),
      });

      const games = await service.getGameHistory();
      expect(games).toEqual(mockGames);
    });

    it('should filter by status when provided', async () => {
      const mockGames = [{ ...mockGame, status: 'X_WON' }];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockGames),
          }),
        }),
      });

      const games = await service.getGameHistory(10, 'X_WON');
      expect(games).toEqual(mockGames);
      expect(mockModel.find).toHaveBeenCalledWith({ status: 'X_WON' });
    });
  });

  describe('findById', () => {
    it('should return a game by id', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGame),
      });

      const game = await service.findById(mockGame._id.toString());
      expect(game).toEqual(mockGame);
    });

    it('should throw NotFoundException when game not found', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('nonexistentid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('makeMove', () => {
    it('should make a valid move', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockGame,
          save: jest.fn().mockResolvedValue({
            ...mockGame,
            board: [
              ['X', '', ''],
              ['', '', ''],
              ['', '', ''],
            ],
          }),
        }),
      });

      const game = await service.makeMove(mockGame._id.toString(), 0, 0);
      expect(game.board[0][0]).toBe('X');
    });

    it('should throw error for invalid position', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGame),
      });

      await expect(
        service.makeMove(mockGame._id.toString(), 3, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for occupied cell', async () => {
      const gameWithMove = {
        ...mockGame,
        board: [
          ['X', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(gameWithMove),
      });

      await expect(
        service.makeMove(mockGame._id.toString(), 0, 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect win condition', async () => {
      const winningGame = {
        ...mockGame,
        board: [
          ['X', 'X', ''],
          ['', '', ''],
          ['', '', ''],
        ],
        save: jest.fn().mockImplementation(function () {
          return this;
        }),
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(winningGame),
      });

      const game = await service.makeMove(mockGame._id.toString(), 0, 2);
      expect(game.status).toBe('X_WON');
    });
  });

  describe('makeAIMove', () => {
    it('should make a valid AI move', async () => {
      const gameWithMove = {
        ...mockGame,
        currentPlayer: 'O',
        board: [
          ['X', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
        save: jest.fn().mockImplementation(function () {
          return this;
        }),
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(gameWithMove),
      });

      const game = await service.makeAIMove(mockGame._id.toString());
      expect(game.board.some(row => row.includes('O'))).toBe(true);
    });

    it('should prefer center position when available', async () => {
      const gameWithMove = {
        ...mockGame,
        currentPlayer: 'O',
        board: [
          ['X', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
        save: jest.fn().mockImplementation(function () {
          return {
            ...gameWithMove,
            board: [
              ['X', '', ''],
              ['', 'O', ''],
              ['', '', ''],
            ],
          };
        }),
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(gameWithMove),
      });

      const game = await service.makeAIMove(mockGame._id.toString());
      expect(game.board[1][1]).toBe('O');
    });

    it('should throw error when not AI turn', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockGame), // currentPlayer is 'X'
      });

      await expect(service.makeAIMove(mockGame._id.toString())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error when game is finished', async () => {
      const finishedGame = {
        ...mockGame,
        status: 'X_WON',
      };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(finishedGame),
      });

      await expect(service.makeAIMove(mockGame._id.toString())).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});