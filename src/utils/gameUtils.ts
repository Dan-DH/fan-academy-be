import { EFaction, ETiles } from "../enums/game.enums";
import { createCouncilFactionData } from "../gameData/factions/councilData";
import { createElvesFactionData } from "../gameData/factions/elvesData";
import { createDwarvesFactionData } from "../gameData/factions/dwarvesData";
import { createTileData } from "../gameData/tileData";
import { ICoordinates, IFaction, IHero, IItem, ITile } from "../interfaces/gameInterface";
import { mapTemplates } from "./mapTemplates";

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

  let boardPosition = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const { x, y } = centerPoints[boardPosition];
      const specialTile = mapData.find((tile) => tile.col === col && tile.row === row);

      let crystalData;
      const isCrystalTile = specialTile?.tileType && crystalsTypeArray.includes(specialTile.tileType);

      if (isCrystalTile) {
        const crystalHp = getCrystalHp(specialTile.tileType);

        crystalData = {
          belongsTo: col > 4 ? 2 : 1,
          maxHealth: crystalHp,
          currentHealth: crystalHp,
          isDestroyed: false,
          isLastCrystal: specialTile.tileType === ETiles.CRYSTAL_BIG ? true : false,
          boardPosition,
          row,
          col,
          debuffLevel: 0
        };
      }

      const tile = createTileData({
        row,
        col,
        x,
        y,
        boardPosition,
        tileType: specialTile ? specialTile.tileType : ETiles.BASIC,
        obstacle: isCrystalTile ? true : false,
        ...isCrystalTile ? { crystal: crystalData } : {}
      });
      newBoard.push(tile);
      boardPosition++;
    }}

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

export const factionWinsKey = {
  [EFaction.COUNCIL]: { 'stats.councilWins': 1 },
  [EFaction.DARK_ELVES]: { 'stats.elveslWins': 1 },
  [EFaction.DWARVES]: { 'stats.dwarvesWins': 1 }
};
