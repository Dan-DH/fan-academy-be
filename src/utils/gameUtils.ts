import { SortOrder } from "mongoose";
import { EFaction, EGameStatus, ETiles, EWinConditions } from "../enums/game.enums";
import { ELeaderboardEnum } from "../enums/leaderboard.enums";
import { createCouncilFactionData } from "../game/factions/councilData";
import { createDwarvesFactionData } from "../game/factions/dwarvesData";
import { createElvesFactionData } from "../game/factions/elvesData";
import { createTileData } from "../game/tileData";
import Game from "../models/gameModel";

import { ICoordinates, IFaction, IHero, IItem, IPlayerData, IPopulatedPlayerData, ITile, ITurnMessage } from "../interfaces/gameInterface";
import { mapTemplates } from "./mapTemplates";
import { CustomError } from "../classes/customError";
import { EmailService } from "../emails/emailService";
import { DiscordNotificationService } from "../services/discordNotificationService";
import IUser from "../interfaces/userInterface";
import { updateELORatings } from "../game/elo";
import User from "../models/userModel";

/**
 * Creates a starting state for a given faction, randomizing the assets in deck and dealing a starting hand
 */
export function createNewGameFactionState(userId: string, playerFaction: EFaction): IFaction {
  const faction: Record<string, IFaction> = {
    [EFaction.COUNCIL]: createCouncilFactionData(userId),
    [EFaction.DARK_ELVES]: createElvesFactionData(userId),
    [EFaction.DWARVES]: createDwarvesFactionData(userId)
  };

  return faction[playerFaction];
}

// Fisher-Yates shuffle algorithm
export function shuffleArray(array: (IHero | IItem)[]): (IHero | IItem)[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

/**
 *
 * Create map
 *
 */
/**
 * Creates a new map randomly choosing from a series of templates
 */
export function createNewGameBoardState(): ITile[] {
  const randomIndexNumber = Math.floor(Math.random() * mapTemplates.length);
  const mapData = mapTemplates[randomIndexNumber];
  const newBoard: ITile[] = [];
  const centerPoints = calculateAllCenterPoints();

  const crystalsTypeArray = [ETiles.CRYSTAL_SMALL, ETiles.CRYSTAL, ETiles.CRYSTAL_BIG];

  for (const tileData of mapData) {
    const { row, col, tileType } = tileData;
    const boardPosition = getBoardPositionFromCoordinates(col, row);
    const { x, y } = centerPoints[boardPosition];

    let crystalData;
    const isCrystalTile = tileType && crystalsTypeArray.includes(tileType);

    if (isCrystalTile) {
      const crystalHp = getCrystalHp(tileType);

      crystalData = {
        unitId: `crystal_${boardPosition}`,
        belongsTo: col! > 4 ? 2 : 1,
        maxHealth: crystalHp,
        currentHealth: crystalHp,
        isDestroyed: false,
        isLastCrystal: tileType === ETiles.CRYSTAL_BIG ? true : false,
        boardPosition,
        row,
        col,
        debuffLevel: 0,
        paladinAura: 0,
        annihilatorDebuff: false,
        physicalDamageResistance: 0,
        magicalDamageResistance: 0,
        basePhysicalDamageResistance: 0,
        baseMagicalDamageResistance: 0
      };
    }

    const tile = createTileData({
      row,
      col,
      x,
      y,
      boardPosition,
      tileType,
      obstacle: isCrystalTile ? true : false,
      ...isCrystalTile ? { crystal: crystalData } : {}
    });
    newBoard.push(tile);
  }

  return newBoard;
}

export function getCrystalHp(tileType: ETiles) {
  let health;

  switch (tileType) {
    case ETiles.CRYSTAL_SMALL:
      health = 3000;
      break;
    case ETiles.CRYSTAL:
      health = 4500;
      break;
    case ETiles.CRYSTAL_BIG:
      health = 9000;
      break;
    default:
      health = 4500;
      break;
  }

  return health;
}

export function calculateAllCenterPoints(): ICoordinates[] {
  // Adding coordinates for the board tiles
  const centerPoints: ICoordinates[] = calculateBoardCenterPoints();

  // Adding coordinates for the items in the player's hand
  const leftMostItem = {
    x: 700,
    y: 745
  };

  for (let item = 0; item < 6; item++) {
    centerPoints.push({
      x: leftMostItem.x,
      y: leftMostItem.y
    });

    leftMostItem.x += 80;
  }

  // Adding coordinates for the deck (door)
  centerPoints.push({
    x: 435,
    y: 720
  });

  return centerPoints;
}

export function calculateBoardCenterPoints(): ICoordinates[] {
  const topLeft = {
    x: 545,
    y: 225,
    row: 0,
    col: 0
  };

  const result: ICoordinates[] = [];
  let boardPosition = 0;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const x = topLeft.x + col * 90;
      const y = topLeft.y + row * 90;

      result.push({
        x,
        y,
        row,
        col,
        boardPosition
      });

      boardPosition++;
    }
  }
  return result;
}

