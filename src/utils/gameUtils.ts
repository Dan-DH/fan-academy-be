import { SortOrder } from "mongoose";
import { EFaction, EHeroes, EItems, EWinConditions } from "../enums/game.enums";
import { ELeaderboardEnum } from "../enums/leaderboard.enums";

import { CustomError } from "../classes/customError";
import IUser from "../interfaces/userInterface";
import { updateELORatings } from "../game/elo";
import User from "../models/userModel";

export function createFactionDeck(userId: string, faction: EFaction): {
  userId: string,
  deck: { unitId: string }[],
} {
  const unitsDeck = [];
  const itemsDeck = [];

  const unitReferences = createDeckMapping(faction);

  for (let index = 0; index < 3; index++) {
    const tank = { unitId: `${userId}_${unitReferences.dps}_${index}` };
    const dps = { unitId: `${userId}_${unitReferences.tank}_${index}` };
    const mage = { unitId: `${userId}_${unitReferences.mage}_${index}` };
    const support = { unitId: `${userId}_${unitReferences.support}_${index}` };
    const magicItem = { unitId: `${userId}_${unitReferences.magicItem}_${index}` };
    const runeMetal = { unitId: `${userId}_${unitReferences.runeMetal}_${index}` };
    const factionEquipment = { unitId: `${userId}_${unitReferences.factionEquipment}_${index}` };

    unitsDeck.push(dps, tank, mage, support);
    itemsDeck.push(magicItem, runeMetal, factionEquipment);
  }

  for (let index = 0; index < 2; index++) {
    const potion = { unitId: `${userId}_${unitReferences.potion}_${index}` };
    const spell = { unitId: `${userId}_${unitReferences.spell}_${index}` };
    const superCharge = { unitId: `${userId}_${unitReferences.superCharge}_${index}` };

    itemsDeck.push(potion, spell, superCharge);
  }

  unitsDeck.push({ unitId: `${userId}_${unitReferences.dps}` });

  const deck = shuffleDeck(unitsDeck, itemsDeck);

  return {
    userId,
    deck
  };
}

const createDeckMapping = (faction: EFaction) => {
  const map = {
    [EFaction.COUNCIL]: {
      tank: EHeroes.KNIGHT,
      dps: EHeroes.ARCHER,
      mage: EHeroes.WIZARD,
      support: EHeroes.CLERIC,
      super: EHeroes.NINJA,

      magicItem: EItems.SHINING_HELM,
      factionEquipment: EItems.DRAGON_SCALE,
      runeMetal: EItems.RUNE_METAL,
      potion: EItems.HEALING_POTION,
      spell: EItems.INFERNO,
      superCharge: EItems.SUPERCHARGE
    },
    [EFaction.DARK_ELVES]: {
      tank: EHeroes.VOIDMONK,
      dps: EHeroes.IMPALER,
      mage: EHeroes.NECROMANCER,
      support: EHeroes.PRIESTESS,
      super: EHeroes.WRAITH,

      magicItem: EItems.SHINING_HELM,
      factionEquipment: EItems.SOUL_STONE,
      runeMetal: EItems.RUNE_METAL,
      potion: EItems.MANA_VIAL,
      spell: EItems.SOUL_HARVEST,
      superCharge: EItems.SUPERCHARGE

    },
    [EFaction.DWARVES]: {
      tank: EHeroes.PALADIN,
      dps: EHeroes.GUNNER,
      mage: EHeroes.GRENADIER,
      support: EHeroes.ENGINEER,
      super: EHeroes.ANNIHILATOR,

      magicItem: EItems.SHINING_HELM,
      factionEquipment: EItems.DRAGON_SCALE,
      runeMetal: EItems.RUNE_METAL,
      potion: EItems.DWARVEN_BREW,
      spell: EItems.PULVERIZER,
      superCharge: EItems.SUPERCHARGE
    }
  };

  return map[faction];
};

