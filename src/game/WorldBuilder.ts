import { MapConfig } from './MapConfig';
import { Obstacle } from './Obstacle';
import { AuraNode } from './AuraNode';
import { ExtractionZone } from './ExtractionZone';
import { GroundLoot } from './GroundLoot';
import { ItemInstance, ItemType } from './Item';
import { Enemy, EnemyType } from './Enemy';
import { GroundBand } from './GroundBand';
import { Collision } from './Collision';

/**
 * 世界生成器
 * 从地图配置生成游戏世界
 */
export class WorldBuilder {
  /**
   * 从配置构建世界
   * @param config 地图配置
   * @returns 构建的世界对象
   */
  static buildFromConfig(config: MapConfig): WorldBuildResult {
    const walkArea = config.walkArea;

    // 1. 设置地面带
    const groundBand = new GroundBand(walkArea);

    // 2. 生成障碍物
    const obstacles = config.obstacles.map(obs => {
      return new Obstacle(
        obs.x,
        obs.y,
        obs.footprintWidth,
        obs.footprintHeight,
        obs.visualWidth,
        obs.visualHeight
      );
    });

    // 设置障碍物的 sortOffset（如果有）
    config.obstacles.forEach((obs, index) => {
      if (obs.sortOffset !== undefined) {
        obstacles[index].sortOffset = obs.sortOffset;
      }
    });

    // 3. 生成撤离点
    const extractionZone = new ExtractionZone(
      config.extractionZone.x,
      config.extractionZone.y,
      config.extractionZone.channelSeconds ?? 15,
      config.extractionZone.costAura ?? 100
    );
    if (config.extractionZone.radius !== undefined) {
      extractionZone.radius = config.extractionZone.radius;
    }

    // 4. 生成灵气点
    const auraNodes = config.auraNodes.map(node => {
      return new AuraNode(
        node.x,
        node.y,
        node.collectSeconds ?? 2.0,
        node.gainAmount ?? 20
      );
    });
    // 设置 radius（如果有）
    config.auraNodes.forEach((node, index) => {
      if (node.radius !== undefined) {
        auraNodes[index].radius = node.radius;
      }
    });

    // 5. 生成初始地面掉落物
    const lootDrops = config.lootSpawns.map(loot => {
      const itemType = loot.itemType === 'POTION' ? ItemType.POTION : ItemType.EQUIPMENT;
      const item = new ItemInstance(itemType, loot.itemName);
      return new GroundLoot(loot.x, loot.y, item);
    });

    // 6. 初始化怪物系统
    const enemySpawnPoints = config.enemies.spawnPoints;
    const initialConfig = config.enemies.initial;
    const refreshConfig = config.enemies.refresh;

    // 生成初始敌人
    const enemies: Enemy[] = [];
    let normalCount = 0;
    let eliteCount = 0;

    // 随机打乱刷新点顺序
    const shuffledPoints = [...enemySpawnPoints].sort(() => Math.random() - 0.5);

    for (const point of shuffledPoints) {
      // 确保位置在地图范围内
      let clampedX = point.x;
      let clampedY = point.y;

      if (walkArea.type === 'rect') {
        clampedX = Math.max(walkArea.rect.x, Math.min(walkArea.rect.x + walkArea.rect.width, point.x));
        clampedY = Math.max(walkArea.rect.y, Math.min(walkArea.rect.y + walkArea.rect.height, point.y));
      } else {
        // 多边形：使用边界限制
        const clamped = Collision.clampPointToPolygon({ x: point.x, y: point.y }, walkArea.points);
        clampedX = clamped.x;
        clampedY = clamped.y;
      }

      let type: EnemyType | null = null;

      // 优先生成精英怪
      if (eliteCount < initialConfig.eliteCount) {
        type = 'ELITE';
        eliteCount++;
      } else if (normalCount < initialConfig.normalCount) {
        type = 'NORMAL';
        normalCount++;
      }

      if (type) {
        const enemy = new Enemy(type, clampedX, clampedY);
        enemy.setObstacles(obstacles);
        enemy.setWalkArea(walkArea);
        enemies.push(enemy);
      }

      // 如果已经生成足够的怪物，退出
      if (normalCount >= initialConfig.normalCount && eliteCount >= initialConfig.eliteCount) {
        break;
      }
    }

    return {
      groundBand,
      obstacles,
      extractionZone,
      auraNodes,
      lootDrops,
      enemies,
      walkArea,
      enemyRefreshConfig: refreshConfig
    };
  }
}

/**
 * 世界构建结果
 */
export interface WorldBuildResult {
  groundBand: GroundBand;
  obstacles: Obstacle[];
  extractionZone: ExtractionZone;
  auraNodes: AuraNode[];
  lootDrops: GroundLoot[];
  enemies: Enemy[];
  walkArea: MapConfig['walkArea'];
  enemyRefreshConfig: {
    intervalSec: number;
    maxAlive: number;
    minDistanceToPlayer: number;
    weights?: {
      normal?: number;
      elite?: number;
    };
  };
}
