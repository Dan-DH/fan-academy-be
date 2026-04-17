import { ECrystalType } from "../enums/game.enums";

/**
  * 2 medium crystals
  * 2 attack tiles
  * 2 physical resistance tiles
  * 1 assault tile
  */
const map1 = [
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 2
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 6
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 42
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 38
  }
];

/**
  * 2 medium crystals
  * 2 attack tiles
  * 1 magical resistance tile
  * 1 assault tile
  */
const map2 = [
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 11
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 15
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 34
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 28
  }
];

/**
  * Dwarves map:
  * 2 medium crystals
  * 2 assault tiles
  * 1 attack tile
  * 2 teleporters
  */
const map3 = [
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 3
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 18
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 26
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 41
  }
];

/**
  * Single crystal map
  * 2 assault tiles
  * 2 attack tiles
  * 2 physical resistance tiles
  */
const map4 = [
  {
    crystalType: ECrystalType.CRYSTAL_BIG,
    boardPosition: 20
  },
  {
    crystalType: ECrystalType.CRYSTAL_BIG,
    boardPosition: 24
  }
];

/**
  * Tribe map:
  * 3 small crystals (not barbed)
  * 2 assault tiles
  * 2 magical resist tiles
  */
const map5 = [
  {
    crystalType: ECrystalType.CRYSTAL_SMALL,
    boardPosition: 1
  },
  {
    crystalType: ECrystalType.CRYSTAL_SMALL,
    boardPosition: 20
  },
  {
    crystalType: ECrystalType.CRYSTAL_SMALL,
    boardPosition: 37
  },
  {
    crystalType: ECrystalType.CRYSTAL_SMALL,
    boardPosition: 7
  },
  {
    crystalType: ECrystalType.CRYSTAL_SMALL,
    boardPosition: 24
  },
  {
    crystalType: ECrystalType.CRYSTAL_SMALL,
    boardPosition: 43
  }
];

/**
 * kitty-corner map:
 * 2 medium crystals
 * 2 assault tiles
 * 1 attack tile
 * 2 speed tiles
 */
const map6 = [
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 19
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 12
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 25
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 32
  }
];

/**
 * Shaolin map:
 * 2 medium crystals
 * 2 assault tiles
 * 1 attack tile
 * 1 speed tile
 */
const map7 = [
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 2
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 27
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 6
  },
  {
    crystalType: ECrystalType.CRYSTAL,
    boardPosition: 35
  }
];

// console.log([map1, map2, map3, map4, map5, map6, map7]);
export const mapTemplates: {
  crystalType: ECrystalType,
  boardPosition: number
}[][] = [map1, map2, map3, map4, map5, map6, map7];