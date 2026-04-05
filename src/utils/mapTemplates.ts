import { ETiles } from "../enums/game.enums";

// TODO: move to FE
/**
  * 2 medium crystals
  * 2 attack tiles
  * 2 physical resistance tiles
  * 1 assault tile
  */
const map1 = [
  {
    row: 0,
    col: 2,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 0,
    col: 6,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 4,
    col: 6,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 4,
    col: 2,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 1,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 3,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 3,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 1,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 1,
    col: 2,
    tileType: ETiles.POWER
  },
  {
    row: 3,
    col: 6,
    tileType: ETiles.POWER
  },
  {
    row: 2,
    col: 1,
    tileType: ETiles.PHYSICAL_RESISTANCE
  },
  {
    row: 2,
    col: 7,
    tileType: ETiles.PHYSICAL_RESISTANCE
  },
  {
    row: 2,
    col: 4,
    tileType: ETiles.CRYSTAL_DAMAGE
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
    row: 1,
    col: 2,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 1,
    col: 6,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 3,
    col: 7,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 3,
    col: 1,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 0,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 0,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 2,
    col: 2,
    tileType: ETiles.POWER
  },
  {
    row: 2,
    col: 6,
    tileType: ETiles.POWER
  },
  {
    row: 0,
    col: 4,
    tileType: ETiles.MAGICAL_RESISTANCE
  },
  {
    row: 4,
    col: 4,
    tileType: ETiles.CRYSTAL_DAMAGE
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
    row: 0,
    col: 3,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 2,
    col: 0,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 2,
    col: 8,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 4,
    col: 5,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 1,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 3,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 3,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 1,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 2,
    col: 4,
    tileType: ETiles.POWER
  },
  {
    row: 0,
    col: 6,
    tileType: ETiles.TELEPORTER
  },
  {
    row: 4,
    col: 2,
    tileType: ETiles.TELEPORTER
  },
  {
    row: 3,
    col: 2,
    tileType: ETiles.CRYSTAL_DAMAGE
  },
  {
    row: 1,
    col: 6,
    tileType: ETiles.CRYSTAL_DAMAGE
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
    row: 2,
    col: 2,
    tileType: ETiles.CRYSTAL_BIG
  },
  {
    row: 2,
    col: 6,
    tileType: ETiles.CRYSTAL_BIG
  },
  {
    row: 0,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 0,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 1,
    col: 2,
    tileType: ETiles.POWER
  },
  {
    row: 3,
    col: 6,
    tileType: ETiles.POWER
  },
  {
    row: 1,
    col: 6,
    tileType: ETiles.PHYSICAL_RESISTANCE
  },
  {
    row: 3,
    col: 2,
    tileType: ETiles.PHYSICAL_RESISTANCE
  },
  {
    row: 0,
    col: 4,
    tileType: ETiles.CRYSTAL_DAMAGE
  },
  {
    row: 4,
    col: 4,
    tileType: ETiles.CRYSTAL_DAMAGE
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
    row: 0,
    col: 1,
    tileType: ETiles.CRYSTAL_SMALL
  },
  {
    row: 2,
    col: 2,
    tileType: ETiles.CRYSTAL_SMALL
  },
  {
    row: 4,
    col: 1,
    tileType: ETiles.CRYSTAL_SMALL
  },
  {
    row: 0,
    col: 7,
    tileType: ETiles.CRYSTAL_SMALL
  },
  {
    row: 2,
    col: 6,
    tileType: ETiles.CRYSTAL_SMALL
  },
  {
    row: 4,
    col: 7,
    tileType: ETiles.CRYSTAL_SMALL
  },
  {
    row: 1,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 3,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 3,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 1,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 2,
    col: 1,
    tileType: ETiles.POWER
  },
  {
    row: 2,
    col: 7,
    tileType: ETiles.POWER
  },
  {
    row: 0,
    col: 5,
    tileType: ETiles.MAGICAL_RESISTANCE
  },
  {
    row: 4,
    col: 3,
    tileType: ETiles.MAGICAL_RESISTANCE
  },
  {
    row: 0,
    col: 3,
    tileType: ETiles.CRYSTAL_DAMAGE
  },
  {
    row: 4,
    col: 5,
    tileType: ETiles.CRYSTAL_DAMAGE
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
    row: 2,
    col: 1,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 1,
    col: 3,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 2,
    col: 7,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 3,
    col: 5,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 0,
    col: 2,
    tileType: ETiles.SPAWN
  },
  {
    row: 2,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 2,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 6,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 2,
    tileType: ETiles.CRYSTAL_DAMAGE
  },
  {
    row: 0,
    col: 6,
    tileType: ETiles.CRYSTAL_DAMAGE
  },
  {
    row: 2,
    col: 4,
    tileType: ETiles.POWER
  },
  {
    row: 3,
    col: 7,
    tileType: ETiles.SPEED
  },
  {
    row: 1,
    col: 1,
    tileType: ETiles.SPEED
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
    row: 0,
    col: 2,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 3,
    col: 0,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 0,
    col: 6,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 3,
    col: 8,
    tileType: ETiles.CRYSTAL
  },
  {
    row: 1,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 0,
    tileType: ETiles.SPAWN
  },
  {
    row: 1,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 4,
    col: 8,
    tileType: ETiles.SPAWN
  },
  {
    row: 1,
    col: 4,
    tileType: ETiles.POWER
  },
  {
    row: 4,
    col: 4,
    tileType: ETiles.SPEED
  },
  {
    row: 2,
    col: 2,
    tileType: ETiles.CRYSTAL_DAMAGE
  },
  {
    row: 2,
    col: 6,
    tileType: ETiles.CRYSTAL_DAMAGE
  }
];

// console.log([map1, map2, map3, map4, map5, map6, map7]);
export const mapTemplates: {
  row: number,
  col: number,
  tileType: ETiles,
  crystalType?: number
}[][] = [map1, map2, map3, map4, map5, map6, map7];
