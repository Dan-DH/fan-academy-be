import mongoose, { Types } from 'mongoose';
import IGame from '../interfaces/gameInterface';
import { EFaction } from '../enums/game.enums';

const { Schema, model } = mongoose;

/**
 * Item Schema
 */
const ItemSchema = new Schema({
  // class: {
  //   type: String,
  //   required: true
  // },
  itemId: {
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
  isActive: {
    type: Boolean,
    required: true
  }
}, { _id: false });

/**
 * Hero Schema
 */
const HeroSchema = new Schema({
  // unitClass: {
  //   type: String,
  //   required: true
  // },
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
  movement: {
    type: Number,
    required: true
  },
  range: {
    type: Number,
    required: true
  },
  attackType: {
    type: String,
    enum: ['physical', 'magical'],
    required: true
  },
  rangeAttackDamage: {
    type: Number,
    required: true
  },
  meleeAttackDamage: {
    type: Number,
    required: true
  },
  healingPower: {
    type: Number,
    default: 0
  }, // If > 0 can heal
  physicalDamageResistance: {
    type: Number,
    default: 0
  },
  magicalDamageResistance: {
    type: Number,
    default: 0
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
  isActive: {
    type: Boolean,
    required: true
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
    enum: Object.values(EFaction),
    required: true
  },
  unitsInHand: {
    type: [UnitOrItemSchema], // REVIEW: doesn't enforce data validation
    default: []
  },
  unitsInDeck: {
    type: [UnitOrItemSchema],
    default: []
  },
  cristalOneHealth: {
    type: Number,
    required: false // FIXME:
  },
  cristalTwoHealth: {
    type: Number,
    required: false // FIXME:
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
    required: true
  }
}, { _id: false });

/**
 * TurnAction Schema
 */
const TurnActionSchema = new Schema({
  activeUnit: {
    type: String,
    required: true
  }, // Unit id
  targetUnit: {
    type: String,
    required: true
  }, // Unit id or deck
  action: {
    type: String,
    enum: ['attack', 'heal', 'shuffle'],
    required: true
  },
  actionNumber: {
    type: Number,
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
 * GameState Schema
 */
const GameStateSchema = new Schema({
  player1: {
    type: PlayerStateSchema,
    required: true
  },
  player2: {
    type: PlayerStateSchema,
    required: false
  },
  boardState: {
    type: [HeroSchema],
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
  gameState: {
    type: [GameStateSchema],
    default: []
  },
  currentState: {
    type: GameStateSchema,
    required: false
  },
  winCondition: {
    type: String,
    required: false
  },
  winner: {
    type: String,
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
  activePlayer: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  } // userId
});

export default model<IGame>('Game', GameSchema);