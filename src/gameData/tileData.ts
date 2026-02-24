import { ETiles } from "../enums/game.enums";
import { ITile } from "../interfaces/gameInterface";

export function createTileData(data: ITile): ITile {
  const tileType = ETiles.BASIC;
  const obstacle = false;
  const hero = undefined;
  const crystal = undefined;

  return {
    row: data.row,
    col: data.col,
    x: data.x,
    y: data.y,
    boardPosition: data.boardPosition,
    tileType: data.tileType ?? tileType,
    obstacle: data.obstacle ?? obstacle,
    hero: data.hero ?? hero,
    crystal: data.crystal ?? crystal
  };
}