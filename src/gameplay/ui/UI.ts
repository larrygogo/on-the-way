import { ItemInstance } from '../entities/Item';
import { Bag } from '../systems/Bag';
import { Aura } from '../systems/Aura';
import { SessionTimer } from '../systems/SessionTimer';
import { Player } from '../entities/Player';
import { MobileControls } from './MobileControls';
import { UIManager } from '../../ui/core/UIManager';
import { LoadingPanel } from '../../ui/panels/LoadingPanel';

/**
 * UI 模式
 */
export type UIMode = 'GAME' | 'INVENTORY' | 'CHANNELING';

/**
 * UI 状态
 */
export interface UIState {
  uiMode: UIMode;
  showPickupPrompt: boolean;
  pickupItemName: string;
  pickupItemSize: number;
  showChoiceDialog: boolean;
  pendingItem: ItemInstance | null;
  showBagDialog: boolean;
  channelProgress: number; // 读条进度 0-1
  channelType: string | null; // 读条类型
  resultReason: 'SUCCESS' | 'TIMEOUT' | 'DEAD' | 'EXTRACT_INTERRUPTED' | null; // 结算原因
  resultSafeItems: ItemInstance[]; // 结算时安全区物品
  resultUnsafeItems: ItemInstance[]; // 结算时普通区物品（成功时保留）
  resultLostItems: ItemInstance[]; // 结算时丢失物品（失败时显示）
}

/**
 * UI 渲染器
 * 兼容层：保留旧 API，内部转发到新 UI 系统
 */
