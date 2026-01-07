import { PlayerProfile } from '../state/PlayerProfile';
import { ItemInstance } from '../entities/Item';
import { UIState } from './UI';
import { DungeonConfig } from '../../content/config/DungeonConfig';

/**
 * 按钮点击结果
 */
export interface ButtonClickResult {
  type: 'button' | 'item' | 'scroll' | null;
  buttonId?: string;
  itemIndex?: number;
  scrollDelta?: number;
}

/**
 * 主界面 UI 渲染器
 */
export class MainMenuUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // 滚动状态
  private startPageScrollY: number = 0;
  private stashPageScrollY: number = 0;
  private readonly scrollSpeed: number = 20;
  private readonly itemHeight: number = 60;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = context;
  }

  /**
   * 检测是否为移动端
   */
  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }


  /**
   * 绘制按钮
   */
  private drawButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    enabled: boolean = true,
    fontSize: number = 18
  ): void {
    const minSize = 44; // 手机按钮最小热区
    const actualWidth = Math.max(width, minSize);
    const actualHeight = Math.max(height, minSize);
    
    this.ctx.save();
    
    if (enabled) {
      this.ctx.fillStyle = '#4a90e2';
      this.ctx.fillRect(x, y, actualWidth, actualHeight);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, actualWidth, actualHeight);
      this.ctx.fillStyle = '#ffffff';
    } else {
      this.ctx.fillStyle = '#666666';
      this.ctx.fillRect(x, y, actualWidth, actualHeight);
      this.ctx.fillStyle = '#999999';
    }
    
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + actualWidth / 2, y + actualHeight / 2);
    
    this.ctx.restore();
  }

  /**
   * 检查点是否在按钮内
   */
  private isPointInButton(
    x: number,
    y: number,
    buttonX: number,
    buttonY: number,
    buttonWidth: number,
    buttonHeight: number
  ): boolean {
    const minSize = 44;
    const actualWidth = Math.max(buttonWidth, minSize);
    const actualHeight = Math.max(buttonHeight, minSize);
    return x >= buttonX && x <= buttonX + actualWidth &&
           y >= buttonY && y <= buttonY + actualHeight;
  }

  /**
   * 渲染 HOME 页面
   */
  renderHomePage(profile: PlayerProfile, version: string = '1.0.0'): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const isMobile = this.isMobile();

    // 绘制背景
    this.ctx.save();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = isMobile ? '32px Arial' : '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('在途中', centerX, centerY - 200);
    
    // 版本号
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#999999';
    this.ctx.fillText(`v${version}`, centerX, centerY - 160);
    this.ctx.restore();

    // 显示角色信息
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`等级: ${profile.level}`, centerX, centerY - 100);
    this.ctx.fillText(`修炼点: ${profile.unspentPoints}`, centerX, centerY - 70);
    this.ctx.restore();

    // 绘制按钮
    const buttonWidth = isMobile ? 200 : 250;
    const buttonHeight = isMobile ? 50 : 60;
    const buttonSpacing = isMobile ? 70 : 80;
    let buttonY = centerY;

    // 开始游戏
    this.drawButton(
      centerX - buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      '开始游戏',
      true,
      isMobile ? 16 : 18
    );

    // 修炼
    buttonY += buttonSpacing;
    this.drawButton(
      centerX - buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      '修炼',
      true,
      isMobile ? 16 : 18
    );

    // 储物袋
    buttonY += buttonSpacing;
    this.drawButton(
      centerX - buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      '储物袋',
      true,
      isMobile ? 16 : 18
    );

    // 设置
    buttonY += buttonSpacing;
    this.drawButton(
      centerX - buttonWidth / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      '设置',
      true,
      isMobile ? 16 : 18
    );
  }

  /**
   * 检查 HOME 页面点击
   */
  checkHomePageClick(x: number, y: number): ButtonClickResult {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const isMobile = this.isMobile();
    const buttonWidth = isMobile ? 200 : 250;
    const buttonHeight = isMobile ? 50 : 60;
    const buttonSpacing = isMobile ? 70 : 80;
    let buttonY = centerY;

    // 开始游戏
    if (this.isPointInButton(x, y, centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight)) {
      return { type: 'button', buttonId: 'start' };
    }

    // 修炼
    buttonY += buttonSpacing;
    if (this.isPointInButton(x, y, centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight)) {
      return { type: 'button', buttonId: 'cultivation' };
    }

    // 储物袋
    buttonY += buttonSpacing;
    if (this.isPointInButton(x, y, centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight)) {
      return { type: 'button', buttonId: 'stash' };
    }

    // 设置
    buttonY += buttonSpacing;
    if (this.isPointInButton(x, y, centerX - buttonWidth / 2, buttonY, buttonWidth, buttonHeight)) {
      return { type: 'button', buttonId: 'settings' };
    }

    return { type: null };
  }

  /**
   * 渲染 START 页面
   */
  renderStartPage(
    dungeons: Array<{ id: string; config: DungeonConfig }>,
    selectedIndex: number
  ): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const isMobile = this.isMobile();

    // 绘制背景
    this.ctx.save();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = isMobile ? '28px Arial' : '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('选择秘境', centerX, 50);
    this.ctx.restore();

    // 绘制秘境列表（可滚动）
    const listStartY = 100;
    const listItemHeight = isMobile ? 80 : 100;
    const visibleItems = Math.floor((rect.height - listStartY - 150) / listItemHeight);
    const maxScroll = Math.max(0, dungeons.length - visibleItems);
    const scrollY = Math.min(this.startPageScrollY, maxScroll);
    const startIndex = Math.floor(scrollY);
    const endIndex = Math.min(startIndex + visibleItems + 1, dungeons.length);

    for (let i = startIndex; i < endIndex; i++) {
      const dungeon = dungeons[i];
      const itemY = listStartY + (i - startIndex) * listItemHeight - (scrollY % 1) * listItemHeight;
      
      if (itemY < listStartY - listItemHeight || itemY > rect.height - 150) {
        continue; // 不在可见区域
      }

      const isSelected = i === selectedIndex;
      
      // 绘制背景
      this.ctx.save();
      this.ctx.fillStyle = isSelected ? '#4a90e2' : '#2a2a2a';
      this.ctx.fillRect(centerX - 300, itemY, 600, listItemHeight - 10);
      this.ctx.strokeStyle = isSelected ? '#ffffff' : '#666666';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(centerX - 300, itemY, 600, listItemHeight - 10);
      this.ctx.restore();

      // 绘制秘境信息
      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(dungeon.config.dungeonId, centerX - 280, itemY + 25);
      this.ctx.font = '14px Arial';
      this.ctx.fillStyle = '#cccccc';
      this.ctx.fillText(
        `入口: ${dungeon.config.entryMapId} | 地图数: ${dungeon.config.maps.length}`,
        centerX - 280,
        itemY + 50
      );
      this.ctx.restore();
    }

    // 绘制规则摘要（选中秘境时）
    if (selectedIndex >= 0 && selectedIndex < dungeons.length) {
      const selectedDungeon = dungeons[selectedIndex];
      const summaryY = rect.height - 200;
      
      this.ctx.save();
      this.ctx.fillStyle = '#2a2a2a';
      this.ctx.fillRect(centerX - 300, summaryY, 600, 120);
      this.ctx.strokeStyle = '#666666';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(centerX - 300, summaryY, 600, 120);
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`允许回溯: ${selectedDungeon.config.rules.allowBacktrack ? '是' : '否'}`, centerX - 280, summaryY + 25);
      if (selectedDungeon.config.rules.maxDepth) {
        this.ctx.fillText(`最大深度: ${selectedDungeon.config.rules.maxDepth}`, centerX - 280, summaryY + 50);
      }
      this.ctx.restore();
    }

    // 绘制按钮
    const buttonY = rect.height - 60;
    this.drawButton(centerX - 150, buttonY, 120, 40, '进入', selectedIndex >= 0, 16);
    this.drawButton(centerX + 30, buttonY, 120, 40, '返回', true, 16);
  }

  /**
   * 检查 START 页面点击
   */
  checkStartPageClick(
    x: number,
    y: number,
    dungeons: Array<{ id: string; config: DungeonConfig }>
  ): ButtonClickResult {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const isMobile = this.isMobile();
    const listStartY = 100;
    const listItemHeight = isMobile ? 80 : 100;
    const visibleItems = Math.floor((rect.height - listStartY - 150) / listItemHeight);
    const maxScroll = Math.max(0, dungeons.length - visibleItems);
    const scrollY = Math.min(this.startPageScrollY, maxScroll);
    const startIndex = Math.floor(scrollY);
    const endIndex = Math.min(startIndex + visibleItems + 1, dungeons.length);

    // 检查列表项点击
    for (let i = startIndex; i < endIndex; i++) {
      const itemY = listStartY + (i - startIndex) * listItemHeight - (scrollY % 1) * listItemHeight;
      if (y >= itemY && y <= itemY + listItemHeight - 10 &&
          x >= centerX - 300 && x <= centerX + 300) {
        return { type: 'item', itemIndex: i };
      }
    }

    // 检查按钮
    const buttonY = rect.height - 60;
    if (this.isPointInButton(x, y, centerX - 150, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'enter' };
    }
    if (this.isPointInButton(x, y, centerX + 30, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'back' };
    }

    return { type: null };
  }

  /**
   * 更新 START 页面滚动
   */
  updateStartPageScroll(delta: number, dungeons: Array<{ id: string; config: DungeonConfig }>): void {
    const rect = this.canvas.getBoundingClientRect();
    const listStartY = 100;
    const isMobile = this.isMobile();
    const listItemHeight = isMobile ? 80 : 100;
    const visibleItems = Math.floor((rect.height - listStartY - 150) / listItemHeight);
    const maxScroll = Math.max(0, dungeons.length - visibleItems);
    
    this.startPageScrollY = Math.max(0, Math.min(this.startPageScrollY + delta * this.scrollSpeed, maxScroll));
  }

  /**
   * 渲染 CULTIVATION 页面
   */
  renderCultivationPage(
    _profile: PlayerProfile,
    tempAttrs: { atk: number; hp: number; move: number },
    tempUnspentPoints: number
  ): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const isMobile = this.isMobile();

    // 绘制背景
    this.ctx.save();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = isMobile ? '28px Arial' : '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('修炼', centerX, 50);
    this.ctx.restore();

    // 显示可用修炼点
    this.ctx.save();
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`可用修炼点: ${tempUnspentPoints}`, centerX, 100);
    this.ctx.restore();

    // 绘制属性分配
    const attrStartY = 150;
    const attrSpacing = isMobile ? 70 : 80;
    const attrNames = ['攻击力', '生命值', '移动速度'];
    const baseValues = [_profile.attrs.atk, _profile.attrs.hp, _profile.attrs.move];
    const tempValues = [tempAttrs.atk, tempAttrs.hp, tempAttrs.move];

    for (let i = 0; i < 3; i++) {
      const y = attrStartY + i * attrSpacing;
      const baseValue = baseValues[i];
      const tempValue = tempValues[i];
      const diff = tempValue - baseValue;

      // 属性名称和值
      this.ctx.save();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '18px Arial';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(attrNames[i], centerX - 200, y);
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`基础: ${baseValue}`, centerX - 100, y);
      if (diff !== 0) {
        this.ctx.fillStyle = diff > 0 ? '#00ff00' : '#ff0000';
        this.ctx.fillText(`(${diff > 0 ? '+' : ''}${diff})`, centerX - 20, y);
      }
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`当前: ${tempValue}`, centerX + 20, y);
      this.ctx.restore();

      // +/- 按钮
      const buttonSize = 40;
      const minusX = centerX + 150;
      const plusX = centerX + 200;
      const canDecrease = tempValue > baseValue;
      const canIncrease = tempUnspentPoints > 0;

      this.drawButton(minusX, y - 20, buttonSize, buttonSize, '-', canDecrease, 24);
      this.drawButton(plusX, y - 20, buttonSize, buttonSize, '+', canIncrease, 24);
    }

    // 绘制按钮
    const buttonY = rect.height - 80;
    this.drawButton(centerX - 150, buttonY, 120, 40, '保存', true, 16);
    this.drawButton(centerX - 20, buttonY, 120, 40, '重置', true, 16);
    this.drawButton(centerX + 110, buttonY, 120, 40, '返回', true, 16);
  }

  /**
   * 检查 CULTIVATION 页面点击
   */
  checkCultivationPageClick(
    x: number,
    y: number,
    _profile: PlayerProfile
  ): ButtonClickResult {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const attrStartY = 150;
    const isMobile = this.isMobile();
    const attrSpacing = isMobile ? 70 : 80;
    const buttonSize = 40;

    // 检查属性按钮
    for (let i = 0; i < 3; i++) {
      const attrY = attrStartY + i * attrSpacing;
      const minusX = centerX + 150;
      const plusX = centerX + 200;

      if (this.isPointInButton(x, y, minusX, attrY - 20, buttonSize, buttonSize)) {
        return { type: 'button', buttonId: `decrease_${i}` };
      }
      if (this.isPointInButton(x, y, plusX, attrY - 20, buttonSize, buttonSize)) {
        return { type: 'button', buttonId: `increase_${i}` };
      }
    }

    // 检查底部按钮
    const buttonY = rect.height - 80;
    if (this.isPointInButton(x, y, centerX - 150, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'save' };
    }
    if (this.isPointInButton(x, y, centerX - 20, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'reset' };
    }
    if (this.isPointInButton(x, y, centerX + 110, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'back' };
    }

    return { type: null };
  }

  /**
   * 渲染 STASH 页面
   */
  renderStashPage(
    _profile: PlayerProfile,
    tempStashItems: ItemInstance[],
    tempLoadoutItems: ItemInstance[]
  ): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const isMobile = this.isMobile();

    // 绘制背景
    this.ctx.save();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = isMobile ? '28px Arial' : '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('储物袋', centerX, 50);
    this.ctx.restore();

    // 绘制仓库列表（左侧，可滚动）
    const stashStartX = 50;
    const stashStartY = 100;
    const stashWidth = isMobile ? rect.width / 2 - 60 : 300;
    const stashHeight = rect.height - 200;
    const visibleStashItems = Math.floor(stashHeight / this.itemHeight);
    const maxStashScroll = Math.max(0, tempStashItems.length - visibleStashItems);
    const stashScrollY = Math.min(this.stashPageScrollY, maxStashScroll);
    const stashStartIndex = Math.floor(stashScrollY);
    const stashEndIndex = Math.min(stashStartIndex + visibleStashItems + 1, tempStashItems.length);

    // 仓库背景
    this.ctx.save();
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(stashStartX, stashStartY, stashWidth, stashHeight);
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(stashStartX, stashStartY, stashWidth, stashHeight);
    this.ctx.restore();

    // 仓库标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`仓库 (${tempStashItems.length})`, stashStartX + 10, stashStartY - 20);
    this.ctx.restore();

    // 绘制仓库物品
    if (tempStashItems.length === 0) {
      // 如果仓库为空，显示提示信息
      this.ctx.save();
      this.ctx.fillStyle = '#999999';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        '仓库为空',
        stashStartX + stashWidth / 2,
        stashStartY + stashHeight / 2
      );
      this.ctx.restore();
    } else {
      for (let i = stashStartIndex; i < stashEndIndex; i++) {
        const item = tempStashItems[i];
        if (!item) continue;
        
        const itemY = stashStartY + (i - stashStartIndex) * this.itemHeight - (stashScrollY % 1) * this.itemHeight;
        
        if (itemY < stashStartY - this.itemHeight || itemY > stashStartY + stashHeight) {
          continue;
        }

        // 物品背景
        this.ctx.save();
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillRect(stashStartX + 5, itemY, stashWidth - 10, this.itemHeight - 5);
        this.ctx.restore();

        // 物品信息
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
          `${item.name} (占格${item.size})`,
          stashStartX + 15,
          itemY + this.itemHeight / 2
        );
        this.ctx.restore();
      }
    }

    // 绘制出战安全区（右侧）
    const loadoutStartX = isMobile ? rect.width / 2 + 10 : centerX + 50;
    const loadoutStartY = stashStartY;
    const loadoutWidth = isMobile ? rect.width / 2 - 60 : 300;
    const loadoutHeight = 150;

    // 出战背景
    this.ctx.save();
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(loadoutStartX, loadoutStartY, loadoutWidth, loadoutHeight);
    this.ctx.strokeStyle = '#666666';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(loadoutStartX, loadoutStartY, loadoutWidth, loadoutHeight);
    this.ctx.restore();

    // 出战标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    const loadoutUsed = tempLoadoutItems.reduce((sum, item) => sum + item.size, 0);
    this.ctx.fillText(`出战安全区 (${loadoutUsed}/2)`, loadoutStartX + 10, loadoutStartY - 20);
    this.ctx.restore();

    // 绘制出战物品（最多2格）
    for (let i = 0; i < 2; i++) {
      const itemY = loadoutStartY + i * 70;
      if (i < tempLoadoutItems.length) {
        const item = tempLoadoutItems[i];
        
        // 物品背景
        this.ctx.save();
        this.ctx.fillStyle = '#3a3a3a';
        this.ctx.fillRect(loadoutStartX + 5, itemY, loadoutWidth - 10, 65);
        this.ctx.restore();

        // 物品信息
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(
          `${item.name} (占格${item.size})`,
          loadoutStartX + 15,
          itemY + 32
        );
        this.ctx.restore();
      } else {
        // 空格子
        this.ctx.save();
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(loadoutStartX + 5, itemY, loadoutWidth - 10, 65);
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(loadoutStartX + 5, itemY, loadoutWidth - 10, 65);
        this.ctx.restore();
      }
    }

    // 绘制按钮
    const buttonY = rect.height - 60;
    this.drawButton(centerX - 70, buttonY, 120, 40, '保存', true, 16);
    this.drawButton(centerX + 50, buttonY, 120, 40, '返回', true, 16);
  }

  /**
   * 检查 STASH 页面点击
   */
  checkStashPageClick(
    x: number,
    y: number,
    tempStashItems: ItemInstance[],
    tempLoadoutItems: ItemInstance[]
  ): ButtonClickResult {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const isMobile = this.isMobile();
    const stashStartX = 50;
    const stashStartY = 100;
    const stashWidth = isMobile ? rect.width / 2 - 60 : 300;
    const stashHeight = rect.height - 200;
    const visibleStashItems = Math.floor(stashHeight / this.itemHeight);
    const maxStashScroll = Math.max(0, tempStashItems.length - visibleStashItems);
    const stashScrollY = Math.min(this.stashPageScrollY, maxStashScroll);
    const stashStartIndex = Math.floor(stashScrollY);
    const stashEndIndex = Math.min(stashStartIndex + visibleStashItems + 1, tempStashItems.length);

    // 检查仓库物品点击
    for (let i = stashStartIndex; i < stashEndIndex; i++) {
      const itemY = stashStartY + (i - stashStartIndex) * this.itemHeight - (stashScrollY % 1) * this.itemHeight;
      if (y >= itemY && y <= itemY + this.itemHeight - 5 &&
          x >= stashStartX + 5 && x <= stashStartX + stashWidth - 5) {
        return { type: 'item', itemIndex: i };
      }
    }

    // 检查出战物品点击
    const loadoutStartX = isMobile ? rect.width / 2 + 10 : centerX + 50;
    const loadoutStartY = stashStartY;
    const loadoutWidth = isMobile ? rect.width / 2 - 60 : 300;
    for (let i = 0; i < tempLoadoutItems.length; i++) {
      const itemY = loadoutStartY + i * 70;
      if (y >= itemY && y <= itemY + 65 &&
          x >= loadoutStartX + 5 && x <= loadoutStartX + loadoutWidth - 5) {
        return { type: 'item', itemIndex: -1 - i }; // 负数表示出战物品
      }
    }

    // 检查按钮
    const buttonY = rect.height - 60;
    if (this.isPointInButton(x, y, centerX - 70, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'save' };
    }
    if (this.isPointInButton(x, y, centerX + 50, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'back' };
    }

    return { type: null };
  }

  /**
   * 更新 STASH 页面滚动
   */
  updateStashPageScroll(delta: number, tempStashItems: ItemInstance[]): void {
    const rect = this.canvas.getBoundingClientRect();
    const stashHeight = rect.height - 200;
    const visibleStashItems = Math.floor(stashHeight / this.itemHeight);
    const maxStashScroll = Math.max(0, tempStashItems.length - visibleStashItems);
    
    this.stashPageScrollY = Math.max(0, Math.min(this.stashPageScrollY + delta * this.scrollSpeed, maxStashScroll));
  }

  /**
   * 渲染 SETTINGS 页面
   */
  renderSettingsPage(volume: number, debugEnabled: boolean): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const isMobile = this.isMobile();

    // 绘制背景
    this.ctx.save();
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制标题
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = isMobile ? '28px Arial' : '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('设置', centerX, 50);
    this.ctx.restore();

    // 音量设置
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`音量: ${Math.round(volume * 100)}%`, centerX - 200, centerY - 50);
    this.ctx.restore();

    // 音量滑块背景
    const sliderX = centerX - 200;
    const sliderY = centerY - 20;
    const sliderWidth = 400;
    const sliderHeight = 20;
    this.ctx.save();
    this.ctx.fillStyle = '#666666';
    this.ctx.fillRect(sliderX, sliderY, sliderWidth, sliderHeight);
    this.ctx.fillStyle = '#4a90e2';
    this.ctx.fillRect(sliderX, sliderY, sliderWidth * volume, sliderHeight);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(sliderX, sliderY, sliderWidth, sliderHeight);
    this.ctx.restore();

    // 调试开关
    this.ctx.save();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('显示调试信息', centerX - 200, centerY + 50);
    
    // 开关背景
    const toggleX = centerX + 100;
    const toggleY = centerY + 30;
    const toggleWidth = 60;
    const toggleHeight = 30;
    this.ctx.fillStyle = debugEnabled ? '#4a90e2' : '#666666';
    this.ctx.fillRect(toggleX, toggleY, toggleWidth, toggleHeight);
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(toggleX, toggleY, toggleWidth, toggleHeight);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(debugEnabled ? 'ON' : 'OFF', toggleX + toggleWidth / 2, toggleY + toggleHeight / 2);
    this.ctx.restore();

    // 返回按钮
    const buttonY = rect.height - 60;
    this.drawButton(centerX - 60, buttonY, 120, 40, '返回', true, 16);
  }

  /**
   * 检查 SETTINGS 页面点击
   */
  checkSettingsPageClick(x: number, y: number): ButtonClickResult {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 检查音量滑块
    const sliderX = centerX - 200;
    const sliderY = centerY - 20;
    const sliderWidth = 400;
    const sliderHeight = 20;
    if (x >= sliderX && x <= sliderX + sliderWidth &&
        y >= sliderY && y <= sliderY + sliderHeight) {
      const volume = (x - sliderX) / sliderWidth;
      return { type: 'button', buttonId: `volume_${Math.max(0, Math.min(1, volume))}` };
    }

    // 检查调试开关
    const toggleX = centerX + 100;
    const toggleY = centerY + 30;
    const toggleWidth = 60;
    const toggleHeight = 30;
    if (x >= toggleX && x <= toggleX + toggleWidth &&
        y >= toggleY && y <= toggleY + toggleHeight) {
      return { type: 'button', buttonId: 'toggle_debug' };
    }

    // 检查返回按钮
    const buttonY = rect.height - 60;
    if (this.isPointInButton(x, y, centerX - 60, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'back' };
    }

    return { type: null };
  }

  /**
   * 渲染 RESULT_SUMMARY 页面
   */
  renderResultSummaryPage(uiState: UIState): void {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const isMobile = this.isMobile();

    // 绘制背景
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
    this.ctx.restore();

    // 绘制面板
    const panelWidth = isMobile ? rect.width - 40 : 600;
    const panelHeight = isMobile ? rect.height - 100 : 500;
    
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
    const isSuccess = uiState.resultReason === 'SUCCESS';
    this.ctx.save();
    this.ctx.fillStyle = isSuccess ? '#00ff00' : '#ff0000';
    this.ctx.font = isMobile ? '24px Arial' : '28px Arial';
    this.ctx.textAlign = 'center';
    const titleText = isSuccess ? '撤离成功！' : '撤离失败';
    this.ctx.fillText(titleText, centerX, centerY - panelHeight / 2 + 40);
    
    // 失败原因
    if (!isSuccess && uiState.resultReason) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '16px Arial';
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

    // 绘制返回按钮
    const buttonY = centerY + panelHeight / 2 - 60;
    this.drawButton(centerX - 60, buttonY, 120, 40, '返回主界面', true, 16);
  }

  /**
   * 检查 RESULT_SUMMARY 页面点击
   */
  checkResultSummaryPageClick(x: number, y: number): ButtonClickResult {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const isMobile = this.isMobile();
    const panelHeight = isMobile ? rect.height - 100 : 500;
    const buttonY = centerY + panelHeight / 2 - 60;

    if (this.isPointInButton(x, y, centerX - 60, buttonY, 120, 40)) {
      return { type: 'button', buttonId: 'back' };
    }

    return { type: null };
  }

  /**
   * 重置滚动状态
   */
  resetScroll(): void {
    this.startPageScrollY = 0;
    this.stashPageScrollY = 0;
  }
}
