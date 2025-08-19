import mongoose, { Types } from 'mongoose';
import IGame from '../interfaces/gameInterface';
import { EActionClass, EActionType, EAttackType, EFaction, ETiles, EWinConditions } from '../enums/game.enums';

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
 * Item Schema
 */
const CrystalSchema = new Schema({
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
  isDestroyed: {
    type: Boolean,
    required: true
  },
  isLastCrystal: {
    type: Boolean,
    required: true
  },
  boardPosition: {
    type: Number,
    required: true
  },
  debuffLevel: {
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
  },
  canHeal: {
    type: Boolean,
    required: true
  },
  dealsDamage: {
    type: Boolean,
    required: true
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
    default: 51
  },
  row: {
    type: Number,
    required: true
  },
  col: {
    type: Number,
    required: true
  },
  baseHealth: {
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
  isKO: {
    type: Boolean,
    default: false
  },
  lastBreath: {
    type: Boolean,
    default: false
  },
  movement: {
    type: Number,
    required: true
  },
  attackRange: {
    type: Number,
    required: true
  },
  healingRange: {
    type: Number,
    required: true
  },
  attackType: {
    type: String,
    enum: EAttackType,
    required: true
  },
  basePower: {
    type: Number,
    required: true
  },
  physicalDamageResistance: {
    type: Number,
    required: true
  },
  basePhysicalDamageResistance: {
    type: Number,
    required: true
  },
  magicalDamageResistance: {
    type: Number,
    required: true
  },
  baseMagicalDamageResistance: {
    type: Number,
    required: true
  },
  factionBuff: {
    type: Boolean,
    required: true
  },
  runeMetal: {
    type: Boolean,
    required: true
  },
  shiningHelm: {
    type: Boolean,
    required: true
  },
  superCharge: {
    type: Boolean,
    required: true
  },
  belongsTo: {
    type: Number,
    required: true,
    default: 1
  },
  canHeal: {
    type: Boolean,
    required: true
  },
  unitsConsumed: {
    type: Number,
    default: 0
  },
  isDebuffed: {
    type: Boolean,
    required: true
  },
  attackTile: {
    type: Boolean,
    required: true
  },
  manaVial: {
    type: Boolean,
    required: false
  },
  speedTile: {
    type: Boolean,
    required: false
  }
}, { _id: false });

/**
 * UnitOrItem Schema since Mongoose doesn't allow arrays of mixed schemas
 */
const UnitOrItemSchema = new Schema(
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
 * Faction Schema
 */
const FactionSchema = new Schema({
  factionName: {
    type: String,
    enum: EFaction,
    required: true
  },
  unitsInHand: {
    type: [UnitOrItemSchema],
    default: []
  },
  unitsInDeck: {
    type: [UnitOrItemSchema],
    default: []
  }
}, { _id: false });

(FactionSchema.path('unitsInHand') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(FactionSchema.path('unitsInHand') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);
(FactionSchema.path('unitsInDeck') as mongoose.Schema.Types.DocumentArray).discriminator('hero', HeroSchema);
(FactionSchema.path('unitsInDeck') as mongoose.Schema.Types.DocumentArray).discriminator('item', ItemSchema);

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
  factionData: {
    type: FactionSchema,
    required: true
  }
}, { _id: false });

/**
 * Tile Schema
 */
const TileSchema = new Schema({
  row: {
    type: Number,
    required: true
  },
  col: {
    type: Number,
    required: true
  },
  boardPosition: {
    type: Number,
    required: true
  },
  tileType: {
    type: String,
    enum: ETiles,
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  obstacle: {
    type: Boolean,
    required: true
  },
  hero: {
    type: HeroSchema,
    required: false
  },
  crystal: {
    type: CrystalSchema,
    required: false
  }
}, { _id: false });

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
    type: [TileSchema],
    default: []
  },
  action: {
    type: TurnActionSchema,
    required: false
  }
}, { _id: false });

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
  }, // userId
  chatLogs: {
    type: Types.ObjectId,
    ref: 'ChatLog',
    required: false
  }
});

// Indexing for checking if games have timed out
GameSchema.index({
  'players.userData': 1,
  status: 1,
  lastPlayedAt: 1
});

export default model<IGame>('Game', GameSchema);