export class UI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private uiManager: UIManager | null = null;
  private loadingPanel: LoadingPanel | null = null;
  private useNewUI: boolean = false;

  constructor(canvas: HTMLCanvasElement, uiManager?: UIManager) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = context;
    
    // 如果提供了 UIManager，使用新 UI 系统
    if (uiManager) {
      this.uiManager = uiManager;
      this.useNewUI = true;
      this.loadingPanel = new LoadingPanel();
      // 注意：InventoryPanel 在 Game.ts 中创建和管理
    }
  }

  /**
   * 检测是否为竖屏
   */
  isPortrait(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  /**
   * 获取 Safe Area 值
   */
  getSafeArea(): { top: number; right: number; bottom: number; left: number } {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(rootStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
      right: parseInt(rootStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
      bottom: parseInt(rootStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
      left: parseInt(rootStyle.getPropertyValue('--safe-area-inset-left') || '0', 10)
    };
  }

  /**
   * 检测是否为移动端
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  /**
   * 渲染竖屏提示遮罩
   */
  renderPortraitOverlay(onContinue: () => void): void {
    if (!this.isPortrait()) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    
    // 绘制遮罩
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制提示文字
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      '建议横屏体验',
      rect.width / 2,
      rect.height / 2 - 40
    );
    this.ctx.restore();

    // 绘制继续按钮
    const buttonX = rect.width / 2 - 100;
    const buttonY = rect.height / 2 + 20;
    const buttonWidth = 200;
    const buttonHeight = 50;

    this.ctx.save();
    this.ctx.fillStyle = '#4a90e2';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      '继续',
      rect.width / 2,
      buttonY + 35
    );
    this.ctx.restore();

    // 检查点击继续按钮
    const clickHandler = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      if (clientX && clientY) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = clientX - canvasRect.left;
        const y = clientY - canvasRect.top;
        if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
          onContinue();
        }
      }
    };
    this.canvas.addEventListener('click', clickHandler, { once: true });
    this.canvas.addEventListener('touchstart', clickHandler, { once: true });
  }

  /**
   * 渲染 HUD
   */
  renderHUD(bag: Bag, aura: Aura, timer: SessionTimer, player: Player, uiState: UIState, mobileControls?: MobileControls | null): void {
    const rect = this.canvas.getBoundingClientRect();
    
    // 绘制背景（扩大以容纳所有信息）
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 250, 120);
    this.ctx.restore();

    // 绘制倒计时
    this.ctx.save();
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = '18px Arial';
    this.ctx.fillText(
      timer.formatTime(),
      20,
      35
    );
    this.ctx.restore();

    // 绘制背包容量文字
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      `安全 ${bag.usedSafe()}/${bag.getSafeCap()} | 普通 ${bag.usedUnsafe()}/${bag.getUnsafeCap()}`,
      20,
      55
    );
    this.ctx.restore();

    // 绘制灵气显示
    this.ctx.save();
    this.ctx.fillStyle = '#00ffff';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      `灵气 ${aura.getCurrent()}/${aura.getCap()}`,
      20,
      75
    );
    this.ctx.restore();

    // 绘制 HP 显示
    this.ctx.save();
    const hpPercent = player.hp / player.maxHp;
    this.ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      `HP ${player.hp}/${player.maxHp}`,
      20,
      95
    );
    this.ctx.restore();

    // 绘制读条（CHANNELING 模式）
    if (uiState.uiMode === 'CHANNELING') {
      this.renderChanneling(uiState);
    }

    // 绘制拾取提示（仅在 GAME 模式下显示）
    if (uiState.uiMode === 'GAME' && uiState.showPickupPrompt) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(rect.width / 2 - 150, rect.height - 80, 300, 50);
      this.ctx.fillStyle = '#ffff00';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `按 E 拾取：${uiState.pickupItemName}(占格${uiState.pickupItemSize})`,
        rect.width / 2,
        rect.height - 45
      );
      this.ctx.textAlign = 'left';
      this.ctx.restore();
    }

    // 如果存在移动端控制，渲染移动端控制UI
    if (mobileControls) {
      this.renderVirtualJoystick(mobileControls);
      this.renderMobileButtons(mobileControls);
    }
  }

  /**
   * 渲染虚拟摇杆
   */
  renderVirtualJoystick(mobileControls: MobileControls): void {
    const joystickState = mobileControls.getJoystickState();
    
    // 绘制基座
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(joystickState.centerX, joystickState.centerY, joystickState.baseRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();

    // 绘制摇杆头
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(joystickState.currentX, joystickState.currentY, joystickState.headRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * 渲染移动端按钮
   */
  renderMobileButtons(mobileControls: MobileControls): void {
    const buttonPositions = mobileControls.getButtonPositionsForRender();
    const buttonStates = mobileControls.getButtonStates();
    const buttonSize = mobileControls.getButtonSize();

    const buttonLabels: Map<string, string> = new Map([
      ['INTERACT', '交互'],
      ['ATTACK', '攻击'],
      ['BAG', '背包'],
      ['CANCEL', '取消']
    ]);

    const buttonColors: Map<string, string> = new Map([
      ['INTERACT', '#4a90e2'],
      ['ATTACK', '#ff6666'],
      ['BAG', '#4a90e2'],
      ['CANCEL', '#999999']
    ]);

    for (const [type, pos] of buttonPositions.entries()) {
      const state = buttonStates.get(type as any);
      const isPressed = state?.pressed ?? false;
      const label = buttonLabels.get(type) || type;
      const color = buttonColors.get(type) || '#4a90e2';

      // 绘制按钮背景
      this.ctx.save();
      this.ctx.fillStyle = isPressed ? 'rgba(255, 255, 255, 0.8)' : color;
      this.ctx.globalAlpha = isPressed ? 0.8 : 0.6;
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, buttonSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();

      // 绘制按钮文字
      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, pos.x, pos.y);
      this.ctx.restore();
    }
  }

  /**
   * 渲染背包面板（两栏：安全区/普通区）
   */
  renderInventoryPanel(
    bag: Bag,
    aura: Aura,
    _onMoveSafeToUnsafe: (index: number) => void,
    _onMoveUnsafeToSafe: (index: number) => void,
    _onDropSafe: (index: number) => void,
    _onDropUnsafe: (index: number) => void
  ): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const panelWidth = 800;
    const panelHeight = 500;
    const leftPanelX = centerX - panelWidth / 2 + 20;
    const rightPanelX = centerX + 20;
    const panelY = centerY - panelHeight / 2 + 40;

    // 绘制背景遮罩
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制面板背景
    this.ctx.save();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight
    );
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight
    );
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('背包 (按 I 或 Tab 关闭)', centerX, centerY - panelHeight / 2 + 30);
    this.ctx.restore();

    const columnWidth = 360;
    const columnHeight = panelHeight - 80;
    const itemHeight = 50;

    // 绘制左栏：安全区
    const safeItems = bag.getSafeItems();
    const safeUsed = bag.usedSafe();
    const safeCap = bag.getSafeCap();
    
    // 绘制安全区列背景
    this.ctx.save();
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(leftPanelX, panelY, columnWidth, columnHeight);
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(leftPanelX, panelY, columnWidth, columnHeight);
    this.ctx.restore();

    // 绘制安全区标题和容量
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`安全区 (${safeUsed}/${safeCap})`, leftPanelX + 10, panelY + 25);
    this.ctx.restore();

    // 绘制安全区物品列表
    const safeStartY = panelY + 40;
    safeItems.forEach((item, index) => {
      const itemY = safeStartY + index * itemHeight;
      if (itemY + itemHeight > panelY + columnHeight) return; // 超出范围不绘制

      // 绘制物品背景
      this.ctx.save();
      this.ctx.fillStyle = '#3a3a3a';
      this.ctx.fillRect(leftPanelX + 5, itemY, columnWidth - 10, itemHeight - 5);
      this.ctx.restore();

      // 绘制物品信息
      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(
        `${item.name} (占格${item.size})`,
        leftPanelX + 15,
        itemY + 20
      );
      this.ctx.restore();

      // 绘制移动按钮（安全区->普通区）
      const moveButtonX = leftPanelX + columnWidth - 200;
      const moveButtonY = itemY + 5;
      const moveButtonWidth = 80;
      const moveButtonHeight = 18;
      
      const itemCanMove = bag.canAddUnsafe(item);
      
      this.ctx.save();
      if (!itemCanMove) {
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(moveButtonX, moveButtonY, moveButtonWidth, moveButtonHeight);
        this.ctx.fillStyle = '#999999';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('容量不足', moveButtonX + 5, moveButtonY + 13);
      } else {
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.fillRect(moveButtonX, moveButtonY, moveButtonWidth, moveButtonHeight);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('移到普通区', moveButtonX + 5, moveButtonY + 13);
      }
      this.ctx.restore();

      // 绘制丢弃按钮
      const dropButtonX = leftPanelX + columnWidth - 110;
      const dropButtonY = itemY + 5;
      const dropButtonWidth = 50;
      const dropButtonHeight = 18;
      
      this.ctx.save();
      this.ctx.fillStyle = '#ff6666';
      this.ctx.fillRect(dropButtonX, dropButtonY, dropButtonWidth, dropButtonHeight);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText('丢弃', dropButtonX + 15, dropButtonY + 13);
      this.ctx.restore();
    });

    // 绘制右栏：普通区
    const unsafeItems = bag.getUnsafeItems();
    const unsafeUsed = bag.usedUnsafe();
    const unsafeCap = bag.getUnsafeCap();
    
    // 绘制普通区列背景
    this.ctx.save();
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(rightPanelX, panelY, columnWidth, columnHeight);
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(rightPanelX, panelY, columnWidth, columnHeight);
    this.ctx.restore();

    // 绘制普通区标题和容量
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`普通区 (${unsafeUsed}/${unsafeCap})`, rightPanelX + 10, panelY + 25);
    this.ctx.restore();

    // 绘制普通区物品列表
    const unsafeStartY = panelY + 40;
    unsafeItems.forEach((item, index) => {
      const itemY = unsafeStartY + index * itemHeight;
      if (itemY + itemHeight > panelY + columnHeight) return; // 超出范围不绘制

      // 绘制物品背景
      this.ctx.save();
      this.ctx.fillStyle = '#3a3a3a';
      this.ctx.fillRect(rightPanelX + 5, itemY, columnWidth - 10, itemHeight - 5);
      this.ctx.restore();

      // 绘制物品信息
      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(
        `${item.name} (占格${item.size})`,
        rightPanelX + 15,
        itemY + 20
      );
      this.ctx.restore();

      // 绘制移动按钮（普通区->安全区）
      const moveButtonX = rightPanelX + columnWidth - 200;
      const moveButtonY = itemY + 5;
      const moveButtonWidth = 80;
      const moveButtonHeight = 18;
      
      const itemCanMove = bag.canAddSafe(item) && aura.canSpendAura(8);
      
      this.ctx.save();
      if (!itemCanMove) {
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(moveButtonX, moveButtonY, moveButtonWidth, moveButtonHeight);
        this.ctx.fillStyle = '#999999';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('容量/灵气不足', moveButtonX + 5, moveButtonY + 13);
      } else {
        this.ctx.fillStyle = '#4a90e2';
        this.ctx.fillRect(moveButtonX, moveButtonY, moveButtonWidth, moveButtonHeight);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('移到安全区', moveButtonX + 5, moveButtonY + 13);
      }
      this.ctx.restore();

      // 绘制丢弃按钮
      const dropButtonX = rightPanelX + columnWidth - 110;
      const dropButtonY = itemY + 5;
      const dropButtonWidth = 50;
      const dropButtonHeight = 18;
      
      this.ctx.save();
      this.ctx.fillStyle = '#ff6666';
      this.ctx.fillRect(dropButtonX, dropButtonY, dropButtonWidth, dropButtonHeight);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px Arial';
      this.ctx.fillText('丢弃', dropButtonX + 15, dropButtonY + 13);
      this.ctx.restore();
    });
  }

  /**
   * 检查背包面板点击
   */
  checkInventoryClick(
    x: number,
    y: number,
    bag: Bag
  ): {
    type: 'moveSafeToUnsafe' | 'moveUnsafeToSafe' | 'dropSafe' | 'dropUnsafe' | null;
    index?: number;
  } {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const panelWidth = 800;
    const panelHeight = 500;
    const leftPanelX = centerX - panelWidth / 2 + 20;
    const rightPanelX = centerX + 20;
    const panelY = centerY - panelHeight / 2 + 40;
    const itemHeight = 50;
    const startY = panelY + 40;

    // 检查左栏（安全区）
    const safeItems = bag.getSafeItems();
    for (let index = 0; index < safeItems.length; index++) {
      const itemY = startY + index * itemHeight;
      if (y >= itemY && y <= itemY + itemHeight - 5) {
        const moveButtonX = leftPanelX + 360 - 200;
        const dropButtonX = leftPanelX + 360 - 110;
        if (x >= moveButtonX && x <= moveButtonX + 80 && y >= itemY + 5 && y <= itemY + 23) {
          return { type: 'moveSafeToUnsafe', index };
        }
        if (x >= dropButtonX && x <= dropButtonX + 50 && y >= itemY + 5 && y <= itemY + 23) {
          return { type: 'dropSafe', index };
        }
      }
    }

    // 检查右栏（普通区）
    const unsafeItems = bag.getUnsafeItems();
    for (let index = 0; index < unsafeItems.length; index++) {
      const itemY = startY + index * itemHeight;
      if (y >= itemY && y <= itemY + itemHeight - 5) {
        const moveButtonX = rightPanelX + 360 - 200;
        const dropButtonX = rightPanelX + 360 - 110;
        if (x >= moveButtonX && x <= moveButtonX + 80 && y >= itemY + 5 && y <= itemY + 23) {
          return { type: 'moveUnsafeToSafe', index };
        }
        if (x >= dropButtonX && x <= dropButtonX + 50 && y >= itemY + 5 && y <= itemY + 23) {
          return { type: 'dropUnsafe', index };
        }
      }
    }

    return { type: null };
  }

  /**
   * 渲染取舍弹窗
   */
  renderChoiceDialog(uiState: UIState, bag: Bag, _onDiscard: () => void, _onOpenBag: () => void): void {
    if (!uiState.showChoiceDialog || !uiState.pendingItem) return;

    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dialogWidth = 400;
    const dialogHeight = 250;

    // 绘制背景遮罩
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制弹窗背景
    this.ctx.save();
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(
      centerX - dialogWidth / 2,
      centerY - dialogHeight / 2,
      dialogWidth,
      dialogHeight
    );
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      centerX - dialogWidth / 2,
      centerY - dialogHeight / 2,
      dialogWidth,
      dialogHeight
    );
    this.ctx.restore();

    // 绘制文字
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `新物品：${uiState.pendingItem.name}(占格${uiState.pendingItem.size})`,
      centerX,
      centerY - 80
    );
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      `当前占用：安全 ${bag.usedSafe()}/${bag.getSafeCap()} | 普通 ${bag.usedUnsafe()}/${bag.getUnsafeCap()}`,
      centerX,
      centerY - 50
    );
    this.ctx.restore();

    // 绘制按钮区域（实际按钮点击在 Game.ts 中处理）
    this.ctx.save();
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(centerX - 180, centerY + 20, 150, 40);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('A: 丢弃新物品', centerX - 105, centerY + 45);
    
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(centerX + 30, centerY + 20, 150, 40);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('B: 打开背包取舍', centerX + 105, centerY + 45);
    this.ctx.textAlign = 'left';
    this.ctx.restore();
  }

  /**
   * 渲染背包取舍弹窗
   */
  renderBagDialog(
    uiState: UIState,
    bag: Bag,
    _onDrop: (index: number) => void,
    _onPickup: () => void,
    canPickup: boolean
  ): void {
    if (!uiState.showBagDialog || !uiState.pendingItem) return;

    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dialogWidth = 500;
    const dialogHeight = 400;

    // 绘制背景遮罩
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制弹窗背景
    this.ctx.save();
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(
      centerX - dialogWidth / 2,
      centerY - dialogHeight / 2,
      dialogWidth,
      dialogHeight
    );
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      centerX - dialogWidth / 2,
      centerY - dialogHeight / 2,
      dialogWidth,
      dialogHeight
    );
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `新物品：${uiState.pendingItem.name}(占格${uiState.pendingItem.size})`,
      centerX,
      centerY - 160
    );
    this.ctx.font = '16px Arial';
    this.ctx.fillText('普通区物品列表（点击数字键丢弃）', centerX, centerY - 120);
    this.ctx.restore();

    // 绘制普通区物品列表
    const items = bag.getUnsafeItems();
    items.forEach((item, index) => {
      const y = centerY - 80 + index * 35;
      this.ctx.save();
      this.ctx.fillStyle = '#4a4a4a';
      this.ctx.fillRect(centerX - 220, y - 15, 440, 30);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(
        `${index + 1}: ${item.name}(占格${item.size})`,
        centerX - 200,
        y + 5
      );
      this.ctx.fillStyle = '#ff6666';
      this.ctx.textAlign = 'right';
      this.ctx.fillText('丢弃', centerX + 200, y + 5);
      this.ctx.textAlign = 'left';
      this.ctx.restore();
    });

    // 绘制拾取按钮（如果可以拾取）
    if (canPickup) {
      this.ctx.save();
      this.ctx.fillStyle = '#4a90e2';
      this.ctx.fillRect(centerX - 100, centerY + 140, 200, 40);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('拾取新物品', centerX, centerY + 165);
      this.ctx.textAlign = 'left';
      this.ctx.restore();
    } else {
      this.ctx.save();
      this.ctx.fillStyle = '#666666';
      this.ctx.fillRect(centerX - 100, centerY + 140, 200, 40);
      this.ctx.fillStyle = '#999999';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('空间不足，请继续丢弃', centerX, centerY + 165);
      this.ctx.textAlign = 'left';
      this.ctx.restore();
    }
  }

  /**
   * 检查点击是否在按钮区域内（用于背包对话框）
   */
  checkBagDialogClick(x: number, y: number, bag: Bag, uiState: UIState): {
    type: 'drop' | 'pickup' | null;
    index?: number;
  } {
    if (!uiState.showBagDialog || !uiState.pendingItem) {
      return { type: null };
    }

    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const items = bag.getUnsafeItems();

    // 检查是否点击了丢弃按钮
    for (let index = 0; index < items.length; index++) {
      const itemY = centerY - 80 + index * 35;
      if (
        x >= centerX + 150 &&
        x <= centerX + 250 &&
        y >= itemY - 15 &&
        y <= itemY + 15
      ) {
        return { type: 'drop', index };
      }
    }

    // 检查是否点击了拾取按钮
    const canPickup = bag.canAddUnsafe(uiState.pendingItem);
    if (canPickup) {
      if (
        x >= centerX - 100 &&
        x <= centerX + 100 &&
        y >= centerY + 140 &&
        y <= centerY + 180
      ) {
        return { type: 'pickup' };
      }
    }

    return { type: null };
  }

  /**
   * 渲染读条 UI
   */
  renderChanneling(uiState: UIState): void {
    // 如果使用新 UI 系统，转发到 LoadingPanel
    if (this.useNewUI && this.uiManager && this.loadingPanel) {
      const progress = uiState.channelProgress;
      let typeText = '读条中';
      if (uiState.channelType === 'COLLECT_AURA') {
        typeText = '采集中';
      } else if (uiState.channelType === 'MOVE_TO_SAFE') {
        typeText = '转移中';
      } else if (uiState.channelType === 'EXTRACT') {
        typeText = '撤离中';
      } else if (uiState.channelType === 'PORTAL') {
        typeText = '传送中';
      }
      
      // 如果进度大于 0，显示读条面板
      if (progress > 0) {
        if (!this.loadingPanel.isOpen) {
          this.uiManager.open(this.loadingPanel, { layer: 'modal' });
        }
        this.loadingPanel.setProgress(progress, `${typeText} ${Math.round(progress * 100)}%`);
      } else {
        // 进度为 0，关闭面板
        if (this.loadingPanel.isOpen) {
          this.uiManager.close(this.loadingPanel);
        }
      }
      return;
    }

    // 旧实现（兼容）
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const barWidth = 300;
    const barHeight = 30;
    const progress = uiState.channelProgress;
    let typeText = '读条中';
    if (uiState.channelType === 'COLLECT_AURA') {
      typeText = '采集中';
    } else if (uiState.channelType === 'MOVE_TO_SAFE') {
      typeText = '转移中';
    } else if (uiState.channelType === 'EXTRACT') {
      typeText = '撤离中';
    } else if (uiState.channelType === 'PORTAL') {
      typeText = '传送中';
    }

    // 绘制背景遮罩
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制读条背景
    this.ctx.save();
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(
      centerX - barWidth / 2,
      centerY - barHeight / 2,
      barWidth,
      barHeight
    );
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      centerX - barWidth / 2,
      centerY - barHeight / 2,
      barWidth,
      barHeight
    );
    this.ctx.restore();

    // 绘制读条进度
    this.ctx.save();
    this.ctx.fillStyle = '#4a90e2';
    this.ctx.fillRect(
      centerX - barWidth / 2,
      centerY - barHeight / 2,
      barWidth * progress,
      barHeight
    );
    this.ctx.restore();

    // 绘制文字
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `${typeText} ${Math.round(progress * 100)}%`,
      centerX,
      centerY + 8
    );
    this.ctx.fillStyle = '#cccccc';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(
      '按 Esc 取消',
      centerX,
      centerY + 50
    );
    this.ctx.textAlign = 'left';
    this.ctx.restore();
  }

  /**
   * 渲染结算界面
   */
  renderResultScreen(uiState: UIState, onRestart: () => void): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const panelWidth = 600;
    const panelHeight = 500;

    // 绘制背景遮罩
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制面板背景
    this.ctx.save();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight
    );
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight
    );
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    const isSuccess = uiState.resultReason === 'SUCCESS';
    this.ctx.fillStyle = isSuccess ? '#00ff00' : '#ff0000';
    this.ctx.font = '28px Arial';
    this.ctx.textAlign = 'center';
    const titleText = isSuccess ? '撤离成功！' : '撤离失败';
    this.ctx.fillText(titleText, centerX, centerY - panelHeight / 2 + 40);
    
    // 绘制失败原因
    if (!isSuccess && uiState.resultReason) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '18px Arial';
      let reasonText = '';
      switch (uiState.resultReason) {
        case 'TIMEOUT':
          reasonText = '时间耗尽';
          break;
        case 'DEAD':
          reasonText = '生命值归零';
          break;
        case 'EXTRACT_INTERRUPTED':
          reasonText = '撤离被打断';
          break;
      }
      this.ctx.fillText(reasonText, centerX, centerY - panelHeight / 2 + 70);
    }
    this.ctx.restore();

    // 绘制带回物品列表
    let yOffset = centerY - panelHeight / 2 + 120;
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('带回物品：', centerX - panelWidth / 2 + 20, yOffset);
    this.ctx.restore();

    yOffset += 30;
    const allKeptItems = [...uiState.resultSafeItems, ...uiState.resultUnsafeItems];
    if (allKeptItems.length === 0) {
      this.ctx.save();
      this.ctx.fillStyle = '#999999';
      this.ctx.font = '14px Arial';
      this.ctx.fillText('（无）', centerX - panelWidth / 2 + 40, yOffset);
      this.ctx.restore();
    } else {
      allKeptItems.forEach((item, index) => {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
          `${index + 1}. ${item.name} (占格${item.size})`,
          centerX - panelWidth / 2 + 40,
          yOffset + index * 25
        );
        this.ctx.restore();
      });
      yOffset += allKeptItems.length * 25;
    }

    // 绘制丢失物品列表（仅失败时）
    if (!isSuccess && uiState.resultLostItems.length > 0) {
      yOffset += 20;
      this.ctx.save();
      this.ctx.fillStyle = '#ff6666';
      this.ctx.font = '18px Arial';
      this.ctx.fillText('丢失物品：', centerX - panelWidth / 2 + 20, yOffset);
      this.ctx.restore();

      yOffset += 30;
      uiState.resultLostItems.forEach((item, index) => {
        this.ctx.save();
        this.ctx.fillStyle = '#ff9999';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(
          `${index + 1}. ${item.name} (占格${item.size})`,
          centerX - panelWidth / 2 + 40,
          yOffset + index * 25
        );
        this.ctx.restore();
      });
    }

    // 绘制重新开始按钮
    const buttonY = centerY + panelHeight / 2 - 60;
    this.ctx.save();
    this.ctx.fillStyle = '#4a90e2';
    this.ctx.fillRect(centerX - 100, buttonY, 200, 40);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('重新开始', centerX, buttonY + 28);
    this.ctx.restore();

    // 检查点击重新开始按钮（使用一次性监听器）
    const clickHandler = (e: MouseEvent) => {
      const canvasRect = this.canvas.getBoundingClientRect();
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;
      if (x >= centerX - 100 && x <= centerX + 100 && y >= buttonY && y <= buttonY + 40) {
        this.canvas.removeEventListener('click', clickHandler);
        onRestart();
      }
    };
    this.canvas.addEventListener('click', clickHandler);
  }
}
