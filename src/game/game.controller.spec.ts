import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';

describe('GameController', () => {
  let controller: GameController;
  let service: GameService;

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

  const mockGameService = {
    findAll: jest.fn(),
    getGameHistory: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    makeMove: jest.fn(),
    makeAIMove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: mockGameService,
        },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
    service = module.get<GameService>(GameService);
    jest.clearAllMocks();
  });

  describe('getAllGames', () => {
    it('should return all games', async () => {
      const games = [mockGame];
      mockGameService.findAll.mockResolvedValue(games);

      const result = await controller.getAllGames();
      expect(result).toBe(games);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockGameService.findAll.mockRejectedValue(new Error());

      await expect(controller.getAllGames()).rejects.toThrow(
        new HttpException(
          'Failed to fetch games',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getGameHistory', () => {
    it('should return game history with default limit', async () => {
      const games = [mockGame];
      mockGameService.getGameHistory.mockResolvedValue(games);

      const result = await controller.getGameHistory(undefined, undefined);
      expect(result).toBe(games);
      expect(service.getGameHistory).toHaveBeenCalledWith(10, undefined);
    });

    it('should validate status parameter', async () => {
      await expect(
        controller.getGameHistory(10, 'INVALID_STATUS'),
      ).rejects.toThrow(BadRequestException);
      expect(service.getGameHistory).not.toHaveBeenCalled();
    });

    it('should validate limit parameter', async () => {
      // Don't mock service response since validation happens before service call
      await expect(controller.getGameHistory(0, 'IN_PROGRESS')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.getGameHistory).not.toHaveBeenCalled();

      await expect(controller.getGameHistory(51, 'IN_PROGRESS')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.getGameHistory).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockGameService.getGameHistory.mockRejectedValue(new Error());

      await expect(controller.getGameHistory(10, 'IN_PROGRESS')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('createGame', () => {
    it('should create a new game', async () => {
      mockGameService.create.mockResolvedValue(mockGame);

      const result = await controller.createGame();
      expect(result).toBe(mockGame);
      expect(service.create).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockGameService.create.mockRejectedValue(new Error());

      await expect(controller.createGame()).rejects.toThrow(
        new HttpException(
          'Failed to create game',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getGame', () => {
    it('should return a game by id', async () => {
      mockGameService.findById.mockResolvedValue(mockGame);
      const validId = mockGame._id.toString();

      const result = await controller.getGame(validId);
      expect(result).toBe(mockGame);
      expect(service.findById).toHaveBeenCalledWith(validId);
    });

    it('should validate game id format', async () => {
      await expect(controller.getGame('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      expect(service.findById).not.toHaveBeenCalled();
    });

    it('should handle not found game', async () => {
      mockGameService.findById.mockResolvedValue(null);
      const validId = mockGame._id.toString();

      await expect(controller.getGame(validId)).rejects.toThrow(
        new HttpException('Game not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('makeMove', () => {
    const validId = mockGame._id.toString();
    const moveData = { row: 0, col: 0 };

    it('should make a player move and trigger AI move', async () => {
      mockGameService.makeMove.mockResolvedValue({
        ...mockGame,
        board: [
          ['X', '', ''],
          ['', '', ''],
          ['', '', ''],
        ],
      });
      mockGameService.makeAIMove.mockResolvedValue({
        ...mockGame,
        board: [
          ['X', '', ''],
          ['', 'O', ''],
          ['', '', ''],
        ],
      });

      const result = await controller.makeMove(validId, moveData);
      expect(service.makeMove).toHaveBeenCalledWith(
        validId,
        moveData.row,
        moveData.col,
      );
      expect(service.makeAIMove).toHaveBeenCalledWith(validId);
      expect(result.board[1][1]).toBe('O');
    });

    it('should validate game id format', async () => {
      await expect(
        controller.makeMove('invalid-id', moveData),
      ).rejects.toThrow(BadRequestException);
      expect(service.makeMove).not.toHaveBeenCalled();
    });

    it('should handle game service errors', async () => {
      mockGameService.makeMove.mockRejectedValue(
        new Error('Cell is already occupied'),
      );

      await expect(controller.makeMove(validId, moveData)).rejects.toThrow(
        HttpException,
      );
    });

    it('should not make AI move if game is finished', async () => {
      mockGameService.makeMove.mockResolvedValue({
        ...mockGame,
        status: 'X_WON',
      });

      const result = await controller.makeMove(validId, moveData);
      expect(service.makeAIMove).not.toHaveBeenCalled();
      expect(result.status).toBe('X_WON');
    });
  });
});