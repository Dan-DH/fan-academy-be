import { EFaction, EWinConditions } from "../enums/game.enums";

export function mapWinConditionsForEMail(winCondition: EWinConditions) {
  const winConMap = {
    [EWinConditions.CRYSTAL]: 'crystal victory',
    [EWinConditions.HERO]: 'hero victory',
    [EWinConditions.TIMEOUT]: 'timeout',
    [EWinConditions.CONCEDED]: 'concession'
  };

  return winConMap[winCondition];
};

export function mapFactionsForEMail(faction: EFaction) {
  const factionMap = {
    [EFaction.COUNCIL]: 'Council',
    [EFaction.DARK_ELVES]: 'Dark Elves',
    [EFaction.DWARVES]: 'Dwarves'
  };

  return factionMap[faction];
};