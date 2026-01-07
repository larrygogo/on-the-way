import { ItemInstance } from '../entities/Item';

/**
 * 玩家档案数据结构
 */
export interface PlayerProfile {
  level: number;
  exp: number;
  unspentPoints: number;
  attrs: {
    atk: number;
    hp: number;
    move: number;
  };
  stashItems: ItemInstance[];
  loadoutSafeItems: ItemInstance[]; // 开局注入局内安全区背包（容量=2格）
}

/**
 * 创建默认玩家档案
 */
export function createDefaultProfile(): PlayerProfile {
  return {
    level: 1,
    exp: 0,
    unspentPoints: 0,
    attrs: {
      atk: 0,
      hp: 0,
      move: 0
    },
    stashItems: [],
    loadoutSafeItems: []
  };
}
