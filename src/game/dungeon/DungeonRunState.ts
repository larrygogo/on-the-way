import { DungeonConfig } from '../DungeonConfig';

/**
 * 秘境运行状态
 */
export class DungeonRunState {
  public readonly dungeonId: string;
  public readonly seed?: number;
  public currentMapId: string;
  public visitedMapIds: Set<string>;
  public portalInstances: any[]; // PortalInstance[]，使用 any 避免循环依赖
  public startTime: number;
  public allowBacktrack: boolean;
  public dungeonConfig: DungeonConfig;

  constructor(
    dungeonId: string,
    dungeonConfig: DungeonConfig,
    seed?: number
  ) {
    this.dungeonId = dungeonId;
    this.seed = seed;
    this.dungeonConfig = dungeonConfig;
    this.currentMapId = dungeonConfig.entryMapId;
    this.visitedMapIds = new Set([dungeonConfig.entryMapId]);
    this.portalInstances = [];
    this.startTime = Date.now();
    this.allowBacktrack = dungeonConfig.rules.allowBacktrack;
  }

  /**
   * 获取已用时间（秒）
   */
  getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * 标记地图为已访问
   */
  markMapVisited(mapId: string): void {
    this.visitedMapIds.add(mapId);
  }

  /**
   * 检查是否已访问过地图
   */
  hasVisitedMap(mapId: string): boolean {
    return this.visitedMapIds.has(mapId);
  }

  /**
   * 切换到新地图
   */
  switchToMap(mapId: string): void {
    this.currentMapId = mapId;
    this.markMapVisited(mapId);
  }
}

