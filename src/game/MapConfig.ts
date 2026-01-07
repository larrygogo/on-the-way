/**
 * 地图配置类型定义
 */

/**
 * 矩形区域
 */
export interface RectConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 点坐标
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 可走区域配置
 * 可以是矩形或多边形
 */
export type WalkAreaConfig = 
  | { type: 'rect'; rect: RectConfig }
  | { type: 'polygon'; points: Point[] };

/**
 * 障碍物配置
 */
export interface ObstacleConfig {
  x: number;
  y: number;
  footprintWidth: number;
  footprintHeight: number;
  visualWidth?: number;
  visualHeight?: number;
  sortOffset?: number;
}

/**
 * 灵气点配置
 */
export interface AuraNodeConfig {
  x: number;
  y: number;
  collectSeconds?: number;
  gainAmount?: number;
  radius?: number;
}

/**
 * 撤离点配置
 */
export interface ExtractionZoneConfig {
  x: number;
  y: number;
  radius?: number;
  channelSeconds?: number;
  costAura?: number;
}

/**
 * 掉落物生成点配置
 */
export interface LootSpawnConfig {
  x: number;
  y: number;
  itemType: 'POTION' | 'EQUIPMENT';
  itemName?: string;
}

/**
 * 敌人刷新点配置
 */
export interface EnemySpawnPointConfig {
  x: number;
  y: number;
}

/**
 * 敌人初始配置
 */
export interface EnemyInitialConfig {
  normalCount: number;
  eliteCount: number;
}

/**
 * 敌人刷新配置
 */
export interface EnemyRefreshConfig {
  intervalSec: number;
  maxAlive: number;
  minDistanceToPlayer: number;
  weights?: {
    normal?: number;
    elite?: number;
  };
}

/**
 * 敌人配置
 */
export interface EnemyConfig {
  spawnPoints: EnemySpawnPointConfig[];
  initial: EnemyInitialConfig;
  refresh: EnemyRefreshConfig;
}

/**
 * 地图配置
 */
export interface MapConfig {
  // 地图基本信息
  id: string;
  name: string;
  
  // 可走区域（支持矩形或多边形）
  walkArea: WalkAreaConfig;
  
  // 障碍物列表
  obstacles: ObstacleConfig[];
  
  // 灵气点列表
  auraNodes: AuraNodeConfig[];
  
  // 撤离点
  extractionZone: ExtractionZoneConfig;
  
  // 掉落物生成点列表
  lootSpawns: LootSpawnConfig[];
  
  // 敌人配置
  enemies: EnemyConfig;
}
