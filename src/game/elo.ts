import { EFaction } from "../enums/game.enums";
import { IEloAdjustment } from "../interfaces/eloInterface";
import IUser, { IUserFactions } from "../interfaces/userInterface";
import { mapFactionsEnumToLowerCase } from "../utils/gameUtils";

export function updateELORatings(winner: IUser, winnerFaction: EFaction, loser: IUser, loserFaction: EFaction): {
  winnerNewElo: IEloAdjustment,
  loserNewElo: IEloAdjustment
} {
  const winnerFactionKey = mapFactionsEnumToLowerCase(winnerFaction) as keyof IUserFactions;
  const loserFactionKey = mapFactionsEnumToLowerCase(loserFaction) as keyof IUserFactions;

  const K = 32;

  const expectedWin = 1 / (1 + Math.pow(10, (loser.stats.factions.council.rating - winner.stats.factions[winnerFactionKey].rating) / 400));

  const winChange = Math.round(K * (1 - expectedWin));
  const lossChange = Math.round(K * (0 - (1 - expectedWin)));

  return {
    winnerNewElo: {
      rating: winner.stats.factions[winnerFactionKey].rating + winChange,
      change: winChange
    },
    loserNewElo: {
      rating: loser.stats.factions[loserFactionKey].rating + lossChange,
      change: lossChange
    }
  };
}
