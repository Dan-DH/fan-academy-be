import { IItem } from "../interfaces/gameInterface";

// TODO:
export function createItemData(data: Partial<IItem>): IItem {
  return {
    unitId: data.unitId!,
    boardPosition: 51
  };
}