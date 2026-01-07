import { PlayerProfile, createDefaultProfile } from './PlayerProfile';
import { ItemInstance, ItemType } from '../entities/Item';

const STORAGE_KEY = 'player_profile';

/**
 * 玩家档案存储管理器
 */
export class ProfileStore {
  /**
   * 从 localStorage 加载玩家档案
   * 如果不存在，返回默认值
   */
  static loadProfile(): PlayerProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return createDefaultProfile();
      }

      const parsed = JSON.parse(stored);
      
      // 验证并转换数据
      const profile: PlayerProfile = {
        level: typeof parsed.level === 'number' ? parsed.level : 1,
        exp: typeof parsed.exp === 'number' ? parsed.exp : 0,
        unspentPoints: typeof parsed.unspentPoints === 'number' ? parsed.unspentPoints : 0,
        attrs: {
          atk: typeof parsed.attrs?.atk === 'number' ? parsed.attrs.atk : 0,
          hp: typeof parsed.attrs?.hp === 'number' ? parsed.attrs.hp : 0,
          move: typeof parsed.attrs?.move === 'number' ? parsed.attrs.move : 0
        },
        stashItems: Array.isArray(parsed.stashItems) ? this.deserializeItems(parsed.stashItems) : [],
        loadoutSafeItems: Array.isArray(parsed.loadoutSafeItems) ? this.deserializeItems(parsed.loadoutSafeItems) : []
      };

      return profile;
    } catch (error) {
      console.error('[ProfileStore] 加载档案失败:', error);
      return createDefaultProfile();
    }
  }

  /**
   * 保存玩家档案到 localStorage
   */
  static saveProfile(profile: PlayerProfile): void {
    try {
      const serialized = {
        level: profile.level,
        exp: profile.exp,
        unspentPoints: profile.unspentPoints,
        attrs: profile.attrs,
        stashItems: this.serializeItems(profile.stashItems),
        loadoutSafeItems: this.serializeItems(profile.loadoutSafeItems)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('[ProfileStore] 保存档案失败:', error);
    }
  }

  /**
   * 重置玩家档案为默认值
   */
  static resetProfile(): PlayerProfile {
    const defaultProfile = createDefaultProfile();
    this.saveProfile(defaultProfile);
    return defaultProfile;
  }

  /**
   * 序列化物品列表（转换为可存储格式）
   */
  private static serializeItems(items: ItemInstance[]): any[] {
    return items.map(item => ({
      id: item.id,
      type: item.type,
      name: item.name,
      size: item.size
    }));
  }

  /**
   * 反序列化物品列表（从存储格式恢复）
   */
  private static deserializeItems(items: any[]): ItemInstance[] {
    // 重新创建 ItemInstance 对象
    // 注意：由于 id 是 readonly，新创建的实例会有新的 id
    // 这对于持久化来说是可以接受的
    return items.map(item => {
      // 验证类型
      if (item.type !== 'POTION' && item.type !== 'EQUIPMENT') {
        console.warn('[ProfileStore] 无效的物品类型:', item.type);
        return new ItemInstance(ItemType.POTION, '未知物品');
      }
      // 创建新的 ItemInstance（使用构造函数，会生成新的 id）
      const itemType = item.type === 'POTION' ? ItemType.POTION : ItemType.EQUIPMENT;
      return new ItemInstance(itemType, item.name || undefined);
    });
  }
}
