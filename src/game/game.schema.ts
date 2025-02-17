import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  @Prop({
    required: true,
    type: [[String]],
    default: Array(3).fill(Array(3).fill('')),
  })
  board: string[][];

  @Prop({ required: true, enum: ['X', 'O'], default: 'X' })
  currentPlayer: string;

  @Prop({
    required: true,
    enum: ['IN_PROGRESS', 'X_WON', 'O_WON', 'DRAW'],
    default: 'IN_PROGRESS',
  })
  status: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);
