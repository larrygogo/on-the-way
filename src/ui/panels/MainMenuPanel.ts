import { UIPanel } from '../core/UIPanel';
import { UIButton } from '../components/UIButton';
import { UIText } from '../components/UIText';
import { UIElement } from '../core/UIElement';
import { LayoutState } from '../core/Layout';
import { PlayerProfile } from '../../gameplay/state/PlayerProfile';

/**
 * 主菜单页面类型
 */
export type MainMenuPage = 'HOME' | 'START' | 'CULTIVATION' | 'STASH' | 'SETTINGS' | 'RESULT_SUMMARY';

/**
 * 主菜单面板
 */
export class MainMenuPanel extends UIPanel {
  // HOME 页面元素
  private titleText: UIText;
  private versionText: UIText;
  private profileText: UIText;
  private startButton: UIButton;
  private cultivationButton: UIButton;
  private stashButton: UIButton;
  private settingsButton: UIButton;

  // 回调
  private onStartClick?: () => void;
  private onCultivationClick?: () => void;
  private onStashClick?: () => void;
  private onSettingsClick?: () => void;

  constructor(layoutState: LayoutState, profile: PlayerProfile) {
    super('main-menu');

    // 使用 safeRect 居中布局
    const { safeRect } = layoutState;
    this.width = 1280;
    this.height = 720;
    this.x = 0;
    this.y = 0;

    // 创建背景（全屏）
    const background = new UIElement();
    background.width = this.width;
    background.height = this.height;
    background.x = 0;
    background.y = 0;
    background.interactive = false;
    const originalRender = background.render.bind(background);
    background.render = (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
      originalRender(ctx);
    };
    this.addChild(background);

    // 创建标题
    this.titleText = new UIText('在途中');
    this.titleText.fontSize = 48;
    this.titleText.color = '#ffffff';
    this.titleText.align = 'center';
    this.titleText.baseline = 'top';
    this.titleText.width = this.width;
    this.titleText.height = 60;
    this.titleText.x = 0;
    this.titleText.y = safeRect.y + 100;
    this.addChild(this.titleText);

    // 创建版本号
    this.versionText = new UIText('v1.0.0');
    this.versionText.fontSize = 14;
    this.versionText.color = '#999999';
    this.versionText.align = 'center';
    this.versionText.baseline = 'top';
    this.versionText.width = this.width;
    this.versionText.height = 20;
    this.versionText.x = 0;
    this.versionText.y = safeRect.y + 160;
    this.addChild(this.versionText);

    // 创建角色信息
    this.profileText = new UIText(`等级: ${profile.level}  修炼点: ${profile.unspentPoints}`);
    this.profileText.fontSize = 18;
    this.profileText.color = '#ffffff';
    this.profileText.align = 'center';
    this.profileText.baseline = 'top';
    this.profileText.width = this.width;
    this.profileText.height = 30;
    this.profileText.x = 0;
    this.profileText.y = safeRect.y + 200;
    this.addChild(this.profileText);

    // 创建开始按钮
    this.startButton = new UIButton('开始游戏');
    this.startButton.width = 250;
    this.startButton.height = 60;
    // 按钮应该相对于整个设计分辨率空间居中，而不是 safeRect
    this.startButton.x = (this.width - this.startButton.width) / 2;
    this.startButton.y = (this.height - this.startButton.height * 4 - 30 * 3) / 2;
    this.startButton.hitSlop = 10;
    this.startButton.onClick = () => {
      this.onStartClick?.();
    };
    this.addChild(this.startButton);

    // 创建修炼按钮
    this.cultivationButton = new UIButton('修炼');
    this.cultivationButton.width = 250;
    this.cultivationButton.height = 60;
    this.cultivationButton.x = (this.width - this.cultivationButton.width) / 2;
    this.cultivationButton.y = this.startButton.y + this.startButton.height + 30;
    this.cultivationButton.hitSlop = 10;
    this.cultivationButton.onClick = () => {
      this.onCultivationClick?.();
    };
    this.addChild(this.cultivationButton);

    // 创建储物袋按钮
    this.stashButton = new UIButton('储物袋');
    this.stashButton.width = 250;
    this.stashButton.height = 60;
    this.stashButton.x = (this.width - this.stashButton.width) / 2;
    this.stashButton.y = this.cultivationButton.y + this.cultivationButton.height + 30;
    this.stashButton.hitSlop = 10;
    this.stashButton.onClick = () => {
      this.onStashClick?.();
    };
    this.addChild(this.stashButton);

    // 创建设置按钮
    this.settingsButton = new UIButton('设置');
    this.settingsButton.width = 250;
    this.settingsButton.height = 60;
    this.settingsButton.x = (this.width - this.settingsButton.width) / 2;
    this.settingsButton.y = this.stashButton.y + this.stashButton.height + 30;
    this.settingsButton.hitSlop = 10;
    this.settingsButton.onClick = () => {
      this.onSettingsClick?.();
    };
    this.addChild(this.settingsButton);
  }

  /**
   * 设置开始按钮点击回调
   */
  setOnStartClick(callback: () => void): void {
    this.onStartClick = callback;
  }

  /**
   * 设置修炼按钮点击回调
   */
  setOnCultivationClick(callback: () => void): void {
    this.onCultivationClick = callback;
  }

  /**
   * 设置储物袋按钮点击回调
   */
  setOnStashClick(callback: () => void): void {
    this.onStashClick = callback;
  }

  /**
   * 设置设置按钮点击回调
   */
  setOnSettingsClick(callback: () => void): void {
    this.onSettingsClick = callback;
  }

  /**
   * 更新角色信息显示
   */
  updateProfile(profile: PlayerProfile): void {
    this.profileText.setText(`等级: ${profile.level}  修炼点: ${profile.unspentPoints}`);
  }

  /**
   * 更新布局（当窗口大小改变时）
   */
  updateLayout(layoutState: LayoutState): void {
    // 按钮应该相对于整个设计分辨率空间居中，不需要更新
    // 标题等文本元素可以保持使用 safeRect
    const { safeRect } = layoutState;
    
    // 更新标题位置
    this.titleText.y = safeRect.y + 100;
    this.versionText.y = safeRect.y + 160;
    this.profileText.y = safeRect.y + 200;
    
    // 按钮位置不需要更新（已经相对于设计分辨率空间居中）
  }

  /**
   * 显示/隐藏 HOME 页面元素
   */
  setHomePageVisible(visible: boolean): void {
    this.titleText.visible = visible;
    this.versionText.visible = visible;
    this.profileText.visible = visible;
    this.startButton.visible = visible;
    this.cultivationButton.visible = visible;
    this.stashButton.visible = visible;
    this.settingsButton.visible = visible;
  }
}
