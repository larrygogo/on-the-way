import { DungeonConfig } from '../DungeonConfig';
import { MapConfig } from '../MapConfig';
import { PortalInstance } from './PortalInstance';
import { PortalTemplateLoader } from './PortalTemplateLoader';

/**
 * 传送门生成器
 */
export class PortalSpawner {
  /**
   * 为当前地图生成传送门实例
   * @param currentMapId 当前地图ID
   * @param dungeonConfig 秘境配置
   * @param mapConfig 地图配置
   * @returns 传送门实例数组
   */
  static spawnPortalsForMap(
    currentMapId: string,
    dungeonConfig: DungeonConfig,
    mapConfig: MapConfig
  ): PortalInstance[] {
    const portals: PortalInstance[] = [];

    // 筛选当前地图的传送门链接
    const linksForCurrentMap = dungeonConfig.links.filter(
      link => link.fromMapId === currentMapId
    );

    if (linksForCurrentMap.length === 0) {
      console.log(`[PortalSpawner] 地图 ${currentMapId} 没有传送门链接`);
      return portals;
    }

    // 获取地图的传送门生成点
    const portalSpawns = mapConfig.portalSpawns || [];

    // 为每个链接创建传送门实例
    for (const link of linksForCurrentMap) {
      // 查找对应的传送门生成点
      const spawnPoint = portalSpawns.find(spawn => spawn.portalId === link.portalId);

      if (!spawnPoint) {
        console.warn(
          `[PortalSpawner] 未找到传送门 ${link.portalId} 的生成点，跳过`
        );
        continue;
      }

      // 获取传送门模板
      const template = PortalTemplateLoader.getPortalTemplate(link.portalTemplateId);
      if (!template) {
        console.warn(
          `[PortalSpawner] 未找到传送门模板 ${link.portalTemplateId}，跳过`
        );
        continue;
      }

      // 创建传送门实例
      const portal = new PortalInstance(
        link.portalId,
        link.fromMapId,
        link.toMapId,
        { x: spawnPoint.x, y: spawnPoint.y },
        template
      );

      portals.push(portal);
      console.log(
        `[PortalSpawner] 生成传送门 ${link.portalId}: ${link.fromMapId} -> ${link.toMapId}`
      );
    }

    return portals;
  }
}

