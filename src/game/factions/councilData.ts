import { EFaction, EItems, EClass, EBoardUnit, EHeroes } from "../../enums/game.enums";
import { IFaction, IHero, IItem } from "../../interfaces/gameInterface";
import { shuffleDeck } from "../../utils/gameUtils";

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

function createCouncilDeck(userId: string): (Partial<IHero> | IItem)[] {
  const unitsDeck = [];
  const itemsDeck = [];

  const genericData = {
    class: EClass.HERO,
    faction: EFaction.COUNCIL,
    status: 0,
    boardType: EBoardUnit.HERO
  };

  for (let index = 0; index < 3; index++) {
    const archer = {
      unitId: `${userId}_archer_${index}`,
      unitType: EHeroes.ARCHER,
      ...genericData
    };
    const knight =  {
      unitId: `${userId}_knight_${index}`,
      unitType: EHeroes.KNIGHT,
      ...genericData

    };
    const wizard =  {
      unitId: `${userId}_wizard_${index}`,
      unitType: EHeroes.WIZARD,
      ...genericData

    };
    const cleric =  {
      unitId: `${userId}_cleric_${index}`,
      unitType: EHeroes.CLERIC,
      ...genericData

    };

    const shiningHelm = {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_shiningHelm_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.SHINING_HELM,
      class: EClass.ITEM
    };

    const runeMetal = {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_runeMetal_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.RUNE_METAL,
      class: EClass.ITEM
    };

    const factionEquipment = {
      unitId: `${userId}_dragonScale_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.DRAGON_SCALE,
      class: EClass.ITEM
    };

    unitsDeck.push(archer, knight, wizard, cleric);
    itemsDeck.push(shiningHelm, runeMetal, factionEquipment);
  }

  for (let index = 0; index < 2; index++) {
    // Heals 1000 hp. Can revive at 1/2 power
    const healingPotion =  {
      unitId: `${userId}_healingPotion_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.HEALING_POTION,
      class: EClass.ITEM
    };
    const inferno =  {
      //  High-damage attack spell that does 350 magical damage in a 3x3 area.
      // Can remove knocked-out enemies from the field.
      unitId: `${userId}_inferno_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.INFERNO,
      class: EClass.ITEM
    };
    const superCharge =  {
      // Triples the attack power of the next attack for the chosen unit
      unitId: `${userId}_superCharge_${index}`,
      faction: EFaction.COUNCIL,
      itemType: EItems.SUPERCHARGE,
      class: EClass.ITEM
    };

    itemsDeck.push(healingPotion, inferno, superCharge);
  }

  // Unique unit
  unitsDeck.push({
    unitId: `${userId}_ninja`,
    class: EClass.HERO,
    faction: EFaction.COUNCIL,
    unitType: EHeroes.NINJA
  });

  const shuffledDeck = shuffleDeck(unitsDeck, itemsDeck);

  return shuffledDeck;
}