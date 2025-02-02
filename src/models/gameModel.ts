
import mongoose, { Types } from "mongoose";
import IGame from "../interfaces/gameInterface";

const { Schema, model } = mongoose;

/**
 * EquippedItem Schema
 */
const EquippedItemSchema = new Schema({
  itemName: {
    type: String,
    required: true
  }
});

/**
 * Unit Schema
 */
const UnitSchema = new Schema({
  unitClass: {
    type: String,
    enum: ["hero", "item"],
    required: true
  }, // Enum for unitClass
  unitType: {
    type: String,
    required: true
  }, // Enum could be added here as well
  unitId: {
    type: String,
    required: true
  },
  boardPosition: {
    type: Number,
    default: 0
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
    enum: ["physical", "magical"],
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
  equippedItems: [EquippedItemSchema], // Array of EquippedItem
  spriteLink: {
    type: String,
    required: true
  }
});

/**
 * Faction Schema
 */
const FactionSchema = new Schema({
  factionName: {
    type: String,
    required: true
  },
  unitsOnBoard: {
    type: [UnitSchema],
    default: []
  },
  unitsInHand: {
    type: [UnitSchema],
    default: []
  },
  unitsInDeck: {
    type: [UnitSchema],
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
});

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
    type: FactionSchema,
    required: true
  }
});

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
    enum: ["attack", "heal", "shuffle"],
    required: true
  },
  actionNumber: {
    type: Number,
    required: true
  }
});

/**
 * Turn Schema
 */
const TurnSchema = new Schema({
  turnNumber: {
    type: Number,
    required: true
  },
  activeUser: {
    type: String,
    required: true
  }, // userId
  actions: {
    type: [TurnActionSchema],
    default: []
  }
});

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
    type: [TurnSchema],
    default: []
  },
  // board: {
  //   type: String,
  //   required: true
  // },
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
  }
});

export default model<IGame>("Game", GameSchema);