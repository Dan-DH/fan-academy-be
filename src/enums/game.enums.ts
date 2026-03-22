export enum EAttackType {
  PHYSICAL = 'physical',
  MAGICAL = 'magical'
};

export enum EGameStatus {
  SEARCHING = 'searching',
  PLAYING = 'playing',
  FINISHED = 'finished',
  CHALLENGE = 'challenge'
};

export enum EGameTermination {
  CONCEDED = 'conceded',
  CANCELED = 'canceled'
}

export enum EWinConditions {
  CRYSTAL = 'Crystal victory',
  UNITS = 'Hero victory',
  TIME = 'Timeout',
  CONCEDED = 'Game conceded'
};

export enum EFaction {
  COUNCIL = 'Council',
  DARK_ELVES = 'Dark Elves',
  DWARVES = 'Dwarves'
}

export enum EActionType {
  MOVE = 'move',
  ATTACK = 'attack',
  HEAL = 'heal',
  BUFF = 'buff',
  SPAWN = 'spawn',
  SPAWN_PHANTOM = 'phantom',
  USE = 'use',
  SHUFFLE = 'shuffle',
  TELEPORT = 'teleport',

  // Automated actions
  DRAW = 'draw',
  PASS = 'pass',
  REMOVE_UNITS = 'removeUnits'
}

export enum EActionClass {
  USER = 'user',
  AUTO = 'automatic'
}

export enum EItems {
  // Generic
  SHINING_HELM = 'shiningHelm',
  RUNE_METAL = 'runeMetal',
  SUPERCHARGE = 'superCharge',

  // Council
  DRAGON_SCALE = 'dragonScale',
  HEALING_POTION = 'healingPotion',
  INFERNO = 'inferno',

  // Dark elves
  SOUL_STONE = 'soulStone',
  SOUL_HARVEST = 'soulHarvest',
  MANA_VIAL = 'manaVial',

  // Dwarves
  DWARVEN_BREW = 'dwarvenBrew',
  PULVERIZER = 'pulverizer'
}

export enum EClass {
  HERO = 'hero',
  ITEM = 'item'
}

export enum EHeroes {
  // Council
  ARCHER = 'archer',
  CLERIC = 'cleric',
  KNIGHT = 'knight',
  NINJA = 'ninja',
  WIZARD = 'wizard',

  // Dark Elves
  PRIESTESS = 'priestess',
  IMPALER = 'impaler',
  NECROMANCER = 'necromancer',
  PHANTOM = 'phantom',
  VOIDMONK = 'voidmonk',
  WRAITH = 'wraith',

  // Dwarves
  PALADIN = 'paladin',
  GUNNER = 'gunner',
  ENGINEER = 'engineer',
  GRENADIER = 'grenadier',
  ANNIHILATOR = 'annihilator'
}

export enum ETiles {
  BASIC = 'basic',
  POWER = 'powerTile',
  PHYSICAL_RESISTANCE = 'shieldTile',
  MAGICAL_RESISTANCE = 'helmetTile',
  CRYSTAL_DAMAGE = 'crystalDamageTile',
  TELEPORTER = 'teleporterTile',
  CRYSTAL = 'crystal',
  CRYSTAL_BIG = 'crystalBig',
  CRYSTAL_SMALL = 'crystalSmall',
  SPAWN = 'spawnTile',
  SPEED = 'speedTile'
}