// Fisher-Yates shuffle algorithm
export function shuffleArray(array: { unitId: string }[]): { unitId: string }[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

export function shuffleDeck(unitsDeck: { unitId: string }[], itemsDeck: { unitId: string }[]) {
  const shuffledUnits = shuffleArray(unitsDeck);

  const startingUnits: { unitId: string }[] = shuffledUnits.splice(0, 3);
  const shuffledDeck = shuffleArray([...shuffledUnits, ...itemsDeck]);

  return [...startingUnits, ...shuffledDeck];
}

export const factionWinKey = {
  [EFaction.COUNCIL]: { 'stats.factions.council.wins': 1 },
  [EFaction.DARK_ELVES]: { 'stats.factions.elves.wins': 1 },
  [EFaction.DWARVES]: { 'stats.factions.dwarves.wins': 1 }
};

export function mapFactionsEnumToLowerCase(faction: EFaction): string {
  const factionMap = {
    [EFaction.COUNCIL]: 'council',
    [EFaction.DARK_ELVES]: 'elves',
    [EFaction.DWARVES]: 'dwarves'
  };

  return factionMap[faction];
}

export function getProfilePaginationSortOrder(boardType: ELeaderboardEnum) {
  const sortTypeMap = {
    [ELeaderboardEnum.MAIN]: {
      'stats.totalWins': -1,
      'stats.totalGames': -1,
      _id: 1
    },
    [ELeaderboardEnum.COUNCIL]: {
      'stats.factions.council.rating': -1,
      'stats.factions.council.games': -1,
      _id: 1
    },
    [ELeaderboardEnum.ELVES]: {
      'stats.factions.elves.rating': -1,
      'stats.factions.elves.games': -1,
      _id: 1
    },
    [ELeaderboardEnum.DWARVES]: {
      'stats.factions.dwarves.rating': -1,
      'stats.factions.dwarves.games': -1,
      _id: 1
    }
  };

  return (sortTypeMap[boardType] ?? { _id: 1 }) as { [key: string]: SortOrder };
}

// TODO: any
export async function updateUserStats(userWon: any, userLost: any, winnerData: IUser, loserData: IUser, winCondition: EWinConditions): Promise<{
  updatedWinner: IUser,
  updatedLoser: IUser
}> {
  const { winnerNewElo, loserNewElo } = updateELORatings(winnerData!, userWon.faction!, loserData!, userLost.faction!);

  console.log('winnerNewElo', winnerNewElo);

  const addWinnerNewRating = { [ `stats.factions.${userWon.faction}.rating`]: winnerNewElo.rating };
  const addwinnerFactionTotalGames = { [`stats.factions.${userWon.faction}.games`]: 1 };
  const addwinnerFactionTotalWins = { [`stats.factions.${userWon.faction}.wins`]: 1 };
  const addWinnerFactionGame = { [`stats.factions.${userWon.faction!}.opponentFactions.${userLost.faction!}.games`]: 1 };
  const addWinnerFactionVictory = { [`stats.factions.${userWon.faction!}.opponentFactions.${userLost.faction!}.totalWins`]: 1 };
  const addWinnerFactionVictoryType = { [`stats.factions.${userWon.faction!}.opponentFactions.${userLost.faction!}.wins.${winCondition}`]: 1 };
  const updatedWinner = await User.findByIdAndUpdate(
    userWon.userData._id,
    {
      $set: { ...addWinnerNewRating },
      $inc: {
        'stats.totalGames': 1,
        'stats.totalWins': 1,
        ...addwinnerFactionTotalGames,
        ...addwinnerFactionTotalWins,
        ...addWinnerFactionGame,
        ...addWinnerFactionVictory,
        ...addWinnerFactionVictoryType
      }
    },
    { runValidators: true }
  );

  console.log('query', {
    $set: { ...addWinnerNewRating },
    $inc: {
      'stats.totalGames': 1,
      'stats.totalWins': 1,
      ...addwinnerFactionTotalGames,
      ...addwinnerFactionTotalWins,
      ...addWinnerFactionGame,
      ...addWinnerFactionVictory,
      ...addWinnerFactionVictoryType
    }
  });

  const addLoserNewRating = { [ `stats.factions.${userLost.faction}.rating`]: loserNewElo.rating };
  const addLoserFactionTotalGames = { [`stats.factions.${userLost.faction}.games`]: 1 };
  const addLoserFactionTotalLoses = { [`stats.factions.${userLost.faction}.loses`]: 1 };
  const addLoserFactionGame = { [`stats.factions.${userLost.faction!}.opponentFactions.${userWon.faction!}.games`]: 1 };
  const addLoserFactionLossType = { [`stats.factions.${userLost.faction!}.opponentFactions.${userWon.faction!}.loses.${winCondition}`]: 1 };
  const addLoserFactionLoss = { [`stats.factions.${userLost.faction!}.opponentFactions.${userWon.faction!}.totalLoses`]: 1 };
  const updatedLoser = await User.findByIdAndUpdate(
    userLost.userData._id,
    {
      $set: { ...addLoserNewRating },
      $inc: {
        'stats.totalGames': 1,
        'stats.totalLoses': 1,
        ...addLoserFactionTotalGames,
        ...addLoserFactionTotalLoses,
        ...addLoserFactionGame,
        ...addLoserFactionLoss,
        ...addLoserFactionLossType
      }
    }, { runValidators: true }
  );

  console.log('loser query', {
    $set: { ...addLoserNewRating },
    $inc: {
      'stats.totalGames': 1,
      'stats.totalLoses': 1,
      ...addLoserFactionTotalGames,
      ...addLoserFactionTotalLoses,
      ...addLoserFactionGame,
      ...addLoserFactionLoss,
      ...addLoserFactionLossType
    }
  });

  if (!updatedWinner || !updatedLoser) throw new CustomError(24);
  return {
    updatedWinner,
    updatedLoser
  };
};
