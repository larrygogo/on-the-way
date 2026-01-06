import { Point } from './MapConfig';

/**
 * 地图节点配置
 */
export interface MapNodeConfig {
  mapId: string;
  type: 'entry' | 'normal' | 'boss' | 'exit';
  weight?: number; // 用于随机选择（可选）
  spawnPoint?: Point; // 玩家出生点（可选，从地图配置读取）
}

/**
 * 传送门链接配置
 */
export interface PortalLinkConfig {
  fromMapId: string;
  portalId: string; // 传送门唯一ID
  toMapId: string;
  portalTemplateId: string; // 使用的传送门模板ID
}

/**
 * 秘境规则配置
 */
export interface DungeonRules {
  allowBacktrack: boolean; // 是否允许回溯
  maxDepth?: number; // 最大深度（可选）
  seedMode?: 'fixed' | 'random'; // 种子模式（可选）
}

/**
 * 秘境配置
 */
export interface DungeonConfig {
  dungeonId: string;
  entryMapId: string; // 入口地图ID
  maps: MapNodeConfig[]; // 地图节点列表
  links: PortalLinkConfig[]; // 传送门链接列表
  rules: DungeonRules; // 规则配置
}

/**
 * 验证秘境配置
 */
export function validateDungeonConfig(data: any, dungeonId: string): void {
  if (!data) {
    throw new Error(`[DungeonConfig] 配置数据为空: ${dungeonId}`);
  }

  if (typeof data.dungeonId !== 'string' || data.dungeonId !== dungeonId) {
    throw new Error(`[DungeonConfig] dungeonId 不匹配: ${dungeonId}`);
  }

  if (typeof data.entryMapId !== 'string' || !data.entryMapId) {
    throw new Error(`[DungeonConfig] entryMapId 缺失或无效: ${dungeonId}`);
  }

  if (!Array.isArray(data.maps) || data.maps.length === 0) {
    throw new Error(`[DungeonConfig] maps 必须是非空数组: ${dungeonId}`);
  }

  // 验证 entryMapId 在 maps 中存在
  const entryMapExists = data.maps.some((m: any) => m.mapId === data.entryMapId);
  if (!entryMapExists) {
    throw new Error(`[DungeonConfig] entryMapId 不在 maps 中: ${dungeonId}`);
  }

  // 验证每个 map 节点
  data.maps.forEach((map: any, index: number) => {
    if (typeof map.mapId !== 'string' || !map.mapId) {
      throw new Error(`[DungeonConfig] maps[${index}].mapId 缺失或无效: ${dungeonId}`);
    }
    if (!['entry', 'normal', 'boss', 'exit'].includes(map.type)) {
      throw new Error(`[DungeonConfig] maps[${index}].type 无效: ${map.type} (${dungeonId})`);
    }
  });

  if (!Array.isArray(data.links)) {
    throw new Error(`[DungeonConfig] links 必须是数组: ${dungeonId}`);
  }

  // 验证每个 link
  data.links.forEach((link: any, index: number) => {
    if (typeof link.fromMapId !== 'string' || !link.fromMapId) {
      throw new Error(`[DungeonConfig] links[${index}].fromMapId 缺失或无效: ${dungeonId}`);
    }
    if (typeof link.portalId !== 'string' || !link.portalId) {
      throw new Error(`[DungeonConfig] links[${index}].portalId 缺失或无效: ${dungeonId}`);
    }
    if (typeof link.toMapId !== 'string' || !link.toMapId) {
      throw new Error(`[DungeonConfig] links[${index}].toMapId 缺失或无效: ${dungeonId}`);
    }
    if (typeof link.portalTemplateId !== 'string' || !link.portalTemplateId) {
      throw new Error(`[DungeonConfig] links[${index}].portalTemplateId 缺失或无效: ${dungeonId}`);
    }

    // 验证 fromMapId 和 toMapId 在 maps 中存在
    const fromExists = data.maps.some((m: any) => m.mapId === link.fromMapId);
    const toExists = data.maps.some((m: any) => m.mapId === link.toMapId);
    if (!fromExists) {
      throw new Error(`[DungeonConfig] links[${index}].fromMapId 不在 maps 中: ${link.fromMapId} (${dungeonId})`);
    }
    if (!toExists) {
      throw new Error(`[DungeonConfig] links[${index}].toMapId 不在 maps 中: ${link.toMapId} (${dungeonId})`);
    }
  });

  if (!data.rules || typeof data.rules.allowBacktrack !== 'boolean') {
    throw new Error(`[DungeonConfig] rules.allowBacktrack 缺失或无效: ${dungeonId}`);
  }
}

