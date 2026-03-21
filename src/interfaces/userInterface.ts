import { Types } from "mongoose";

export interface IUserPreferences {
  emailNotifications: boolean;
  chat: boolean;
}

export interface IUserStats {
  totalGames: number;
  totalWins: number;
  council: IUserFactionStats
  elves: IUserFactionStats
  dwarves: IUserFactionStats
}

export interface IUserFactionStats {
  games: number,
  wins: number,
  rating: number
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