import { EFaction, EItems, EClass, EHeroes, EAttackType } from "../../enums/game.enums";
import { IFaction, IHero, IItem } from "../../interfaces/gameInterface";
import { shuffleDeck } from "../../utils/gameUtils";
import { createItemData } from "../itemData";

export function createCouncilFactionData(userId: string): IFaction {
  const unitsInDeck = createCouncilDeck(userId);
  const unitsInHand =  unitsInDeck.splice(0, 6);
  const factionName = EFaction.COUNCIL;

  return {
    userId,
    factionName,
    unitsInDeck,
    unitsInHand
  };
}

function createCouncilDeck(userId: string): (IHero | IItem)[] {
  const unitsDeck = [];
  const itemsDeck = [];

  for (let index = 0; index < 3; index++) {
    const archer = createCouncilArcherData( { unitId: `${userId}_archer_${index}` });
    const knight = createCouncilKnightData( { unitId: `${userId}_knight_${index}` });
    const wizard = createCouncilWizardData( { unitId: `${userId}_wizard_${index}` });
    const cleric = createCouncilClericData( { unitId: `${userId}_cleric_${index}` });

    const shiningHelm = createItemData( {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_shiningHelm_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.SHINING_HELM
    });

    const runeMetal = createItemData( {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_runeMetal_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.RUNE_METAL
    });

    const factionEquipment = createItemData( {
      unitId: `${userId}_dragonScale_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.DRAGON_SCALE
    });

    unitsDeck.push(archer, knight, wizard, cleric);
    itemsDeck.push(shiningHelm, runeMetal, factionEquipment);
  }

  for (let index = 0; index < 2; index++) {
    // Heals 1000 hp. Can revive at 1/2 power
    const healingPotion = createItemData( {
      unitId: `${userId}_healingPotion_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.HEALING_POTION,
      canHeal: true
    });
    const inferno = createItemData( {
      //  High-damage attack spell that does 350 magical damage in a 3x3 area.
      // Can remove knocked-out enemies from the field.
      unitId: `${userId}_inferno_${index}`,
      faction: EFaction.COUNCIL,
      dealsDamage: true,
      itemType: EItems.INFERNO
    });
    const superCharge = createItemData( {
      // Triples the attack power of the next attack for the chosen unit
      unitId: `${userId}_superCharge_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.SUPERCHARGE
    });

    itemsDeck.push(healingPotion, inferno, superCharge);
  }

  // Unique unit
  const ninja = createCouncilNinjaData( { unitId: `${userId}_ninja` });
  unitsDeck.push(ninja);

  const shuffledDeck = shuffleDeck(unitsDeck, itemsDeck);

  return shuffledDeck;
}

/**
 *
 * HERO DATA
 *
 */

function createGenericCouncilData(data: Partial<IHero>): {
  class: EClass,
  faction: EFaction,
  unitId: string,
  boardPosition: number,
  isKO: boolean,
  factionEquipment: boolean,
  runeMetal: boolean,
  shiningHelm: boolean,
  superCharge: boolean,
  belongsTo: number,
  lastBreath: boolean,
  row: number,
  col: number,
  priestessDebuff: boolean,
  attackTile: boolean,
  magicalResistanceTile: boolean;
  physicalResistanceTile: boolean;
  speedTile: boolean,
  buffRange: number,
  canBuff: boolean,
  engineerShield: undefined,
  shieldingAlly: undefined,
  manaVial: boolean,
  annihilatorDebuff: boolean,
  dwarvenBrew: boolean,
  paladinAura: number
} {
  return {
    class: EClass.HERO,
    faction: EFaction.COUNCIL,
    unitId: data.unitId!,
    boardPosition: data.boardPosition ?? 51,
    isKO: data.isKO ?? false,
    lastBreath: data.lastBreath ?? false,
    factionEquipment: data.factionEquipment ?? false,
    runeMetal: data.runeMetal ?? false,
    shiningHelm: data.shiningHelm ?? false,
    superCharge: data.superCharge ?? false,
    belongsTo: data.belongsTo ?? 1,
    row: data.row ?? 0,
    col: data.col ?? 0,
    priestessDebuff: data.priestessDebuff ?? false,
    attackTile: data.attackTile ?? false,
    magicalResistanceTile: data.magicalResistanceTile ?? false,
    physicalResistanceTile: data.physicalResistanceTile ?? false,
    speedTile: data.speedTile ?? false,
    buffRange: 0,
    canBuff: false,
    engineerShield: undefined,
    shieldingAlly: undefined,
    manaVial: data.manaVial ?? false,
    annihilatorDebuff: data.annihilatorDebuff ?? false,
    dwarvenBrew: data.dwarvenBrew ?? false,
    paladinAura: data.paladinAura ?? 0
  };
}

export function createCouncilArcherData(data: Partial<IHero>): IHero {
  // Melee damage = 1/2 power
  const baseHealth = 800;
  const basePower = 300;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.ARCHER,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 3,
    healingRange: 0,
    attackType: EAttackType.PHYSICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    ...createGenericCouncilData(data)
  };
}

export function createCouncilWizardData(data: Partial<IHero>): IHero {
  const baseHealth = 800;
  const basePower = 200;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 10;

  return {
    unitType: EHeroes.WIZARD,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 2,
    healingRange: 0,
    attackType: EAttackType.MAGICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    ...createGenericCouncilData(data)
  };
}

export function createCouncilKnightData(data: Partial<IHero>): IHero {
  const baseHealth = 1000;
  const basePower = 200;
  const physicalDamageResistance = 20;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.KNIGHT,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 1,
    healingRange: 0,
    attackType: EAttackType.PHYSICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    ...createGenericCouncilData(data)
  };
}

export function createCouncilClericData(data: Partial<IHero>): IHero {
  // Heals for x3, revives for x2 power
  const baseHealth = 800;
  const basePower = 200;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.CLERIC,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 2,
    healingRange: 2,
    attackType: EAttackType.MAGICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: true,
    ...createGenericCouncilData(data)
  };
}

export function createCouncilNinjaData(data: Partial<IHero>): IHero {
  // Melee is x2 power
  // Can teleport
  const baseHealth = 800;
  const basePower = 200;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.NINJA,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 3,
    attackRange: 2,
    healingRange: 0,
    attackType: EAttackType.PHYSICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    ...createGenericCouncilData(data)
  };
}
