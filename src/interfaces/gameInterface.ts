import { Types } from "mongoose";
import { EActionClass, EActionType, EClass, ECrystalType, EFaction, EGameModes, EGameStatus, EWinConditions } from "../enums/game.enums";

export interface IGameOver {
  winCondition: EWinConditions;
  winner: string;
}

export interface ITurnMessage {
  _id: Types.ObjectId;
  currentTurn: IGameTurn;
  turnNumber: number; // TODO: don't need to send this, I can increment through the query
  actions: ITurnAction[];
  lastPlayedAt: Date; // TODO: get from FE
  newActivePlayer: Types.ObjectId;
  gameOver?: IGameOver;
}

export interface IItem {
  unitId: string; // userId_itemName_itemNumber
  boardPosition: number; // 45-51
}

export interface IHero {
  unitId: string; // userId_unitName_unitNumber
  boardPosition: number;
  currentHealth: number;
  stats: number; // bitmask. Default 0
  lastBreath?: boolean;
  unitsConsumed?: number
  engineerShield?: string;
  shieldingAlly?: string;
}

// export interface IPlayerData {
//   userId: string;
//   username?: string;
//   portrait?: string; // TODO: rename this in db
//   faction?: EFaction; // Need to be optional for challenges
// }

export interface IPlayerData {
  userId: string;
  username?: string;
  portrait?: string;
  faction?: EFaction;
};

export interface ITurnAction {
  actorPosition?: number;
  targetPosition?: number; // an item can be a target for shuffle
  action: EActionType;
  actionClass: EActionClass;
}

export interface IPlayerResources {
  deck: (IHero | IItem)[];
  hand?: (IHero | IItem)[];
}

export interface ICrystal {
  unitId: string;
  class: EClass;
  currentHealth?: number;
  boardPosition: number;
  stats?: number; // bitmask -diff from hero bitmask
  engineerShield?: string;
  type: ECrystalType;
}

export interface IGameTurn {
  turnStartSnapshot: IGameState;
  turnEndSnapshot?: IGameState;
  actions?: ITurnAction[];
}

export interface IGameState {
  p1?: IPlayerResources;
  p2?: IPlayerResources;
  boardState?: (IHero | ICrystal)[];
}

interface IChatMessage {
  username: string;
  message: string;
}

export default interface IGame {
  _id: Types.ObjectId;
  players: IPlayerData[];
  gameMode: EGameModes;
  status: EGameStatus;

  map?: number, // maps to the differnt maps in game. No need for ITile anymore
  turnNumber: number;
  turnHistory?: IGameTurn[],
  currentTurn?: IGameTurn;
  gameOver?: IGameOver;
  createdAt: Date;
  finishedAt?: Date;
  lastPlayedAt?: Date;
  activePlayer?: string; // userId
  chatLog?: IChatMessage[];
}