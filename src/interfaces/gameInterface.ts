import { Types } from "mongoose";
import { EActionClass, EActionType, EBoardUnit, EClass, EFaction, EGameModes, EGameStatus, EHeroes, EItems, ETiles, EWinConditions } from "../enums/game.enums";
import { IUserFactionStats, IUserPreferences } from "./userInterface";

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
  gameId: Types.ObjectId,
  currentTurn: IGameState[],
  turnNumber: number,
  newActivePlayer: Types.ObjectId,
  gameOver?: IGameOver
}

/**
 * Item Interface
 */
export interface IItem { // FIXME: this can also be trimmed a bit
  class: EClass;
  faction: EFaction;
  unitId: string; // userId_itemName_itemNumber
  itemType: EItems;
  boardPosition: number; // 45-51
  belongsTo: number;
}

/**
 * Hero Interface
 */
export interface IHero {
  class: EClass;
  faction: EFaction;
  unitType: EHeroes;
  unitId: string; // userId_unitName_unitNumber
  boardType: EBoardUnit;
  boardPosition: number;
  belongsTo: number;
  currentHealth?: number;
  maxHealth?: number;
  lastBreath?: boolean;
  unitsConsumed?: number
  status?: number;
  shieldingAlly?: string;
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
  stats?: IUserFactionStats;
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
  action: EActionType; // FIXME: rename to actionType
  actionClass: EActionClass
}

/**
 * Player Interface
 */
export interface IPlayerState {
  playerId: Types.ObjectId;
  hand: (Partial<IHero> | IItem)[];
  deck: (Partial<IHero> | IItem)[];
}

/**
 * Crystal Interface
 */
export interface ICrystal {
  unitId: string;
  belongsTo: number;
  maxHealth: number;
  currentHealth: number;
  boardPosition: number;
  status: number;
  boardType: EBoardUnit;
}

/**
 * Tile Interface
 */
// FIXME: we should not send the tiles at all to the FE. Replace with array of units (hero/crystal)
export interface ITile {
  row: number;
  col: number;
  tileType: ETiles;
  x: number;
  y: number;
  boardPosition: number;
}

/**
 * GameState Interface
 */
export interface IGameState {
  player1?: IPlayerState;
  player2?: IPlayerState;
  boardState?: (IHero | ICrystal)[];
  action?: ITurnAction;
}

/**
 * Game Interface
 */
export default interface IGame {
  _id: Types.ObjectId;
  players: IPlayerData[];
  turnNumber: number,
  map: number,
  turnHistory?: IGameState[][];
  previousTurn: IGameState[];
  gameOver?: IGameOver,
  status: EGameStatus;
  createdAt: Date;
  finishedAt?: Date;
  lastPlayedAt?: Date;
  firstPlayer: Types.ObjectId;
  activePlayer?: Types.ObjectId; // userId
  chatLogs?: Types.ObjectId;
  gameMode: EGameModes;
}