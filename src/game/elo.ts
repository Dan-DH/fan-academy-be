import { EFaction } from "../enums/game.enums";
import { FactionKeys, IEloAdjustment } from "../interfaces/eloInterface";
import IUser from "../interfaces/userInterface";
import { factionLowerCaseKey } from "../utils/gameUtils";

export function updateELORatings(winner: IUser, winnerFaction: EFaction, loser: IUser, loserFaction: EFaction): {
  winnerNewElo: IEloAdjustment,
  loserNewElo: IEloAdjustment
} {
  const K = 32;

  const loserFactionStatKey = factionLowerCaseKey[loserFaction] as FactionKeys;
  const winnerFactionStatKey = factionLowerCaseKey[winnerFaction] as FactionKeys;

  console.log('winner', winner);
  console.log('loser', loser);

  const expectedWin = 1 / (1 + Math.pow(10, (loser.stats[loserFactionStatKey].rating - winner.stats[winnerFactionStatKey].rating) / 400));

  const winChange = Math.round(K * (1 - expectedWin));
  const lossChange = Math.round(K * (0 - (1 - expectedWin)));

  return {
    winnerNewElo: {
      rating: winner.stats[winnerFactionStatKey].rating + winChange,
      change: winChange
    },
    loserNewElo: {
      rating: loser.stats[loserFactionStatKey].rating + lossChange,
      change: lossChange
    }
  };
}
