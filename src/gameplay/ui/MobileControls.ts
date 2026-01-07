/**
 * 移动端控制按钮类型
 */
export type MobileButtonType = 'INTERACT' | 'ATTACK' | 'BAG' | 'CANCEL';

/**
 * 按钮状态
 */
export interface ButtonState {
  pressed: boolean; // 单帧触发
}

/**
 * 移动端控制状态
 */
export interface MobileControlsState {
  joystickActive: boolean;
  joystickCenterX: number;
  joystickCenterY: number;
  joystickCurrentX: number;
  joystickCurrentY: number;
  moveVecX: number; // -1 到 1
  moveVecY: number; // -1 到 1
  buttons: Map<MobileButtonType, ButtonState>;
}

/**
 * 移动端控制回调
 */
export interface MobileControlsCallbacks {
  onInteract?: () => void;
  onAttack?: () => void;
  onBag?: () => void;
  onCancel?: () => void;
}

/**
 * 移动端控制类
 * 管理虚拟摇杆和按钮的触摸输入
 */
export class MobileControls {
  private state: MobileControlsState;
  private callbacks: MobileControlsCallbacks;
  private canvas: HTMLCanvasElement;
  private activeTouchId: number | null = null; // 当前激活的触摸ID（摇杆或按钮）
  private joystickTouchId: number | null = null; // 摇杆的触摸ID
  private buttonTouchIds: Map<MobileButtonType, number> = new Map(); // 按钮的触摸ID

  // 摇杆参数
  private readonly joystickBaseRadius = 60;
  private readonly joystickHeadRadius = 28;
  private readonly joystickMaxOffset = 50;

  // 按钮参数
  private readonly buttonSize = 64;
  private readonly buttonHitSize = 72; // 点击热区
  private readonly buttonSpacing = 12;
  private readonly buttonOffset = 90; // 距离边缘的偏移

  constructor(canvas: HTMLCanvasElement, callbacks: MobileControlsCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    
    // 初始化摇杆中心位置
    const center = this.getJoystickCenter();
    this.state = {
      joystickActive: false,
      joystickCenterX: center.x,
      joystickCenterY: center.y,
      joystickCurrentX: center.x,
      joystickCurrentY: center.y,
      moveVecX: 0,
      moveVecY: 0,
      buttons: new Map([
        ['INTERACT', { pressed: false }],
        ['ATTACK', { pressed: false }],
        ['BAG', { pressed: false }],
        ['CANCEL', { pressed: false }]
      ])
    };

    this.setupTouchEvents();
  }

  /**
   * 设置触摸事件监听
   */
  private setupTouchEvents(): void {
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
  }

  /**
   * 获取 Safe Area 值
   */
  private getSafeArea(): { top: number; right: number; bottom: number; left: number } {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(rootStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
      right: parseInt(rootStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
      bottom: parseInt(rootStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
      left: parseInt(rootStyle.getPropertyValue('--safe-area-inset-left') || '0', 10)
    };
  }

  /**
   * 计算摇杆中心位置
   */
  private getJoystickCenter(): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const safeArea = this.getSafeArea();
    return {
      x: safeArea.left + this.buttonOffset,
      y: rect.height - safeArea.bottom - this.buttonOffset
    };
  }

  /**
   * 计算按钮区域
   */
  private getButtonPositions(): Map<MobileButtonType, { x: number; y: number }> {
    const rect = this.canvas.getBoundingClientRect();
    const safeArea = this.getSafeArea();
    const anchorX = rect.width - safeArea.right - this.buttonOffset;
    const anchorY = rect.height - safeArea.bottom - this.buttonOffset;
    const buttonHalfSize = this.buttonSize / 2;
    const spacing = this.buttonSpacing;

    const positions = new Map<MobileButtonType, { x: number; y: number }>();
    // 2x2 布局：取消(左上)、攻击(右上)、背包(左下)、交互(右下)
    positions.set('CANCEL', {
      x: anchorX - buttonHalfSize - spacing - buttonHalfSize,
      y: anchorY - buttonHalfSize - spacing - buttonHalfSize
    });
    positions.set('ATTACK', {
      x: anchorX - buttonHalfSize,
      y: anchorY - buttonHalfSize - spacing - buttonHalfSize
    });
    positions.set('BAG', {
      x: anchorX - buttonHalfSize - spacing - buttonHalfSize,
      y: anchorY - buttonHalfSize
    });
    positions.set('INTERACT', {
      x: anchorX - buttonHalfSize,
      y: anchorY - buttonHalfSize
    });

    return positions;
  }

  /**
   * 检查触摸点是否在摇杆区域内
   */
  private isInJoystickArea(x: number, y: number): boolean {
    const center = this.getJoystickCenter();
    const dx = x - center.x;
    const dy = y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.joystickBaseRadius + 20; // 增加一些容差
  }

  /**
   * 检查触摸点是否在按钮区域内
   */
  private getButtonAtPosition(x: number, y: number): MobileButtonType | null {
    const positions = this.getButtonPositions();
    const hitRadius = this.buttonHitSize / 2;

    for (const [type, pos] of positions.entries()) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= hitRadius) {
        return type;
      }
    }

