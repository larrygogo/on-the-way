import { Player } from '../../gameplay/entities/Player';
import { Bag } from '../../gameplay/systems/Bag';
import { Aura } from '../../gameplay/systems/Aura';
import { ItemInstance } from '../../gameplay/entities/Item';
import { MapLoader } from '../loaders/MapLoader';
import { WorldBuilder } from '../builders/WorldBuilder';
import { DungeonRunState } from '../../gameplay/state/DungeonRunState';
import { Point } from '../config/MapConfig';
import { Collision } from '../../engine/physics/Collision';

/**
 * 玩家状态快照
 */
export interface PlayerStateSnapshot {
  hp: number;
  maxHp: number;
  safeItems: ItemInstance[];
  unsafeItems: ItemInstance[];
  aura: number;
}

/**
 * 地图切换器
 */
export class MapSwitcher {
  /**
   * 保存玩家状态
   */
  static preservePlayerState(
    player: Player,
    bag: Bag,
    aura: Aura
  ): PlayerStateSnapshot {
    return {
      hp: player.hp,
      maxHp: player.maxHp,
      safeItems: bag.getSafeItems().map(item => {
        // 创建新实例以深拷贝（ID 会自动生成，不需要保留）
        return new ItemInstance(item.type, item.name);
      }),
      unsafeItems: bag.getUnsafeItems().map(item => {
        // 创建新实例以深拷贝（ID 会自动生成，不需要保留）
        return new ItemInstance(item.type, item.name);
      }),
      aura: aura.getCurrent()
    };
  }

  /**
   * 恢复玩家状态
   */
  static restorePlayerState(
    player: Player,
    bag: Bag,
    aura: Aura,
    snapshot: PlayerStateSnapshot
  ): void {
    // 恢复HP
    player.hp = snapshot.hp;
    player.maxHp = snapshot.maxHp;

    // 恢复背包（清空后重新添加）
    // 注意：Bag 没有清空方法，我们需要通过移除所有物品来清空
    while (bag.getSafeItems().length > 0) {
      bag.removeFromSafe(0);
    }
    while (bag.getUnsafeItems().length > 0) {
      bag.removeFromUnsafe(0);
    }

    // 重新添加物品
    snapshot.safeItems.forEach(item => {
      bag.addSafe(item);
    });
    snapshot.unsafeItems.forEach(item => {
      bag.addUnsafe(item);
    });

    // 恢复灵气
    aura.setCurrent(snapshot.aura);
  }

  /**
   * 获取地图的出生点
   */
  static getSpawnPoint(
    mapConfig: any,
    preferredSpawnPoint?: Point
  ): Point {
    // 如果指定了出生点，使用指定的
    if (preferredSpawnPoint) {
      return preferredSpawnPoint;
    }

    // 如果地图配置有 spawnPoints，随机选择一个
    if (mapConfig.spawnPoints && mapConfig.spawnPoints.length > 0) {
      const points = mapConfig.spawnPoints;
      const randomIndex = Math.floor(Math.random() * points.length);
      return points[randomIndex];
    }

    // 否则使用默认逻辑（地图左侧中间）
    const walkArea = mapConfig.walkArea;
    if (walkArea.type === 'rect') {
      return {
        x: walkArea.rect.x + 100,
        y: walkArea.rect.y + walkArea.rect.height / 2
      };
    } else {
      const bounds = Collision.getPolygonBounds(walkArea.points);
      return {
        x: bounds.x + 100,
        y: bounds.y + bounds.height / 2
      };
    }
  }

  /**
   * 切换地图（核心函数）
   * 注意：这个方法需要访问 Game 的私有成员，所以实际实现会在 Game 类中
   * 这里提供一个静态辅助方法用于清理和准备
   */
  static async switchMap(
    toMapId: string,
    spawnPoint?: Point,
    runState?: DungeonRunState
  ): Promise<{
    mapConfig: any;
    world: any;
    spawnPoint: Point;
  }> {
    console.log(`[MapSwitch] 切换地图到: ${toMapId}`);

    // 加载新地图配置
    const mapConfig = await MapLoader.loadMap(toMapId);

    // 从配置构建世界
    const world = WorldBuilder.buildFromConfig(mapConfig);

    // 获取出生点
    const finalSpawnPoint = this.getSpawnPoint(mapConfig, spawnPoint);

    // 更新运行状态
    if (runState) {
      runState.switchToMap(toMapId);
    }

    console.log(`[MapSwitch] 地图切换完成: ${toMapId}, 出生点: (${finalSpawnPoint.x}, ${finalSpawnPoint.y})`);

    return {
      mapConfig,
      world,
      spawnPoint: finalSpawnPoint
    };
  }
}

