import { EFaction, EItems, EClass, EBoardUnit, EHeroes } from "../../enums/game.enums";
import { IHero, IItem } from "../../interfaces/gameInterface";
import { shuffleDeck } from "../../utils/gameUtils";

export function createDwarvesDeckAndHand(userId: string):  {
  deck: (Partial<IHero> | IItem)[],
  hand: (Partial<IHero> | IItem)[]
} {
  const deck = createDwarvesDeck(userId);
  const hand =  deck.splice(0, 6);

  return {
    deck,
    hand
  };
}

function createDwarvesDeck(userId: string): (Partial<IHero> | Partial<IItem>)[] {
  const unitsDeck = [];
  const itemsDeck = [];

  const genericData = {
    class: EClass.HERO,
    faction: EFaction.DWARVES,
    status: 0,
    boardType: EBoardUnit.HERO
  };

  for (let index = 0; index < 3; index++) {
    const paladin = {
      unitId: `${userId}_paladin_${index}`,
      unitType: EHeroes.PALADIN,
      ...genericData
    };
    const gunner =  {
      unitId: `${userId}_gunner_${index}`,
      unitType: EHeroes.GUNNER,
      ...genericData
    };
    const grenadier =  {
      unitId: `${userId}_grenadier_${index}`,
      unitType: EHeroes.GRENADIER,
      ...genericData
    };
    const engineer =  {
      unitId: `${userId}_engineer_${index}`,
      unitType: EHeroes.ENGINEER,
      ...genericData
    };

    const shiningHelm = {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_shiningHelm_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.SHINING_HELM,
      class: EClass.ITEM
    };

    const runeMetal = {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_runeMetal_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.RUNE_METAL,
      class: EClass.ITEM
    };

    const factionEquipment = {
      unitId: `${userId}_dragonScale_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.DRAGON_SCALE,
      class: EClass.ITEM
    };

    unitsDeck.push(paladin, gunner, grenadier, engineer);
    itemsDeck.push(shiningHelm, runeMetal, factionEquipment);
  }

  for (let index = 0; index < 2; index++) {
    // Heals 1000 hp. Can revive at 1/2 power
    const dwarvenBrew = {
      unitId: `${userId}_dwarvenBrew_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.DWARVEN_BREW,
      class: EClass.ITEM
    };
    const pulverizer = {
    /**
     * Hits one enemy unit or crystal for  600 physical damage. If the target is a crystal, AoE for 33% of the damage, including any added damage from Assault tiles (the 200 physical AoE is reduced by the target’s physical resist, but added splash from Assault tile damage is not). Splash occurs even if the crystal was shielded. If the target is a unit, its Armor, Soulstone, or Spike Armor (but not Helm) is destroyed.
     */
      unitId: `${userId}_pulverizer_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.PULVERIZER,
      class: EClass.ITEM
    };
    const superCharge = {
      // Triples the attack power of the next attack for the chosen unit
      unitId: `${userId}_superCharge_${index}`,
      faction: EFaction.DWARVES,
      itemType: EItems.SUPERCHARGE,
      class: EClass.ITEM
    };

    itemsDeck.push(dwarvenBrew, pulverizer, superCharge);
  }

  // Unique unit
  unitsDeck.push({
    unitId: `${userId}_annihilator`,
    class: EClass.HERO,
    faction: EFaction.DWARVES,
    unitType: EHeroes.ANNIHILATOR
  });

  const shuffledDeck = shuffleDeck(unitsDeck, itemsDeck);

  return shuffledDeck;
}
