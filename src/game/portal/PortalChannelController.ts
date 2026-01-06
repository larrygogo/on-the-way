import { PortalInstance } from './PortalInstance';
import { Point } from '../MapConfig';

/**
 * 传送门读条控制器
 */
export class PortalChannelController {
  private currentPortal: PortalInstance | null = null;
  private channelProgress: number = 0; // 0-1
  private isChanneling: boolean = false;
  private elapsedTime: number = 0; // 已过去的时间（秒）

  /**
   * 开始读条
   */
  beginChannel(portal: PortalInstance): void {
    if (this.isChanneling) {
      console.warn('[PortalChannelController] 已在读条中，无法开始新的读条');
      return;
    }

    this.currentPortal = portal;
    this.isChanneling = true;
    this.channelProgress = 0;
    this.elapsedTime = 0;

    console.log(`[Portal] Begin channeling ${portal.portalId}`);
  }

  /**
   * 更新读条进度
   * @param deltaTime 帧时间差（毫秒）
   * @param playerPos 玩家位置
   * @returns 如果读条完成，返回目标地图ID；否则返回 null
   */
  update(deltaTime: number, playerPos: Point): string | null {
    if (!this.isChanneling || !this.currentPortal) {
      return null;
    }

    // 检查玩家是否仍在范围内
    const isInRange = this.currentPortal.isPlayerInRange(playerPos.x, playerPos.y);

    if (!isInRange && this.currentPortal.cancelOnLeave) {
      // 离开范围，取消读条
      this.cancel('leave_range');
      return null;
    }

    // 更新进度
    this.elapsedTime += deltaTime / 1000; // 转换为秒
    this.channelProgress = Math.min(
      this.elapsedTime / this.currentPortal.activationTime,
      1
    );

    // 检查是否完成
    if (this.channelProgress >= 1) {
      const targetMapId = this.currentPortal.toMapId;
      this.complete();
      return targetMapId;
    }

    return null;
  }

  /**
   * 取消读条
   */
  cancel(reason: string): void {
    if (!this.isChanneling) {
      return;
    }

    console.log(`[Portal] Cancel channeling: ${reason}`);
    this.currentPortal = null;
    this.isChanneling = false;
    this.channelProgress = 0;
    this.elapsedTime = 0;
  }

  /**
   * 完成读条
   */
  private complete(): void {
    if (!this.currentPortal) {
      return;
    }

    console.log(
      `[Portal] Complete channeling, switching to ${this.currentPortal.toMapId}`
    );

    const portalId = this.currentPortal.portalId;
    this.currentPortal = null;
    this.isChanneling = false;
    this.channelProgress = 0;
    this.elapsedTime = 0;
  }

  /**
   * 获取当前读条进度（0-1）
   */
  getProgress(): number {
    return this.channelProgress;
  }

  /**
   * 获取当前传送门
   */
  getCurrentPortal(): PortalInstance | null {
    return this.currentPortal;
  }

  /**
   * 检查是否在读条中
   */
  isChannelingNow(): boolean {
    return this.isChanneling;
  }
}

