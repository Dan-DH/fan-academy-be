import { EFaction, EGameModes } from "../enums/game.enums";

export interface IColyseusOnCreate {
  userId: string,
  faction: EFaction,
  token: string,
  gameMode: EGameModes,
  roomId?: string,
  opponentId?: string
}