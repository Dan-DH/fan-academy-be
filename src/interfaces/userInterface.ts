import { Types } from "mongoose";

export interface IUserPreferences {
  emailNotifications: boolean;
  chat: boolean;
}

export interface IUserStats {
  totalGames: number;
  totalWins: number;
  factions: IUserFactions;
}

export interface IUserFactions {
  council: IUserFactionStats
  elves: IUserFactionStats
  dwarves: IUserFactionStats
}

export interface IUserFactionStats {
  games: number,
  wins: number,
  rating: number,
  opponentFactions: IUserOpponentFactions
}

export interface IUserOpponentFactions {
  council: IUserOpponentFactionStats,
  elves: IUserOpponentFactionStats,
  dwarves: IUserOpponentFactionStats
}

export interface IUserOpponentFactionStats {
  games: number,
  totalWins: number,
  totalLoses: number,
  wins: IUserOpponentFactionWinStats,
  loses: IUserOpponentFactionWinStats
}

export interface IUserOpponentFactionWinStats {
  crystal: number,
  hero: number,
  timeout: number,
  conceded: number
}

interface IUser extends Express.User {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  picture?: string;
  preferences: IUserPreferences;
  stats: IUserStats;
  emailConfirmationLink: string;
  confirmedEmail: boolean;
  recoveryCode?: string;
}

export default IUser;