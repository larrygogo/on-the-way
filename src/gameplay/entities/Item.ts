/**
 * 物品类型
 */
export enum ItemType {
  POTION = 'POTION',      // size = 1
  EQUIPMENT = 'EQUIPMENT' // size = 2
}

/**
 * 物品实例（带唯一 id）
 */
export class ItemInstance {
  public readonly id: string;
  public readonly type: ItemType;
  public readonly name: string;
  public readonly size: number;

  constructor(type: ItemType, name?: string) {
    this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.name = name ?? this.getDefaultName(type);
    this.size = type === ItemType.POTION ? 1 : 2;
  }

  private getDefaultName(type: ItemType): string {
    switch (type) {
      case ItemType.POTION:
        return '药水';
      case ItemType.EQUIPMENT:
        return '装备';
      default:
        return '未知物品';
    }
  }
}

