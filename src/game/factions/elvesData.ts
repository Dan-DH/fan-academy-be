import { EFaction, EItems, EClass, EBoardUnit } from "../../enums/game.enums";
import { IFaction, IHero, IItem } from "../../interfaces/gameInterface";
import { shuffleDeck } from "../../utils/gameUtils";

export function createElvesFactionData(userId: string): IFaction {
  const unitsInDeck = createElvesDeck(userId);
  const unitsInHand =  unitsInDeck.splice(0, 6);
  const factionName = EFaction.DARK_ELVES;
  return {
    userId,
    factionName,
    unitsInDeck,
    unitsInHand
  };
}

function createElvesDeck(userId: string): (Partial<IHero> | IItem)[] {
  const unitsDeck = [];
  const itemsDeck = [];

  const genericData = {
    class: EClass.HERO,
    faction: EFaction.DARK_ELVES,
    status: 0,
    boardType: EBoardUnit.HERO

  };

  for (let index = 0; index < 3; index++) {
    const impaler = {
      unitId: `${userId}_impaler_${index}`,
      ...genericData
    };
    const voidMonk =  {
      unitId: `${userId}_voidMonk_${index}`,
      ...genericData
    };
    const necromancer =  {
      unitId: `${userId}_necromancer_${index}`,
      ...genericData
    };
    const priestess =  {
      unitId: `${userId}_priestess_${index}`,
      ...genericData
    };

    const shiningHelm = {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_shiningHelm_${index}`,
      faction: EFaction.DARK_ELVES,
      itemType: EItems.SHINING_HELM,
      class: EClass.ITEM
    };

    const runeMetal = {
      // Increases magical resistance by 20% and max health by 10%
      unitId: `${userId}_runeMetal_${index}`,
      faction: EFaction.DARK_ELVES,
      itemType: EItems.RUNE_METAL,
      class: EClass.ITEM
    };

    const factionEquipment = {
      unitId: `${userId}_soulStone_${index}`,
      faction: EFaction.DARK_ELVES,
      itemType: EItems.SOUL_STONE,
      class: EClass.ITEM
    };

    unitsDeck.push(impaler, voidMonk, necromancer, priestess);
    itemsDeck.push(shiningHelm, runeMetal, factionEquipment);
  }

  for (let index = 0; index < 2; index++) {
    const manaVial = {
      // Heals for 1000 hp and increases max HP by 50
      //  Does not revive
      unitId: `${userId}_manaVial_${index}`,
      faction: EFaction.DARK_ELVES,
      itemType: EItems.MANA_VIAL,
      class: EClass.ITEM
    };

    const soulHarvest = {
      // Does damage to enemies while raising your fallen heroes and adding to their maximum health.
      // Health gained by each unit is equal to the total life lost by enemy units divided by the number of friendly units plus 3 rounded to the nearest 5.
      // The equation for this is H = 1/(3+U) x D, where H is Health gained by each allied unit, D is Damage dealt, U = Amount of allied units on the field, and R = Any real number. H is rounded to the nearest 5 at the end.
      //   For example, if there were 3 allied units, and the harvest dealt 400 damage, then H = 1/(3+3) x 400, which is 1/6 x 400, which is 66.66...., which rounds to 65.
      //   As a second example, if there were 7 allied units, and the harvest dealt 780 damage, then H = 1/(3+7) x 780, which is 1/10 x 780, which is 78, which rounds to 80
      unitId: `${userId}_soulHarvest_${index}`,
      faction: EFaction.DARK_ELVES,
      itemType: EItems.SOUL_HARVEST,
      class: EClass.ITEM
    };

    const superCharge = {
      // Triples the attack power of the next attack for the chosen unit
      unitId: `${userId}_superCharge_${index}`,
      faction: EFaction.DARK_ELVES,
      itemType: EItems.SUPERCHARGE,
      class: EClass.ITEM
    };

    itemsDeck.push(manaVial, soulHarvest, superCharge);
  }

  // Unique unit
  unitsDeck.push({
    unitId: `${userId}_wraith`,
    class: EClass.HERO,
    faction: EFaction.DARK_ELVES
  });

  const shuffledDeck = shuffleDeck(unitsDeck, itemsDeck);

  return shuffledDeck;
}
