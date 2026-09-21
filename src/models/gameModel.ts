import mongoose, { Types } from 'mongoose';
import IGame from '../interfaces/gameInterface';
import { EActionClass, EActionType, EFaction, EGameModes, EWinConditions } from '../enums/game.enums';

const { Schema, model } = mongoose;

/**
 * Game Over Schema
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
 * UnitOrItem Schema since Mongoose doesn't allow arrays of mixed schemas
 */
const HeroOrCrystalSchema = new Schema(
  {
    boardType: {
      type: String,
      enum: ['hero', 'crystal'],
      required: true
    }
  },
  {
    discriminatorKey: 'boardType',
    _id: false
  }
);

/**
 * Item Schema
 */
const CrystalSchema = new Schema({
  unitId: {
    type: String,
    required: true
  },
  belongsTo: {
    type: Number,
    required: true
  },
  maxHealth: {
    type: Number,
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
  status: {
    type: Number,
    required: true
  }
}, { _id: false });

/**
 * Item Schema
 */
const ItemSchema = new Schema({
  faction: {
    type: String,
    required: true
  },
  unitId: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    required: true
  },
  boardPosition: {
    type: Number,
    required: true
  },
  belongsTo: {
    type: Number,
    required: true,
    default: 1
  }
}, { _id: false });

/**
 * Hero Schema
 */
const HeroSchema = new Schema({
  faction: {
    type: String,
    required: true
  },
  unitType: {
    type: String,
    required: true
  },
  unitId: {
    type: String,
    required: true
  },
  boardPosition: {
    type: Number,
    required: true
  },
  belongsTo: {
    type: Number,
    required: true,
    default: 1
  },
  maxHealth: {
    type: Number,
    required: false
  },
  currentHealth: {
    type: Number,
    required: false
  },
  lastBreath: {
    type: Boolean,
    default: false
  },
  unitsConsumed: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    default: 0
  },
  shieldingAlly: {
    type: String,
    required: false
  }
}, { _id: false });

/**
 * HeroOrItemSchema since Mongoose doesn't allow arrays of mixed schemas
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
 * user Schema
 */
const UserSchema = new Schema({
  userData: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  faction: {
    type: String,
    enum: Object.values(EFaction),
    required: false
  }
}, { _id: false });

/**
 * TurnAction Schema
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
 * PlayerState Schema
 */
const PlayerStateSchema = new Schema({
  playerId: {
    type: Types.ObjectId,
    required: true
  },
  hand: {
    type: [HeroOrItemSchema],
    default: []
  },
  deck: {
    type: [HeroOrItemSchema],
    default: []
  }
}, { _id: false });

(PlayerStateSchema.path('hand') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(PlayerStateSchema.path('hand') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);
(PlayerStateSchema.path('deck') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(PlayerStateSchema.path('deck') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);

// FIXME: remove tile schema and interface?
/**
 * Tile Schema
 */
// const TileSchema = new Schema({
//   row: {
//     type: Number,
//     required: true
//   },
//   col: {
//     type: Number,
//     required: true
//   },
//   boardPosition: {
//     type: Number,
//     required: true
//   },
//   tileType: {
//     type: String,
//     enum: ETiles,
//     required: true
//   },
//   x: {
//     type: Number,
//     required: true
//   },
//   y: {
//     type: Number,
//     required: true
//   },
//   obstacle: {
//     type: Boolean,
//     required: true
//   },
//   hero: {
//     type: HeroSchema,
//     required: false
//   },
//   crystal: {
//     type: CrystalSchema,
//     required: false
//   }
// }, { _id: false });

/**
 * GameState Schema
 */
const GameStateSchema = new Schema({
  player1: {
    type: PlayerStateSchema,
    required: false
  },
  player2: {
    type: PlayerStateSchema,
    required: false
  },
  boardState: {
    type: [HeroOrCrystalSchema],
    default: []
  },
  action: {
    type: TurnActionSchema,
    required: false
  }
}, { _id: false });

(GameStateSchema.path('boardState') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(GameStateSchema.path('boardState') as mongoose.Schema.Types.DocumentArray).discriminator('crystal', CrystalSchema);

/**
 * RoomState Schema
 */
const GameSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  players: {
    type: [UserSchema],
    default: []
  },
  turnNumber: {
    type: Number,
    required: true
  },
  previousTurn: {
    type: [GameStateSchema],
    required: true
  },
  gameOver: {
    type: GameOverSchema,
    required: false
  },
  status: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  finishedAt: {
    type: Date,
    required: false
  },
  lastPlayedAt: {
    type: Date,
    required: false
  },
  activePlayer: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  chatLogs: {
    type: Types.ObjectId,
    ref: 'ChatLog',
    required: false // TODO: remove this field. Make it into it's own query (or do a lookup)
  },
  gameMode: {
    type: String,
    enum: EGameModes,
    required: true
  },
  map: {
    type: Number,
    required: true
  }
});

// Indexing for checking if games have timed out
GameSchema.index({
  'players.userData': 1,
  status: 1,
  lastPlayedAt: 1
});

export default model<IGame>('Game', GameSchema);