import { Schema, type } from "@colyseus/schema";

/**
 *  USER SCHEMA
 */
class EquippedItem extends Schema {
  @type('string') itemName: string;
}

class Unit extends Schema {
  @type('string') unitClass: string; //  hero | item
  @type('string') unitType: string; //  archer, voidmonk...
  @type('string') unitId: string; //  used to locate the unit in the board. eg: P213 -> 13th unit deployed by second user
  @type('number') boardPosition: number; // 0-45, 0 if not on board
  @type('number') maxHealth: number;
  @type('number') currentHealth: number;
  @type('boolean') isKO: boolean;
  @type('number') movement: number;
  @type('number') range: number; // 1, 2, 3
  @type('string') attackType: string; //  physiucal | magical
  @type('number') rangeAttackDamage: number;
  @type('number') meleeAttackDamage: number;
  @type('number') healingPower: number; // If > 0 can heal
  @type('number') physicalDamageResistance: number;
  @type('number') magicalDamageResistance: number;
  @type([EquippedItem]) equippedItems: EquippedItem[];
  @type('string') spriteLink: string; // path based on items
}

class userData extends Schema {
  @type('string') userId: string;
  @type('string') username: string;
  @type('string') picture: string;
}

class Faction extends Schema {
  @type('string') factionName: string;
  @type([Unit]) unitsOnBoard: Unit[];
  @type([Unit]) unitsInHand: Unit[];
  @type([Unit]) unitsInDeck: Unit[];
  @type('number') cristalOneHealth: number;
  @type('number') cristalTwoHealth: number;
}

class User extends Schema {
  @type(userData) userData: userData;
  @type(Faction) faction: Faction;
}

/**
 *  TURN SCHEMA
 */
class TurnAction extends Schema {
  @type('string') activeUnit: string; // unit id, like P101
  @type('string') targetUnit: string; // unit id, like P101. When shuffling, the targetUnit can be the deck
  @type('string') action: string; // attack, heal, shuffle
  @type('number') actionNumber: number; // order in the turn
}

class Turn extends Schema {
  @type('number') turnNumber: number;
  @type('string') activeuser: string;
  @type([TurnAction]) actions: TurnAction[];
}

export default class RoomState extends Schema {
  @type([User]) users: User[];
  @type([Turn]) gameState: Turn[];
  @type('string') board: string;
  @type('string') winCondition?: string;
  @type('string') winner?: string; // userId
}