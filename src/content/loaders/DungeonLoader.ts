import { DungeonConfig, validateDungeonConfig } from '../config/DungeonConfig';

/**
 * 秘境配置加载器
 */
export class DungeonLoader {
  /**
   * 加载秘境配置
   * @param dungeonId 秘境ID（例如 "demo_dungeon"）
   * @returns 秘境配置对象
   */
  static async loadDungeonConfig(dungeonId: string): Promise<DungeonConfig> {
    try {
      const response = await fetch(`./data/dungeons/${dungeonId}.json`);
      
      if (!response.ok) {
        throw new Error(`无法加载秘境文件: ${dungeonId}.json (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      
      // 验证配置
      validateDungeonConfig(data, dungeonId);
      
      return data as DungeonConfig;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[DungeonLoader] 加载秘境失败: ${error.message}`);
        throw error;
      }
      throw new Error(`[DungeonLoader] 未知错误: ${String(error)}`);
    }
  }
}

