import { UIElement } from './UIElement';

/**
 * UI 层级容器
 * Layer 只负责容器语义，不包含业务逻辑
 */
export class UILayer extends UIElement {
  /** 层级名称 */
  name: string;
  /** Z 索引（用于排序） */
  zIndex: number;
  /** 是否启用 */
  enabled: boolean;
  /** 是否阻止下层输入 */
  blockInputBelow: boolean;

  constructor(name: string, zIndex: number = 0) {
    super();
    this.name = name;
    this.zIndex = zIndex;
    this.enabled = true;
    this.blockInputBelow = false;
    
    // Layer 默认填充整个设计分辨率空间
    this.width = 1280;
    this.height = 720;
  }
}
