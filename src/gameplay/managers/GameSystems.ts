import { Bag } from '../systems/Bag';
import { Aura } from '../systems/Aura';
import { Channeling, ChannelType } from '../systems/Channeling';
import { SessionTimer } from '../systems/SessionTimer';
import { PortalChannelController } from '../systems/PortalChannelController';

/**
 * 游戏系统协调器
 * 统一管理所有游戏系统
 */
export class GameSystems {
  private bag: Bag;
  private aura: Aura;
  private channeling: Channeling;
  private sessionTimer: SessionTimer;
  private portalChannelController: PortalChannelController;

  constructor() {
    this.bag = new Bag();
    this.aura = new Aura();
    this.channeling = new Channeling();
    this.sessionTimer = new SessionTimer(12 * 60);
    this.portalChannelController = new PortalChannelController();
  }

  /**
   * 获取背包系统
   */
  getBag(): Bag {
    return this.bag;
  }

  /**
   * 获取灵气系统
   */
  getAura(): Aura {
    return this.aura;
  }

  /**
   * 获取读条系统
   */
  getChanneling(): Channeling {
    return this.channeling;
  }

  /**
   * 获取会话计时器
   */
  getSessionTimer(): SessionTimer {
    return this.sessionTimer;
  }

  /**
   * 获取传送门读条控制器
   */
  getPortalChannelController(): PortalChannelController {
    return this.portalChannelController;
  }

  /**
   * 更新所有系统
   * @param deltaTime 帧时间差（秒）
   */
  update(deltaTime: number): void {
    this.sessionTimer.update(deltaTime);
    this.channeling.update(deltaTime);
    this.portalChannelController.update(deltaTime);
  }

  /**
   * 重置所有系统
   */
  reset(): void {
    this.bag = new Bag();
    this.aura = new Aura();
    this.channeling = new Channeling();
    this.sessionTimer = new SessionTimer(12 * 60);
    this.portalChannelController = new PortalChannelController();
  }
}