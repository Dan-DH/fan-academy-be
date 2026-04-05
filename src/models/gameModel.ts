import mongoose, { Types } from 'mongoose';
import IGame from '../interfaces/gameInterface';
import { EActionClass, EActionType, EClass, EFaction, EGameModes, EWinConditions } from '../enums/game.enums';

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
  class: {
    type: String,
    enume: EClass,
    required: true
  },
  unitId: {
    type: String,
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
  boardPosition: {
    type: Number,
    required: true
  },
  class: {
    type: String,
    enume: EClass,
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
  boardPosition: {
    type: Number,
    required: true
  },
  currentHealth: {
    type: Number,
    required: true
  },
  lastBreath: Boolean,
  stats: {
    type: Number,
    default: 0
  },
  engineerShield: String,
  shieldingAlly: String,
  class: {
    type: String,
    enume: EClass,
    required: true
  }
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
const FactionSchema = new Schema({
  factionName: {
    type: String,
    enum: EFaction,
    required: true
  }
}, { _id: false });

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
  userId: Types.ObjectId,
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
  player1: {
    type: GamePlayerResourcesSchema,
    required: false
  },
  player2: {
    type: GamePlayerResourcesSchema,
    required: false
  },
  boardState: { type: [HeroOrCrystalSchema] }
}, { _id: false });

/**
 * GameCurrentTurnSchema
 */
const GameCurrentTurnSchema = new Schema({
  turnStart: GameStateSchema,
  turnEnd: GameStateSchema,
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
  _id: {
    type: Types.ObjectId,
    required: true
  },
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
(FactionSchema.path('unitsInHand') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(FactionSchema.path('unitsInHand') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);
(FactionSchema.path('unitsInDeck') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(FactionSchema.path('unitsInDeck') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);
(FactionSchema.path('boardState') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(FactionSchema.path('boardState') as mongoose.Schema.Types.DocumentArray).discriminator('crystal', CrystalSchema);

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