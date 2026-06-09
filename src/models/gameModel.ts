import mongoose from 'mongoose';
import IGame from '../interfaces/gameInterface';
import { EActionClass, EActionType, EClass, EGameModes, EWinConditions } from '../enums/game.enums';

const { Schema, model } = mongoose;

/**
 * GameOverSchema
 */
const GameOverSchema = new Schema({
  winCondition: {
    type: String,
    enum: EWinConditions,
    required: true
  },
  winner: {
    type: String,
    required: true
  }
}, { _id: false });

/**
 * CrystalSchema
 */
const CrystalSchema = new Schema({
  unitId: {
    type: String,
    required: true
  },
  class: {
    type: String,
    enum: EClass,
    required: true
  },
  currentHealth: {
    type: Number,
    required: true
  },
  boardPosition: {
    type: Number,
    required: true
  },
  engineerShield: String,
  stats: Number
}, { _id: false });

/**
 * ItemSchema
 */
const ItemSchema = new Schema({
  unitId: {
    type: String,
    required: true
  },
  class: {
    type: String,
    enum: EClass,
    required: true
  },
  boardPosition: {
    type: Number,
    required: true
  }
}, { _id: false });

/**
 * HeroSchema
 */
const HeroSchema = new Schema({
  unitId: {
    type: String,
    required: true
  },
  class: {
    type: String,
    enum: EClass,
    required: true
  },
  boardPosition: Number,
  currentHealth: Number,
  lastBreath: Boolean,
  stats: {
    type: Number,
    default: 0
  },
  engineerShield: String,
  shieldingAlly: String
}, { _id: false });

/**
 * HeroOrItemSchema
 */
const HeroOrItemSchema = new Schema(
  {
    class: {
      type: String,
      enum: ['hero', 'item'],
      required: true
    }
  },
  {
    discriminatorKey: 'class',
    _id: false
  }
);

/**
 * HeroOrCrystalSchema
 */
const HeroOrCrystalSchema = new Schema(
  {
    class: {
      type: String,
      enum: ['hero', 'crystal'],
      required: true
    }
  },
  {
    discriminatorKey: 'class',
    _id: false
  }
);

/**
 * FactionSchema
 */
// const FactionSchema = new Schema({
//   factionName: {
//     type: String,
//     enum: EFaction,
//     required: true
//   }
// }, { _id: false });

/**
 * TurnActionSchema
 */
const TurnActionSchema = new Schema({
  actorPosition: {
    type: Number,
    required: false
  },
  targetPosition: {
    type: Number,
    required: false
  },
  action: {
    type: String,
    enum: EActionType,
    required: true
  },
  actionClass: {
    type: String,
    enum: EActionClass,
    required: true
  }
}, { _id: false });

/**
 * GamePlayerDataSchema
 */
const GamePlayerDataSchema = new Schema({
  userId: String,
  username: String,
  portrait: String,
  faction: String
}, { _id: false });

/**
 * GamePlayerResourcesSchema
 */
const GamePlayerResourcesSchema = new Schema({
  hand: [HeroOrItemSchema],
  deck: [HeroOrItemSchema]
}, { _id: false });

/**
 * GameStateSchema
 */
const GameStateSchema = new Schema({
  p1: {
    type: GamePlayerResourcesSchema,
    required: false
  },
  p2: {
    type: GamePlayerResourcesSchema,
    required: false
  },
  boardState: { type: [HeroOrCrystalSchema] }
}, { _id: false });

/**
 * GameCurrentTurnSchema
 */
const GameCurrentTurnSchema = new Schema({
  turnStartSnapshot: GameStateSchema,
  turnEndSnapshot: GameStateSchema,
  actions: [TurnActionSchema]
}, { _id: false });

/**
 * ChatMessageSchema
 */
const ChatMessageSchema = new Schema({
  username: {
    type: String,
    require: true
  },
  message: {
    type: String,
    require: true
  }
}, { _id: false });

/**
 * GameSchema
 */
const GameSchema = new Schema({
  players: {
    type: [GamePlayerDataSchema],
    required: true
  },
  gameMode: {
    type: String,
    enum: EGameModes,
    required: true
  },
  map: Number,
  status: {
    type: String,
    required: true
  },
  turnNumber: {
    type: Number,
    required: true
  },
  turnHistory: [GameCurrentTurnSchema],
  currentTurn: GameCurrentTurnSchema,
  gameOver: GameOverSchema,
  createdAt: Date,
  finishedAt: Date,
  lastPlayedAt: Date,
  activePlayer: String,
  chatLog: [ChatMessageSchema]
});

// Discriminators
(GamePlayerResourcesSchema.path('hand') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(GamePlayerResourcesSchema.path('hand') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);
(GamePlayerResourcesSchema.path('deck') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(GamePlayerResourcesSchema.path('deck') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);
(GameStateSchema.path('boardState') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(GameStateSchema.path('boardState') as mongoose.Schema.Types.DocumentArray).discriminator('crystal', CrystalSchema);

// Indexes
GameSchema.index({ gameMode: 1 });
GameSchema.index({ lastPlayedAt: 1 });
GameSchema.index({ "players.userId": 1 });
GameSchema.index({
  status: 1,
  "players.userId": 1,
  lastPlayedAt: 1
});

export default model<IGame>('Game', GameSchema);