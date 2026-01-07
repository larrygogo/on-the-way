import { DungeonRunState } from '../state/DungeonRunState';
import { PlayerProfile } from '../state/PlayerProfile';
import { AppState } from '../state/AppState';

/**
 * 游戏会话管理器
 * 负责管理游戏会话的生命周期和状态
 */
export class GameSession {
  private dungeonRunState: DungeonRunState | null = null;
  private playerProfile: PlayerProfile;
  private appState: AppState;
  private startTime: number = 0;
  private isActive: boolean = false;

  constructor(playerProfile: PlayerProfile, appState: AppState) {
    this.playerProfile = playerProfile;
    this.appState = appState;
  }

  /**
   * 开始游戏会话
   * @param dungeonId 秘境ID
   * @param seed 随机种子（可选）
   */
  async start(dungeonId: string, seed?: number): Promise<void> {
    if (this.isActive) {
      throw new Error('[GameSession] 会话已在进行中');
    }

    // 这里应该加载秘境配置并创建 DungeonRunState
    // 为了保持兼容性，暂时保留接口，具体实现由 Game 类处理
    this.startTime = Date.now();
    this.isActive = true;
  }

  /**
   * 设置秘境运行状态
   */
  setDungeonRunState(state: DungeonRunState): void {
    this.dungeonRunState = state;
  }

  /**
   * 获取秘境运行状态
   */
  getDungeonRunState(): DungeonRunState | null {
    return this.dungeonRunState;
  }

  /**
   * 结束游戏会话
   */
  end(): void {
    this.isActive = false;
    this.dungeonRunState = null;
  }

  /**
   * 检查会话是否活跃
   */
  isSessionActive(): boolean {
    return this.isActive;
  }

  /**
   * 获取会话开始时间
   */
  getStartTime(): number {
    return this.startTime;
  }

  /**
   * 获取会话持续时间（秒）
   */
  getElapsedTime(): number {
    if (!this.isActive) {
      return 0;
    }
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * 获取玩家档案
   */
  getPlayerProfile(): PlayerProfile {
    return this.playerProfile;
  }

  /**
   * 获取应用状态
   */
  getAppState(): AppState {
    return this.appState;
  }
}