import { MapConfig } from '../config/MapConfig';

/**
 * 地图加载器
 * 负责从 JSON 文件加载地图配置并验证
 */
export class MapLoader {
  /**
   * 加载地图配置
   * @param mapId 地图ID（例如 "map_001"）
   * @returns 地图配置对象
   */
  static async loadMap(mapId: string): Promise<MapConfig> {
    try {
      const response = await fetch(`/data/maps/${mapId}.json`);
      
      if (!response.ok) {
        throw new Error(`无法加载地图文件: ${mapId}.json (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      
      // 验证配置
      this.validateMapConfig(data, mapId);
      
      return data as MapConfig;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[MapLoader] 加载地图失败: ${error.message}`);
        throw error;
      }
      throw new Error(`[MapLoader] 未知错误: ${String(error)}`);
    }
  }

  /**
   * 验证地图配置
   * @param data 配置数据
   * @param mapId 地图ID（用于错误提示）
   */
  private static validateMapConfig(data: any, mapId: string): void {
    const errors: string[] = [];

    // 验证基本字段
    if (!data.id || typeof data.id !== 'string') {
      errors.push(`地图配置缺少或类型错误: id (应为 string)`);
    }
    if (!data.name || typeof data.name !== 'string') {
      errors.push(`地图配置缺少或类型错误: name (应为 string)`);
    }

    // 验证 walkArea（支持矩形或多边形）
    if (!data.walkArea) {
      errors.push(`地图配置缺少: walkArea`);
    } else {
      const area = data.walkArea;
      if (area.type === 'rect') {
        const rect = area.rect;
        if (!rect || typeof rect.x !== 'number' || typeof rect.y !== 'number' ||
            typeof rect.width !== 'number' || typeof rect.height !== 'number') {
          errors.push(`地图配置 walkArea.rect 字段类型错误 (应为 {x: number, y: number, width: number, height: number})`);
        }
      } else if (area.type === 'polygon') {
        if (!Array.isArray(area.points) || area.points.length < 3) {
          errors.push(`地图配置 walkArea.points 应为至少包含3个点的数组`);
        } else {
          area.points.forEach((point: any, index: number) => {
            if (typeof point.x !== 'number' || typeof point.y !== 'number') {
              errors.push(`地图配置 walkArea.points[${index}] 缺少必填字段或类型错误 (x, y 应为 number)`);
            }
          });
        }
      } else {
        errors.push(`地图配置 walkArea.type 应为 'rect' 或 'polygon'`);
      }
    }

    // 验证 obstacles
    if (!Array.isArray(data.obstacles)) {
      errors.push(`地图配置 obstacles 应为数组`);
    } else {
      data.obstacles.forEach((obs: any, index: number) => {
        if (typeof obs.x !== 'number' || typeof obs.y !== 'number' ||
            typeof obs.footprintWidth !== 'number' || typeof obs.footprintHeight !== 'number') {
          errors.push(`地图配置 obstacles[${index}] 缺少必填字段或类型错误 (x, y, footprintWidth, footprintHeight 应为 number)`);
        }
      });
    }

    // 验证 auraNodes
    if (!Array.isArray(data.auraNodes)) {
      errors.push(`地图配置 auraNodes 应为数组`);
    } else {
      data.auraNodes.forEach((node: any, index: number) => {
        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
          errors.push(`地图配置 auraNodes[${index}] 缺少必填字段或类型错误 (x, y 应为 number)`);
        }
      });
    }

    // 验证 extractionZone
    if (!data.extractionZone) {
      errors.push(`地图配置缺少: extractionZone`);
    } else {
      const zone = data.extractionZone;
      if (typeof zone.x !== 'number' || typeof zone.y !== 'number') {
        errors.push(`地图配置 extractionZone 缺少必填字段或类型错误 (x, y 应为 number)`);
      }
    }

    // 验证 lootSpawns
    if (!Array.isArray(data.lootSpawns)) {
      errors.push(`地图配置 lootSpawns 应为数组`);
    } else {
      data.lootSpawns.forEach((loot: any, index: number) => {
        if (typeof loot.x !== 'number' || typeof loot.y !== 'number' ||
            !loot.itemType || (loot.itemType !== 'POTION' && loot.itemType !== 'EQUIPMENT')) {
          errors.push(`地图配置 lootSpawns[${index}] 缺少必填字段或类型错误 (x, y 应为 number, itemType 应为 'POTION' 或 'EQUIPMENT')`);
        }
      });
    }

    // 验证 enemies
    if (!data.enemies) {
      errors.push(`地图配置缺少: enemies`);
    } else {
      const enemies = data.enemies;
      
      // 验证 spawnPoints
      if (!Array.isArray(enemies.spawnPoints)) {
        errors.push(`地图配置 enemies.spawnPoints 应为数组`);
      } else {
        enemies.spawnPoints.forEach((point: any, index: number) => {
          if (typeof point.x !== 'number' || typeof point.y !== 'number') {
            errors.push(`地图配置 enemies.spawnPoints[${index}] 缺少必填字段或类型错误 (x, y 应为 number)`);
          }
        });
      }

      // 验证 initial
      if (!enemies.initial) {
        errors.push(`地图配置 enemies.initial 缺少`);
      } else {
        if (typeof enemies.initial.normalCount !== 'number' ||
            typeof enemies.initial.eliteCount !== 'number') {
          errors.push(`地图配置 enemies.initial 字段类型错误 (normalCount, eliteCount 应为 number)`);
        }
      }

      // 验证 refresh
      if (!enemies.refresh) {
        errors.push(`地图配置 enemies.refresh 缺少`);
      } else {
        if (typeof enemies.refresh.intervalSec !== 'number' ||
            typeof enemies.refresh.maxAlive !== 'number' ||
            typeof enemies.refresh.minDistanceToPlayer !== 'number') {
          errors.push(`地图配置 enemies.refresh 字段类型错误 (intervalSec, maxAlive, minDistanceToPlayer 应为 number)`);
        }
      }
    }

    // 如果有错误，抛出异常
    if (errors.length > 0) {
      const errorMessage = `[MapLoader] 地图配置验证失败 (${mapId}):\n${errors.join('\n')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}

