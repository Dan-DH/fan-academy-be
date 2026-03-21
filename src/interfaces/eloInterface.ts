export interface IEloAdjustment {
  rating: number,
  change: number
}

export interface IEloPlayerData {
  gamesPlayed: number,
  rating: number
}

export type FactionKeys = 'council' | 'elves' | 'dwarves';