    return null;
  }

  /**
   * 处理触摸开始
   */
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // 检查是否在按钮区域
      const buttonType = this.getButtonAtPosition(x, y);
      if (buttonType) {
        const buttonState = this.state.buttons.get(buttonType);
        if (buttonState) {
          buttonState.pressed = true;
          this.buttonTouchIds.set(buttonType, touch.identifier);
          this.activeTouchId = touch.identifier;
          
          // 触发按钮回调
          this.triggerButtonCallback(buttonType);
          continue;
        }
      }

      // 检查是否在摇杆区域（且没有其他触摸占用）
      if (this.isInJoystickArea(x, y) && this.joystickTouchId === null) {
        const center = this.getJoystickCenter();
        this.state.joystickActive = true;
        this.state.joystickCenterX = center.x;
        this.state.joystickCenterY = center.y;
        this.state.joystickCurrentX = center.x;
        this.state.joystickCurrentY = center.y;
        this.joystickTouchId = touch.identifier;
        this.activeTouchId = touch.identifier;
        this.updateJoystickPosition(x, y);
      }
    }
  }

  /**
   * 处理触摸移动
   */
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    // 更新摇杆位置
    if (this.joystickTouchId !== null) {
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === this.joystickTouchId) {
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          this.updateJoystickPosition(x, y);
          break;
        }
      }
    }
  }

  /**
   * 处理触摸结束
   */
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    // 检查结束的触摸
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];

      // 重置摇杆
      if (touch.identifier === this.joystickTouchId) {
        this.state.joystickActive = false;
        this.state.joystickCurrentX = this.state.joystickCenterX;
        this.state.joystickCurrentY = this.state.joystickCenterY;
        this.state.moveVecX = 0;
        this.state.moveVecY = 0;
        this.joystickTouchId = null;
      }

      // 重置按钮（不需要清除 pressed，因为它是单帧的）
      for (const [type, touchId] of this.buttonTouchIds.entries()) {
        if (touch.identifier === touchId) {
          this.buttonTouchIds.delete(type);
        }
      }
    }

    // 如果没有活动的触摸，清除 activeTouchId
    if (e.touches.length === 0) {
      this.activeTouchId = null;
    }
  }

  /**
   * 更新摇杆位置
   */
  private updateJoystickPosition(x: number, y: number): void {
    const dx = x - this.state.joystickCenterX;
    const dy = y - this.state.joystickCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 限制在最大偏移范围内
    const clampedDistance = Math.min(distance, this.joystickMaxOffset);
    const angle = Math.atan2(dy, dx);

    // 计算摇杆头位置
    this.state.joystickCurrentX = this.state.joystickCenterX + clampedDistance * Math.cos(angle);
    this.state.joystickCurrentY = this.state.joystickCenterY + clampedDistance * Math.sin(angle);

    // 计算移动向量 (clamp 到 [-1, 1])
    this.state.moveVecX = (clampedDistance / this.joystickMaxOffset) * Math.cos(angle);
    this.state.moveVecY = (clampedDistance / this.joystickMaxOffset) * Math.sin(angle);
  }

  /**
   * 触发按钮回调
   */
  private triggerButtonCallback(type: MobileButtonType): void {
    switch (type) {
      case 'INTERACT':
        this.callbacks.onInteract?.();
        break;
      case 'ATTACK':
        this.callbacks.onAttack?.();
        break;
      case 'BAG':
        this.callbacks.onBag?.();
        break;
      case 'CANCEL':
        this.callbacks.onCancel?.();
        break;
    }
  }

  /**
   * 获取移动向量
   */
  getMoveVector(): { x: number; y: number } {
    return {
      x: this.state.moveVecX,
      y: this.state.moveVecY
    };
  }

  /**
   * 获取摇杆状态（用于渲染）
   */
  getJoystickState(): {
    active: boolean;
    centerX: number;
    centerY: number;
    currentX: number;
    currentY: number;
    baseRadius: number;
    headRadius: number;
  } {
    // 如果摇杆未激活，使用计算出的中心位置
    const center = this.getJoystickCenter();
    const centerX = this.state.joystickActive ? this.state.joystickCenterX : center.x;
    const centerY = this.state.joystickActive ? this.state.joystickCenterY : center.y;
    const currentX = this.state.joystickActive ? this.state.joystickCurrentX : centerX;
    const currentY = this.state.joystickActive ? this.state.joystickCurrentY : centerY;

    return {
      active: this.state.joystickActive,
      centerX,
      centerY,
      currentX,
      currentY,
      baseRadius: this.joystickBaseRadius,
      headRadius: this.joystickHeadRadius
    };
  }

  /**
   * 获取按钮状态（用于渲染）
   */
  getButtonStates(): Map<MobileButtonType, ButtonState> {
    return this.state.buttons;
  }

  /**
   * 获取按钮位置（用于渲染）
   */
  getButtonPositionsForRender(): Map<MobileButtonType, { x: number; y: number }> {
    return this.getButtonPositions();
  }

  /**
   * 获取按钮尺寸
   */
  getButtonSize(): number {
    return this.buttonSize;
  }

  /**
   * 更新状态（每帧调用，清除单帧状态）
   */
  update(): void {
    // 清除所有按钮的 pressed 状态（单帧触发）
    for (const buttonState of this.state.buttons.values()) {
      buttonState.pressed = false;
    }
  }

  /**
   * 检查按钮是否被按下（单帧）
   */
  isButtonPressed(type: MobileButtonType): boolean {
    return this.state.buttons.get(type)?.pressed ?? false;
  }

  /**
   * 设置摇杆是否可用
   */
  setJoystickEnabled(enabled: boolean): void {
    if (!enabled && this.state.joystickActive) {
      // 禁用时重置摇杆
      this.state.joystickActive = false;
      this.state.joystickCurrentX = this.state.joystickCenterX;
      this.state.joystickCurrentY = this.state.joystickCenterY;
      this.state.moveVecX = 0;
      this.state.moveVecY = 0;
      this.joystickTouchId = null;
    }
  }
}

