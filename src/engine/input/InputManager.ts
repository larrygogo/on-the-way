import { ConfigManager } from '../../core/config/ConfigManager';

/**
 * 输入动作类型
 */
export type InputAction = 
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'interact'
  | 'inventory'
  | 'cancel'
  | 'debug'
  | 'attack';

/**
 * 输入状态
 */
export interface InputState {
  keys: Set<string>;
  mouse: {
    x: number;
    y: number;
    buttons: Set<number>;
  };
  touch: {
    active: boolean;
    x: number;
    y: number;
  };
}

/**
 * 输入管理器
 * 统一管理键盘、鼠标和触摸输入，支持输入映射
 */
export class InputManager {
  private configManager: ConfigManager;
  private keyBindings: Map<InputAction, string> = new Map();
  private keyStates: Map<string, boolean> = new Map();
  private actionStates: Map<InputAction, boolean> = new Map();
  private mouseState: { x: number; y: number; buttons: Set<number> } = {
    x: 0,
    y: 0,
    buttons: new Set()
  };
  private touchState: { active: boolean; x: number; y: number } = {
    active: false,
    x: 0,
    y: 0
  };
  private listeners: Map<InputAction, Set<() => void>> = new Map();

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.loadKeyBindings();
    this.setupEventListeners();
  }

  /**
   * 从配置加载按键绑定
   */
  private loadKeyBindings(): void {
    const settings = this.configManager.getCategory('input');
    const bindings = settings.keyBindings;

    // 默认绑定
    const defaultBindings: Record<InputAction, string> = {
      moveUp: 'KeyW',
      moveDown: 'KeyS',
      moveLeft: 'KeyA',
      moveRight: 'KeyD',
      interact: 'KeyE',
      inventory: 'KeyI',
      cancel: 'Escape',
      debug: 'F1',
      attack: 'Space'
    };

    // 加载配置或使用默认值
    for (const [action, defaultKey] of Object.entries(defaultBindings)) {
      const key = bindings[action] || defaultKey;
      this.keyBindings.set(action as InputAction, key);
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 键盘事件
    window.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKeyUp(e);
    });

    // 鼠标事件
    window.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    window.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
    });

    window.addEventListener('mouseup', (e) => {
      this.handleMouseUp(e);
    });

    // 触摸事件
    window.addEventListener('touchstart', (e) => {
      this.handleTouchStart(e);
    });

    window.addEventListener('touchmove', (e) => {
      this.handleTouchMove(e);
    });

    window.addEventListener('touchend', (e) => {
      this.handleTouchEnd(e);
    });
  }

  /**
   * 处理按键按下
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    this.keyStates.set(code, true);

    // 更新动作状态
    for (const [action, key] of this.keyBindings.entries()) {
      if (key === code) {
        const wasPressed = this.actionStates.get(action) || false;
        this.actionStates.set(action, true);
        
        // 如果从未按下变为按下，触发监听器
        if (!wasPressed) {
          this.notifyAction(action);
        }
      }
    }
  }

  /**
   * 处理按键释放
   */
  private handleKeyUp(e: KeyboardEvent): void {
    const code = e.code;
    this.keyStates.set(code, false);

    // 更新动作状态
    for (const [action, key] of this.keyBindings.entries()) {
      if (key === code) {
        this.actionStates.set(action, false);
      }
    }
  }

  /**
   * 处理鼠标移动
   */
  private handleMouseMove(e: MouseEvent): void {
    this.mouseState.x = e.clientX;
    this.mouseState.y = e.clientY;
  }

  /**
   * 处理鼠标按下
   */
  private handleMouseDown(e: MouseEvent): void {
    this.mouseState.buttons.add(e.button);
  }

  /**
   * 处理鼠标释放
   */
  private handleMouseUp(e: MouseEvent): void {
    this.mouseState.buttons.delete(e.button);
  }

  /**
   * 处理触摸开始
   */
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchState.active = true;
      this.touchState.x = touch.clientX;
      this.touchState.y = touch.clientY;
    }
  }

  /**
   * 处理触摸移动
   */
  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchState.x = touch.clientX;
      this.touchState.y = touch.clientY;
    }
  }

  /**
   * 处理触摸结束
   */
  private handleTouchEnd(e: TouchEvent): void {
    this.touchState.active = false;
  }

  /**
   * 通知动作监听器
   */
  private notifyAction(action: InputAction): void {
    const listeners = this.listeners.get(action);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener();
        } catch (error) {
          console.error(`[InputManager] 动作监听器执行错误 (${action}):`, error);
        }
      });
    }
  }

  /**
   * 检查动作是否被按下
   */
  isActionPressed(action: InputAction): boolean {
    return this.actionStates.get(action) || false;
  }

  /**
   * 检查按键是否被按下
   */
  isKeyPressed(keyCode: string): boolean {
    return this.keyStates.get(keyCode) || false;
  }

  /**
   * 获取鼠标状态
   */
  getMouseState(): { x: number; y: number; buttons: Set<number> } {
    return {
      x: this.mouseState.x,
      y: this.mouseState.y,
      buttons: new Set(this.mouseState.buttons)
    };
  }

  /**
   * 获取触摸状态
   */
  getTouchState(): { active: boolean; x: number; y: number } {
    return { ...this.touchState };
  }

  /**
   * 订阅动作事件
   * @param action 动作
   * @param listener 监听器
   * @returns 取消订阅的函数
   */
  onAction(action: InputAction, listener: () => void): () => void {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set());
    }
    this.listeners.get(action)!.add(listener);

    return () => {
      this.offAction(action, listener);
    };
  }

  /**
   * 取消订阅动作事件
   */
  offAction(action: InputAction, listener: () => void): void {
    const listeners = this.listeners.get(action);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(action);
      }
    }
  }

  /**
   * 重新绑定按键
   * @param action 动作
   * @param keyCode 按键代码
   */
  rebindKey(action: InputAction, keyCode: string): void {
    this.keyBindings.set(action, keyCode);
    
    // 更新配置
    const settings = this.configManager.getCategory('input');
    const newBindings = { ...settings.keyBindings, [action]: keyCode };
    this.configManager.updateCategory('input', { keyBindings: newBindings });
  }

  /**
   * 获取按键绑定
   */
  getKeyBinding(action: InputAction): string | undefined {
    return this.keyBindings.get(action);
  }

  /**
   * 获取所有按键绑定
   */
  getAllKeyBindings(): Map<InputAction, string> {
    return new Map(this.keyBindings);
  }

  /**
   * 重置为默认绑定
   */
  resetKeyBindings(): void {
    this.loadKeyBindings();
  }

  /**
   * 清除所有状态
   */
  clear(): void {
    this.keyStates.clear();
    this.actionStates.clear();
    this.mouseState.buttons.clear();
    this.touchState.active = false;
  }
}