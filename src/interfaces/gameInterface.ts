import { Types } from "mongoose";
import { EActionClass, EActionType, EAttackType, EClass, EFaction, EGameStatus, EHeroes, EItems, ETiles, EWinConditions } from "../enums/game.enums";
import { IUserStats, IUserPreferences } from "./userInterface";

/**
 * Coordinates Interface
 */
export type ICoordinates = {
  x: number,
  y: number,
  row?: number,
  col?: number
  boardPosition?: number
};

/**
 * Game Over Interface
 */
export interface IGameOver {
  winCondition: EWinConditions,
  winner: string
}

/**
 * Turn message Interface
 */
export interface ITurnMessage {
  _id: Types.ObjectId,
  currentTurn: IGameState[],
  turnNumber: number,
  newActivePlayer: Types.ObjectId,
  gameOver?: IGameOver
}

/**
 * Item Interface
 */
export interface IItem {
  class: EClass;
  faction: EFaction;
  unitId: string; // userId_itemName_itemNumber
  itemType: EItems;
  boardPosition: number; // 45-51
  row: number;
  belongsTo: number;
  canHeal: boolean;
  dealsDamage: boolean;
}

/**
 * Hero Interface
 */
export interface IHero {
  class: EClass;
  unitId: string; // userId_unitName_unitNumber
  belongsTo: number;
  boardPosition: number;
  faction: EFaction;
  unitType: EHeroes;
  row: number;
  col: number;
  baseHealth: number;
  maxHealth: number;
  currentHealth: number;
  isKO: boolean;
  lastBreath: boolean;
  movement: number;
  attackRange: number;
  healingRange: number;
  buffRange: number;
  attackType: EAttackType;
  basePower: number;
  physicalDamageResistance: number;
  magicalDamageResistance: number;
  basePhysicalDamageResistance: number;
  baseMagicalDamageResistance: number;
  factionEquipment: boolean;
  runeMetal: boolean;
  shiningHelm: boolean;
  superCharge: boolean;
  canHeal: boolean;
  canBuff: boolean;
  unitsConsumed?: number
  priestessDebuff: boolean;
  attackTile: boolean;
  magicalResistanceTile: boolean;
  physicalResistanceTile: boolean;
  manaVial: boolean;
  speedTile: boolean;
  dwarvenBrew: boolean;
  engineerShield?: string;
  annihilatorDebuff: boolean;
  shieldingAlly?: string;
  paladinAura: number;
}
/**
 * Faction Interface
 */
export interface IFaction {
  userId: string;
  factionName: EFaction;
  unitsInHand: (IHero | IItem)[];
  unitsInDeck: (IHero | IItem)[];
}

/**
 * userData Interface
 */
export interface IPlayerData {
  userData: Types.ObjectId;
  faction?: EFaction; // Need to be optional for challenges
}

/**
 * Populated player interface
 */
export interface IPopulatedPlayerData {
  userData: IPopulatedUserData;
  faction?: EFaction;
}
export interface IPopulatedUserData {
  _id: Types.ObjectId;
  username?: string;
  picture?: string;
  email?: string;
  stats?: IUserStats;
  preferences?: IUserPreferences;
  confirmedEmail?: boolean;
  turnEmailSent?: boolean
};

/**
 * TurnAction Interface
 */
export interface ITurnAction {
  actorPosition?: number;
  targetPosition?: number; // an item can be a target for shuffle
  action: EActionType,
  actionClass: EActionClass
}

/**
 * Player Interface
 */
export interface IPlayerState {
  playerId: Types.ObjectId;
  factionData: IFaction;
}

/**
 * Crystal Interface
 */
export interface ICrystal {
  unitId: string;
  belongsTo: number;
  maxHealth: number;
  currentHealth: number;
  isDestroyed: boolean;
  isLastCrystal: boolean;
  boardPosition: number;
  debuffLevel: number;
  row: number;
  col: number;
  engineerShield?: string;
  paladinAura: number;
  physicalDamageResistance: number;
  magicalDamageResistance: number;
  basePhysicalDamageResistance: number;
  baseMagicalDamageResistance: number;
}

/**
 * Tile Interface
 */
export interface ITile {
  row: number;
  col: number;
  tileType: ETiles;
  x: number;
  y: number;
  boardPosition: number;
  obstacle: boolean;
  hero?: IHero | undefined;
  crystal?: ICrystal | undefined;
}

/**
 * GameState Interface
 */
export interface IGameState {
  player1?: IPlayerState;
  player2?: IPlayerState;
  boardState?: ITile[];
  action?: ITurnAction;
}

/**
 * Game Interface
 */
export default interface IGame {
  _id: Types.ObjectId;
  players: IPlayerData[];
  turnNumber: number,
  previousTurn: IGameState[];
  gameOver?: IGameOver,
  status: EGameStatus;
  createdAt: Date;
  finishedAt?: Date;
  lastPlayedAt?: Date;
  activePlayer?: Types.ObjectId; // userId
  chatLogs?: Types.ObjectId
}