export function shuffleDeck(unitsDeck: IHero[], itemsDeck: IItem[]) {
  const shuffledUnits = shuffleArray(unitsDeck);

  const startingHeroes: (IHero | IItem)[] = shuffledUnits.splice(0, 3);
  const shuffledDeck = shuffleArray([...shuffledUnits, ...itemsDeck]);

  const mappedDeck = [...startingHeroes, ...shuffledDeck].map((elem, index) => {
    if (index < 6) {
      elem.boardPosition = 45 + index; // First 6 units get positions 45 to 50 on the board (the player's hand)
    } else {
      elem.boardPosition = 51; // Remaining units get 51 (deck, hidden)
    }
    return elem;
  });

  return mappedDeck;
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
      'stats.totalGames': 1,
      _id: 1
    },
    [ELeaderboardEnum.COUNCIL]: {
      'stats.factions.council.rating': -1,
      _id: 1
    },
    [ELeaderboardEnum.ELVES]: {
      'stats.factions.elves.rating': -1,
      _id: 1
    },
    [ELeaderboardEnum.DWARVES]: {
      'stats.factions.dwarves.rating': -1,
      _id: 1
    }
  };

  return (sortTypeMap[boardType] ?? { _id: 1 }) as { [key: string]: SortOrder };
}

function getBoardPositionFromCoordinates(col: number, row: number) {
  const WIDTH = 9;
  return row * WIDTH + col;
}

export async function handleGameOverUtil(message: ITurnMessage) {
  const finishedAt = new Date();
  const { winner, winCondition } = message.gameOver!;

  const updatedGame = await Game.findByIdAndUpdate(message._id, {
    previousTurn: message.currentTurn,
    turnNumber: message.turnNumber,
    activePlayer: message.newActivePlayer,
    gameOver: message.gameOver,
    status: EGameStatus.FINISHED,
    lastPlayedAt: finishedAt,
    finishedAt
  }, {
    new: true,
    runValidators: true
  }).populate('players.userData', "username picture email confirmedEmail");

  if (!updatedGame) throw new CustomError(24);

  // Retrieve user ids and publish the update to the users' game lists
  const userIds = updatedGame.players.map((player: IPlayerData) => player.userData._id.toString());

  // Update users stats
  const userWon = updatedGame.players.find(player => player.userData._id.toString() === winner) as unknown as IPopulatedPlayerData;
  const userLost = updatedGame.players.find(player => player.userData._id.toString() !== winner) as unknown as IPopulatedPlayerData;
  if (!userWon || !userLost) throw new CustomError(24);
  const { updatedWinner, updatedLoser } = await updateUserStats(userWon, userLost, winCondition);

  const emails = [];
  if (updatedWinner?.preferences.emailNotifications) emails.push(updatedWinner.email);
  if (updatedLoser?.preferences.emailNotifications) emails.push(updatedLoser.email);

  // Send gameover emails
  if (emails.length) {
    await EmailService.sendGameOverEmail({
      winner: userWon,
      loser: userLost,
      emails
    }, winCondition);
  }

  try {
    if (userWon?.userData?.username) await DiscordNotificationService.sendGameFinished(userWon.userData.username);
    if (userLost?.userData?.username) await DiscordNotificationService.sendGameFinished(userLost.userData.username);
  } catch (err) {
    console.error('Failed to send Discord game finished notification:', err);
  }

  return {
    gameId: message._id,
    previousTurn: message.currentTurn,
    userIds,
    turnNumber: message.turnNumber,
    lastPlayedAt: finishedAt,
    gameOver: message.gameOver
  };
}

export async function updateUserStats(userWon: IPopulatedPlayerData, userLost: IPopulatedPlayerData, winCondition: EWinConditions): Promise<{
  updatedWinner: IUser,
  updatedLoser: IUser
}> {
  const winnerData = await User.findById(userWon.userData._id);
  const loserData = await User.findById(userLost.userData._id);

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
