import { EFaction, EGameModes } from "../enums/game.enums";

export interface IColyseusOnCreate {
  userId: string,
  username: string,
  portrait: string,
  faction: EFaction,
  token: string, // FIXME: I don't think these are needed
  gameMode: EGameModes,
  roomId?: string, // FIXME:
  opponentId?: string
}