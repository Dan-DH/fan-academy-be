import { ETiles } from "../enums/game.enums";

const map1 = [
  {
    row: 0,
    col: 2,
    tileType: ETiles.CRYSTAL,
    boardPosition: 2
  },
  {
    row: 0,
    col: 6,
    tileType: ETiles.CRYSTAL,
    boardPosition: 6
  },
  {
    row: 4,
    col: 6,
    tileType: ETiles.CRYSTAL,
    boardPosition: 42
  },
  {
    row: 4,
    col: 2,
    tileType: ETiles.CRYSTAL,
    boardPosition: 38
  }
];

const map2 = [
  {
    row: 1,
    col: 2,
    tileType: ETiles.CRYSTAL,
    boardPosition: 11
  },
  {
    row: 1,
    col: 6,
    tileType: ETiles.CRYSTAL,
    boardPosition: 15
  },
  {
    row: 3,
    col: 7,
    tileType: ETiles.CRYSTAL,
    boardPosition: 34
  },
  {
    row: 3,
    col: 1,
    tileType: ETiles.CRYSTAL,
    boardPosition: 28
  }
];

const map3 = [
  {
    row: 0,
    col: 3,
    tileType: ETiles.CRYSTAL,
    boardPosition: 3
  },
  {
    row: 2,
    col: 0,
    tileType: ETiles.CRYSTAL,
    boardPosition: 18
  },
  {
    row: 2,
    col: 8,
    tileType: ETiles.CRYSTAL,
    boardPosition: 26
  },
  {
    row: 4,
    col: 5,
    tileType: ETiles.CRYSTAL,
    boardPosition: 41
  }
];

const map4 = [
  {
    row: 2,
    col: 2,
    tileType: ETiles.CRYSTAL_BIG,
    boardPosition: 20
  },
  {
    row: 2,
    col: 6,
    tileType: ETiles.CRYSTAL_BIG,
    boardPosition: 24
  }
];

const map5 = [
  {
    row: 0,
    col: 1,
    tileType: ETiles.CRYSTAL_SMALL,
    boardPosition: 1
  },
  {
    row: 2,
    col: 2,
    tileType: ETiles.CRYSTAL_SMALL,
    boardPosition: 20
  },
  {
    row: 4,
    col: 1,
    tileType: ETiles.CRYSTAL_SMALL,
    boardPosition: 37
  },
  {
    row: 0,
    col: 7,
    tileType: ETiles.CRYSTAL_SMALL,
    boardPosition: 7
  },
  {
    row: 2,
    col: 6,
    tileType: ETiles.CRYSTAL_SMALL,
    boardPosition: 24
  },
  {
    row: 4,
    col: 7,
    tileType: ETiles.CRYSTAL_SMALL,
    boardPosition: 43
  }
];

// kitty-corner map:
const map6 = [
  {
    row: 2,
    col: 1,
    tileType: ETiles.CRYSTAL,
    boardPosition: 19
  },
  {
    row: 1,
    col: 3,
    tileType: ETiles.CRYSTAL,
    boardPosition: 12
  },
  {
    row: 2,
    col: 7,
    tileType: ETiles.CRYSTAL,
    boardPosition: 25
  },
  {
    row: 3,
    col: 5,
    tileType: ETiles.CRYSTAL,
    boardPosition: 32
  }
];

// Shaolin
const map7 = [
  {
    row: 0,
    col: 2,
    tileType: ETiles.CRYSTAL,
    boardPosition: 2
  },
  {
    row: 3,
    col: 0,
    tileType: ETiles.CRYSTAL,
    boardPosition: 27
  },
  {
    row: 0,
    col: 6,
    tileType: ETiles.CRYSTAL,
    boardPosition: 6
  },
  {
    row: 3,
    col: 8,
    tileType: ETiles.CRYSTAL,
    boardPosition: 35
  }
];

// console.log([map1, map2, map3, map4, map5, map6, map7]);
export const mapTemplates: {
  row: number,
  col: number,
  tileType: ETiles,
  boardPosition: number
}[][] = [map1, map2, map3, map4, map5, map6, map7];