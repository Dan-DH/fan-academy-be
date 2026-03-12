import { EFaction, EItems, EClass, EHeroes, EAttackType } from "../../enums/game.enums";
import { IFaction, IHero, IItem } from "../../interfaces/gameInterface";
import { shuffleDeck } from "../../utils/gameUtils";
import { createItemData } from "../itemData";

export function createDwarvesFactionData(userId: string): IFaction {
  const unitsInDeck = createDwarvesDeck(userId);
  const unitsInHand =  unitsInDeck.splice(0, 6);
  const factionName = EFaction.DWARVES;

  return {
    userId,
    factionName,
    unitsInDeck,
    unitsInHand
  };
}

function createDwarvesDeck(userId: string): (IHero | IItem)[] {
  const unitsDeck = [];
  const itemsDeck = [];

  for (let index = 0; index < 3; index++) {
    const paladin = createDwarvesPaladinData( { unitId: `${userId}_paladin_${index}` });
    const gunner = createDwarvesGunnerData( { unitId: `${userId}_gunner_${index}` });
    const grenadier = createDwarvesGrenadierData( { unitId: `${userId}_grenadier_${index}` });
    const engineer = createDwarvesEngineerData( { unitId: `${userId}_engineer_${index}` });

    const shiningHelm = createItemData( {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_shiningHelm_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.SHINING_HELM
    });

    const runeMetal = createItemData( {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_runeMetal_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.RUNE_METAL
    });

    const factionEquipment = createItemData( {
      unitId: `${userId}_dragonScale_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.DRAGON_SCALE
    });

    unitsDeck.push(paladin, gunner, grenadier, engineer);
    itemsDeck.push(shiningHelm, runeMetal, factionEquipment);
  }

  for (let index = 0; index < 2; index++) {
    // Heals 1000 hp. Can revive at 1/2 power
    const dwarvenBrew = createItemData( {
      unitId: `${userId}_dwarvenBrew_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.DWARVEN_BREW,
      canHeal: true
    });
    const pulverizer = createItemData( {
    /**
     * Hits one enemy unit or crystal for  600 physical damage. If the target is a crystal, AoE for 33% of the damage, including any added damage from Assault tiles (the 200 physical AoE is reduced by the target’s physical resist, but added splash from Assault tile damage is not). Splash occurs even if the crystal was shielded. If the target is a unit, its Armor, Soulstone, or Spike Armor (but not Helm) is destroyed.
     */
      unitId: `${userId}_pulverizer_${index}`,
      faction: EFaction.DWARVES,
      dealsDamage: true,
      itemType: EItems.PULVERIZER
    });
    const superCharge = createItemData( {
      // Triples the attack power of the next attack for the chosen unit
      unitId: `${userId}_superCharge_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.SUPERCHARGE
    });

    itemsDeck.push(dwarvenBrew, pulverizer, superCharge);
  }

  // Unique unit
  const annihilator = createDwarvesAnnihilatorData( { unitId: `${userId}_annihilator` });
  unitsDeck.push(annihilator);

  const shuffledDeck = shuffleDeck(unitsDeck, itemsDeck);

  return shuffledDeck;
}

/**
 *
 * HERO DATA
 *
 */

function createGenericDwarvesData(data: Partial<IHero>): {
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
  dwarvenBrew: boolean,
  engineerShield?: string,
  shieldingAlly?: string,
  annihilatorDebuff: boolean,
  manaVial: boolean
} {
  return {
    class: EClass.HERO,
    faction: EFaction.DWARVES,
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
    dwarvenBrew: data.dwarvenBrew ?? false,
    engineerShield: data.engineerShield ?? undefined,
    shieldingAlly: data.shieldingAlly ?? undefined,
    annihilatorDebuff: data.annihilatorDebuff ?? false,
    manaVial: data.manaVial ?? false
  };
}

export function createDwarvesPaladinData(data: Partial<IHero>): IHero {
  // revives for 50% of attack power
  // All friendly units/crystals in AoE range of Paladin gain 5% attack power, physical resist, and magical resist. Stacks from multiple Paladins.
  const baseHealth = 900;
  const basePower = 200;
  const physicalDamageResistance = 10;
  const magicalDamageResistance = 10;

  return {
    unitType: EHeroes.PALADIN,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 1,
    healingRange: 2,
    buffRange: 0,
    attackType: EAttackType.PHYSICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: true,
    canBuff: false,
    ...createGenericDwarvesData(data)
  };
}

export function createDwarvesGrenadierData(data: Partial<IHero>): IHero {
  // ignores LoS
  const baseHealth = 800;
  const basePower = 200;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.GRENADIER,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 3,
    healingRange: 0,
    buffRange: 0,
    attackType: EAttackType.MAGICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    canBuff: false,
    ...createGenericDwarvesData(data)
  };
}

export function createDwarvesGunnerData(data: Partial<IHero>): IHero {
  const baseHealth = 800;
  const basePower = 300;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.GUNNER,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 2,
    healingRange: 0,
    buffRange: 0,
    attackType: EAttackType.PHYSICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    canBuff: false,
    ...createGenericDwarvesData(data)
  };
}

export function createDwarvesEngineerData(data: Partial<IHero>): IHero {
  const baseHealth = 800;
  const basePower = 200;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.ENGINEER,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 1,
    healingRange: 0,
    buffRange: 3,
    attackType: EAttackType.PHYSICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    canBuff: true,
    ...createGenericDwarvesData(data)
  };
}

export function createDwarvesAnnihilatorData(data: Partial<IHero>): IHero {
  // AoE with knock-back for 20% of attack damage
  // main target gets a -50% to physical damage reduction on the next attacks that hits it
  const baseHealth = 650;
  const basePower = 300;
  const physicalDamageResistance = 0;
  const magicalDamageResistance = 0;

  return {
    unitType: EHeroes.ANNIHILATOR,
    baseHealth: data.baseHealth ?? baseHealth,
    maxHealth: data.maxHealth ?? baseHealth,
    currentHealth: data.currentHealth ?? baseHealth,
    movement: 2,
    attackRange: 3,
    healingRange: 0,
    buffRange: 0,
    attackType: EAttackType.MAGICAL,
    basePower,
    basePhysicalDamageResistance: physicalDamageResistance,
    baseMagicalDamageResistance: magicalDamageResistance,
    physicalDamageResistance: data.physicalDamageResistance ?? physicalDamageResistance,
    magicalDamageResistance: data.magicalDamageResistance ?? magicalDamageResistance,
    canHeal: false,
    canBuff: false,
    ...createGenericDwarvesData(data)
  };
}
