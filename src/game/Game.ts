import { Camera } from './Camera';
import { Player } from './Player';
import { GroundBand } from './GroundBand';
import { Renderer } from './Renderer';
import { Obstacle } from './Obstacle';
import { Renderable } from './Renderable';
import { GroundLoot } from './GroundLoot';
import { ItemInstance, ItemType } from './Item';
import { Bag } from './Bag';
import { UI, UIState } from './UI';
import { Aura } from './Aura';
import { AuraNode } from './AuraNode';
import { Channeling, ChannelType } from './Channeling';
import { SessionTimer } from './SessionTimer';
import { ExtractionZone } from './ExtractionZone';
import { Interference } from './Interference';

/**
 * 主游戏循环
 */
export class Game {
  private renderer: Renderer;
  private camera: Camera;
  private player: Player;
  private groundBand: GroundBand;
  private obstacles: Obstacle[] = [];
  private groundLoots: GroundLoot[] = [];
  private auraNodes: AuraNode[] = [];
  private extractionZone: ExtractionZone | null = null;
  private interferences: Interference[] = [];
  private bag: Bag;
  private aura: Aura;
  private channeling: Channeling;
  private sessionTimer: SessionTimer;
  private ui: UI;
  private gamePhase: 'RUNNING' | 'RESULT' = 'RUNNING';
  private extractState: 'IDLE' | 'EXTRACTING' | 'SUCCESS' = 'IDLE';
  private extractProgress: number = 0; // 撤离进度（秒）
  private extractionStartTime: number = 0;
  private extractionWaveTimes: number[] = [3, 9]; // 撤离期间干扰波次时间（秒）
  private extractionWaveSpawned: boolean[] = [false, false];
  private globalWaveTimes: number[] = []; // 全局干扰波次时间（秒，从游戏开始计算）
  private globalWaveSpawned: boolean[] = [];
  private gameStartTime: number = 0; // 游戏开始时间
  private uiState: UIState = {
    uiMode: 'GAME',
    showPickupPrompt: false,
    pickupItemName: '',
    pickupItemSize: 0,
    showChoiceDialog: false,
    pendingItem: null,
    showBagDialog: false,
    channelProgress: 0,
    channelType: null,
    resultReason: null,
    resultSafeItems: [],
    resultUnsafeItems: [],
    resultLostItems: []
  };
  private debugDraw: boolean = false;
  private pickupRadius: number = 28;
  private nearestLoot: GroundLoot | null = null;
  private nearestAuraNode: AuraNode | null = null;
  private animationFrameId: number = 0;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    // 初始化渲染器
    this.renderer = new Renderer(canvas);

    // 初始化 UI
    this.ui = new UI(canvas);

    // 初始化相机
    this.camera = new Camera();
    
    // 设置相机屏幕中心
    const center = this.renderer.getScreenCenter();
    this.camera.setScreenCenter(center.x, center.y);

    // 初始化储物袋
    this.bag = new Bag();

    // 初始化灵气系统
    this.aura = new Aura();

    // 初始化读条系统
    this.channeling = new Channeling();

    // 初始化全局倒计时
    this.sessionTimer = new SessionTimer(12 * 60);

    // 初始化地面带（宽 2000，高 400，从 y=200 开始）
    this.groundBand = new GroundBand(0, 200, 2000, 400);

    // 初始化玩家（放在地面带中间位置）
    this.player = new Player(100, 400, 0);
    
    // 设置玩家可走区域
    const walkRect = this.groundBand.getWalkRect();
    this.player.setWalkRect(walkRect);

    // 初始化障碍物（至少 5 个，分布在不同 x/y）
    this.initObstacles();
    
    // 设置玩家障碍物列表
    this.player.setObstacles(this.obstacles);

    // 初始化地面掉落物
    this.initGroundLoots();

    // 初始化灵气点
    this.initAuraNodes();

    // 初始化撤离点
    this.initExtractionZone();

    // 初始化常驻怪物
    this.initInterferences();

    // 初始化游戏开始时间和全局干扰波次
    this.gameStartTime = Date.now();
    // 设置全局干扰波次时间：每2分钟生成一波（12分钟游戏，共6波）
    const totalSeconds = 12 * 60;
    this.globalWaveTimes = [];
    this.globalWaveSpawned = [];
    for (let i = 1; i <= 6; i++) {
      this.globalWaveTimes.push((totalSeconds / 6) * i); // 2分钟、4分钟、6分钟、8分钟、10分钟、12分钟
      this.globalWaveSpawned.push(false);
    }

    // 设置输入处理
    this.setupInput();
    
    // 设置调试开关（按 F1 切换）
    this.setupDebugToggle();

    // 设置窗口大小变化处理
    window.addEventListener('resize', () => {
      this.renderer.handleResize();
      // 更新相机屏幕中心
      const newCenter = this.renderer.getScreenCenter();
      this.camera.setScreenCenter(newCenter.x, newCenter.y);
    });

    // 设置鼠标点击处理（用于背包对话框）
    canvas.addEventListener('click', (e) => {
      this.handleClick(e);
    });
  }

  /**
   * 初始化障碍物
   */
  private initObstacles(): void {
    this.obstacles = [
      new Obstacle(200, 300, 30, 30, 40, 40),
      new Obstacle(400, 250, 30, 30, 40, 40),
      new Obstacle(600, 450, 30, 30, 40, 40),
      new Obstacle(800, 350, 20, 20, 25, 50),
      new Obstacle(1000, 300, 30, 30, 40, 40),
      new Obstacle(1200, 400, 20, 20, 25, 50),
    ];
  }

  /**
   * 初始化地面掉落物
   */
  private initGroundLoots(): void {
    // 创建足够的初始掉落物用于测试（总占格数超过背包容量）
    // 普通区容量为 8，这里创建总占格数约 12-14 的物品
    this.groundLoots = [
      // 左侧区域
      new GroundLoot(150, 350, new ItemInstance(ItemType.POTION, '生命药水')),
      new GroundLoot(200, 300, new ItemInstance(ItemType.POTION, '魔法药水')),
      new GroundLoot(250, 400, new ItemInstance(ItemType.EQUIPMENT, '长剑')),
      
      // 中间区域
      new GroundLoot(350, 350, new ItemInstance(ItemType.POTION, '力量药水')),
      new GroundLoot(400, 300, new ItemInstance(ItemType.EQUIPMENT, '盾牌')),
      new GroundLoot(450, 400, new ItemInstance(ItemType.POTION, '敏捷药水')),
      
      // 右侧区域
      new GroundLoot(650, 350, new ItemInstance(ItemType.EQUIPMENT, '护甲')),
      new GroundLoot(700, 300, new ItemInstance(ItemType.POTION, '耐力药水')),
      new GroundLoot(750, 400, new ItemInstance(ItemType.POTION, '幸运药水')),
      
      // 更右侧区域
      new GroundLoot(850, 350, new ItemInstance(ItemType.EQUIPMENT, '法杖')),
      new GroundLoot(900, 300, new ItemInstance(ItemType.POTION, '恢复药水')),
      new GroundLoot(950, 400, new ItemInstance(ItemType.POTION, '经验药水')),
    ];
    // 总占格数：1+1+2+1+2+1+2+1+1+2+1+1 = 16 格（足够填满背包并测试取舍）
  }

  /**
   * 初始化灵气点
   */
  private initAuraNodes(): void {
    // 在地图上分布一些灵气点
    this.auraNodes = [
      new AuraNode(300, 350, 2.0, 20),
      new AuraNode(500, 300, 2.0, 20),
      new AuraNode(700, 400, 2.0, 20),
      new AuraNode(900, 350, 2.0, 20),
      new AuraNode(1100, 300, 2.0, 20),
    ];
  }

  /**
   * 初始化撤离点
   */
  private initExtractionZone(): void {
    // 在地图右侧放置撤离点
    this.extractionZone = new ExtractionZone(1800, 400, 15, 100);
  }

  /**
   * 初始化常驻怪物
   * 核心函数：initInterferences
   */
  private initInterferences(): void {
    const playerPos = this.player.getPosition();
    const walkRect = this.groundBand.getWalkRect();
    
    // 在地图不同区域生成常驻怪物（共8-10个）
    const initialMonsters = [
      // 左侧区域
      { x: 300, y: 300 },
      { x: 400, y: 450 },
      { x: 500, y: 350 },
      
      // 中间区域
      { x: 700, y: 280 },
      { x: 800, y: 420 },
      { x: 900, y: 380 },
      
      // 右侧区域
      { x: 1200, y: 320 },
      { x: 1400, y: 400 },
      { x: 1600, y: 360 },
    ];
    
    // 添加一些随机位置的怪物
    for (let i = 0; i < 3; i++) {
      const randomX = walkRect.x + Math.random() * walkRect.width;
      const randomY = walkRect.y + Math.random() * walkRect.height;
      initialMonsters.push({ x: randomX, y: randomY });
    }
    
    // 生成干扰实体
    for (const pos of initialMonsters) {
      // 确保位置在地图范围内
      const clampedX = Math.max(walkRect.x, Math.min(walkRect.x + walkRect.width, pos.x));
      const clampedY = Math.max(walkRect.y, Math.min(walkRect.y + walkRect.height, pos.y));
      
      const interference = new Interference(clampedX, clampedY, playerPos.x, playerPos.y);
      this.interferences.push(interference);
    }
  }

  /**
   * 设置输入处理
   */
  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      // 切换背包打开/关闭（I 或 Tab）
      if (e.key.toLowerCase() === 'i' || e.key === 'Tab') {
        e.preventDefault();
        this.toggleInventory();
        return;
      }

      // CHANNELING 模式下，只允许取消和移动（如果是撤离读条）
      if (this.uiState.uiMode === 'CHANNELING') {
        if (e.key === 'Escape') {
          this.cancelChanneling();
          return;
        }
        // 撤离读条期间允许移动（WASD），其他读条不允许
        if (this.extractState === 'EXTRACTING') {
          // 允许 WASD 移动
          this.player.handleKeyDown(e.key);
          return;
        }
        // 其他读条类型（采集灵气、移动物品）不允许移动
        if (this.channeling.getType() === 'EXTRACT') {
          // 允许 WASD 移动（兼容旧逻辑）
          this.player.handleKeyDown(e.key);
          return;
        }
        // 其他读条类型不允许任何操作
        return;
      }

      // INVENTORY 模式下，只处理背包相关操作
      if (this.uiState.uiMode === 'INVENTORY') {
        // Escape 关闭背包
        if (e.key === 'Escape') {
          this.closeInventory();
          return;
        }
        // 其他操作在鼠标点击中处理
        return;
      }

      // GAME 模式下的操作
      // 如果显示弹窗，处理弹窗按键
      if (this.uiState.showChoiceDialog) {
        if (e.key.toLowerCase() === 'a') {
          this.handleDiscardNewItem();
          return;
        } else if (e.key.toLowerCase() === 'b') {
          this.handleOpenBag();
          return;
        }
      }

      // 如果显示背包对话框，处理背包按键
      if (this.uiState.showBagDialog) {
        // 数字键 1-9 丢弃对应物品
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          this.handleDropFromBag(num - 1);
          return;
        }
        // Enter 键拾取新物品（如果可以）
        if (e.key === 'Enter' && this.bag.canAddUnsafe(this.uiState.pendingItem!)) {
          this.handlePickupPendingItem();
          return;
        }
        // Escape 关闭背包对话框
        if (e.key === 'Escape') {
          this.uiState.showBagDialog = false;
          this.uiState.showChoiceDialog = false;
          this.uiState.pendingItem = null;
          return;
        }
      }

      // GAME 模式下的 E 键交互（优先级：AuraNode > GroundLoot）
      if (e.key.toLowerCase() === 'e' && !this.uiState.showChoiceDialog && !this.uiState.showBagDialog) {
        // 优先处理灵气点采集
        if (this.nearestAuraNode && !this.channeling.isChanneling()) {
          this.handleCollectAura();
          return;
        }
        // 其次处理物品拾取
        if (this.nearestLoot) {
          this.handlePickup();
          return;
        }
      }

      // F 键撤离已移除，改为自动开始

      // 玩家移动（GAME 模式下，或撤离读条期间）
      if (this.uiState.uiMode === 'GAME' || 
          this.extractState === 'EXTRACTING' ||
          (this.uiState.uiMode === 'CHANNELING' && this.channeling.getType() === 'EXTRACT')) {
        this.player.handleKeyDown(e.key);
      }
    });

    window.addEventListener('keyup', (e) => {
      // 处理玩家移动（GAME 模式下，或撤离读条期间）
      const isExtracting = (this.extractState as 'IDLE' | 'EXTRACTING' | 'SUCCESS') === 'EXTRACTING';
      if (this.uiState.uiMode === 'GAME' || 
          isExtracting ||
          (this.uiState.uiMode === 'CHANNELING' && isExtracting) ||
          (this.uiState.uiMode === 'CHANNELING' && this.channeling.getType() === 'EXTRACT')) {
        this.player.handleKeyUp(e.key);
      }
    });
  }

  /**
   * 切换背包打开/关闭
   */
  private toggleInventory(): void {
    if (this.uiState.uiMode === 'GAME') {
      this.openInventory();
    } else {
      this.closeInventory();
    }
  }

  /**
   * 打开背包
   */
  private openInventory(): void {
    this.uiState.uiMode = 'INVENTORY';
    // 清除拾取提示
    this.uiState.showPickupPrompt = false;
  }

  /**
   * 关闭背包
   */
  private closeInventory(): void {
    this.uiState.uiMode = 'GAME';
  }

  /**
   * 处理鼠标点击
   */
  private handleClick(e: MouseEvent): void {
    // INVENTORY 模式下的背包面板点击
    if (this.uiState.uiMode === 'INVENTORY') {
      const rect = this.renderer.getCanvas().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const result = this.ui.checkInventoryClick(x, y, this.bag);
      
      if (result.type === 'moveSafeToUnsafe' && result.index !== undefined) {
        this.handleMoveSafeToUnsafe(result.index);
      } else if (result.type === 'moveUnsafeToSafe' && result.index !== undefined) {
        this.handleMoveUnsafeToSafe(result.index);
      } else if (result.type === 'dropSafe' && result.index !== undefined) {
        this.handleDropFromSafe(result.index);
      } else if (result.type === 'dropUnsafe' && result.index !== undefined) {
        this.handleDropFromUnsafe(result.index);
      }
      return;
    }

    // 旧的背包对话框点击处理
    if (this.uiState.showBagDialog) {
      const rect = this.renderer.getCanvas().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const result = this.ui.checkBagDialogClick(x, y, this.bag, this.uiState);
      
      if (result.type === 'drop' && result.index !== undefined) {
        this.handleDropFromBag(result.index);
      } else if (result.type === 'pickup') {
        this.handlePickupPendingItem();
      }
    }
  }

  /**
   * 处理从安全区移动到普通区
   */
  private handleMoveSafeToUnsafe(index: number): void {
    const success = this.bag.moveSafeToUnsafe(index);
    if (!success) {
      console.log('普通区容量不足，无法移动');
    }
  }

  /**
   * 处理从普通区移动到安全区（带消耗与读条）
   */
  private handleMoveUnsafeToSafe(index: number): void {
    // 前置条件检查
    const items = this.bag.getUnsafeItems();
    if (index < 0 || index >= items.length) return;

    const item = items[index];
    
    // 检查安全区容量
    if (!this.bag.canAddSafe(item)) {
      console.log('安全区容量不足');
      return;
    }

    // 检查灵气
    if (!this.aura.canSpendAura(8)) {
      console.log('灵气不足（需要8）');
      return;
    }

    // 检查当前模式
    if (this.uiState.uiMode !== 'INVENTORY') {
      console.log('只能在背包中操作');
      return;
    }

    // 开始读条
    this.startChanneling(
      'MOVE_TO_SAFE',
      1.5,
      () => {
        // 读条完成：扣灵气并转移
        if (this.aura.canSpendAura(8) && this.bag.canAddSafe(item)) {
          this.aura.spendAura(8);
          const movedItem = this.bag.removeFromUnsafe(index);
          if (movedItem) {
            this.bag.addSafe(movedItem);
            console.log(`成功将 ${movedItem.name} 移入安全区`);
          }
        } else {
          console.log('转移失败：容量或灵气不足');
        }
        // 回到 INVENTORY 模式
        this.uiState.uiMode = 'INVENTORY';
      },
      () => {
        // 取消：不扣灵气，不转移
        console.log('取消转移');
        this.uiState.uiMode = 'INVENTORY';
      }
    );
  }

  /**
   * 处理采集灵气
   */
  private handleCollectAura(): void {
    if (!this.nearestAuraNode || this.channeling.isChanneling()) return;

    // 开始采集读条
    this.startChanneling(
      'COLLECT_AURA',
      this.nearestAuraNode.collectSeconds,
      () => {
        // 读条完成：获得灵气
        this.aura.addAura(this.nearestAuraNode!.gainAmount);
        console.log(`采集灵气成功，获得 ${this.nearestAuraNode!.gainAmount} 灵气`);
        // 回到 GAME 模式
        this.uiState.uiMode = 'GAME';
      },
      () => {
        // 取消：不获得灵气
        console.log('取消采集');
        this.uiState.uiMode = 'GAME';
      }
    );
  }

  /**
   * 开始读条
   * 核心函数：startChannel
   */
  private startChanneling(
    type: ChannelType,
    duration: number,
    onFinish: () => void,
    onCancel?: () => void
  ): void {
    this.channeling.startChannel(type, duration, onFinish, onCancel);
    this.uiState.uiMode = 'CHANNELING';
    this.uiState.channelType = type;
    this.uiState.channelProgress = 0;
  }

  /**
   * 取消读条
   * 核心函数：cancelChannel
   */
  private cancelChanneling(): void {
    const channelType = this.channeling.getType();
    this.channeling.cancelChannel();
    
    // 根据读条类型处理取消逻辑
    if (channelType === 'EXTRACT') {
      // 取消撤离：直接进入失败结算（不退100灵气）
      this.failExtraction('EXTRACT_INTERRUPTED');
      return;
    }
    
    // 其他读条取消：回到上一状态
    if (this.uiState.uiMode === 'CHANNELING') {
      this.uiState.uiMode = 'GAME';
    }
    this.uiState.channelProgress = 0;
    this.uiState.channelType = null;
  }

  /**
   * 进入撤离区域
   * 核心函数：onEnterZone
   */
  private onEnterZone(): void {
    if (!this.extractionZone || this.gamePhase !== 'RUNNING') return;
    
    // 检查是否满足条件：灵气足够且状态为 IDLE
    if (this.extractState === 'IDLE' && this.aura.getCurrent() >= this.extractionZone.costAura) {
      this.extractState = 'EXTRACTING';
      this.extractProgress = 0;
      this.extractionStartTime = Date.now();
      this.extractionWaveSpawned = [false, false];
      
      // 进入 CHANNELING 模式显示进度
      this.uiState.uiMode = 'CHANNELING';
      this.uiState.channelType = 'EXTRACT';
      this.uiState.channelProgress = 0;
    }
  }

  /**
   * 离开撤离区域
   * 核心函数：onLeaveZone
   */
  private onLeaveZone(): void {
    if (this.extractState === 'EXTRACTING') {
      // 离开区域：重置状态，不触发失败结算
      this.extractState = 'IDLE';
      this.extractProgress = 0;
      
      // 退出 CHANNELING 模式
      this.uiState.uiMode = 'GAME';
      this.uiState.channelType = null;
      this.uiState.channelProgress = 0;
      
      // 清除干扰
      this.interferences = [];
    }
  }

  /**
   * 更新撤离进度
   * 核心函数：updateExtraction
   */
  private updateExtraction(deltaTime: number): void {
    if (this.extractState !== 'EXTRACTING' || !this.extractionZone) return;
    
    // 检查玩家是否仍在区域内
    const isInZone = this.extractionZone.isPlayerInRange(this.player.x, this.player.y);
    
    if (!isInZone) {
      // 离开区域：取消撤离
      this.onLeaveZone();
      return;
    }
    
    // 更新进度
    this.extractProgress += deltaTime / 1000; // 转换为秒
    this.uiState.channelProgress = Math.min(this.extractProgress / this.extractionZone.channelSeconds, 1);
    
    // 检查是否完成
    if (this.extractProgress >= this.extractionZone.channelSeconds) {
      // 读条完成，检查灵气是否足够
      if (!this.aura.canSpendAura(this.extractionZone.costAura)) {
        // 灵气不足，取消撤离
        this.extractState = 'IDLE';
        this.extractProgress = 0;
        this.uiState.uiMode = 'GAME';
        this.uiState.channelType = null;
        this.uiState.channelProgress = 0;
        console.log('撤离失败：灵气不足');
        return;
      }
      
      // 扣费并成功撤离
      this.aura.spendAura(this.extractionZone.costAura);
      this.extractState = 'SUCCESS';
      this.successExtraction();
    }
  }

  /**
   * 生成干扰波次（撤离期间）
   * 核心函数：spawnInterferenceWave
   */
  private spawnInterferenceWave(_waveIndex: number): void {
    if (!this.extractionZone) return;
    
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 个
    const playerPos = this.player.getPosition();
    
    for (let i = 0; i < count; i++) {
      // 在撤离点周围随机位置生成
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 50; // 距离撤离点 50-100
      const x = this.extractionZone.x + Math.cos(angle) * distance;
      const y = this.extractionZone.y + Math.sin(angle) * distance;
      
      const interference = new Interference(x, y, playerPos.x, playerPos.y);
      this.interferences.push(interference);
    }
  }

  /**
   * 生成全局干扰波次（游戏过程中）
   * 核心函数：spawnGlobalInterferenceWave
   */
  private spawnGlobalInterferenceWave(): void {
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 个
    const playerPos = this.player.getPosition();
    
    // 在玩家周围随机位置生成
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100; // 距离玩家 100-200
      const x = playerPos.x + Math.cos(angle) * distance;
      const y = playerPos.y + Math.sin(angle) * distance;
      
      // 确保生成位置在地图范围内
      const walkRect = this.groundBand.getWalkRect();
      const clampedX = Math.max(walkRect.x, Math.min(walkRect.x + walkRect.width, x));
      const clampedY = Math.max(walkRect.y, Math.min(walkRect.y + walkRect.height, y));
      
      const interference = new Interference(clampedX, clampedY, playerPos.x, playerPos.y);
      this.interferences.push(interference);
    }
  }

  /**
   * 成功撤离
   * 核心函数：successExtraction
   */
  private successExtraction(): void {
    this.enterResult('SUCCESS');
  }

  /**
   * 失败撤离
   * 核心函数：failExtraction
   */
  private failExtraction(reason: 'TIMEOUT' | 'DEAD' | 'EXTRACT_INTERRUPTED'): void {
    this.enterResult(reason);
  }

  /**
   * 进入结算阶段
   * 核心函数：enterResult
   */
  private enterResult(reason: 'SUCCESS' | 'TIMEOUT' | 'DEAD' | 'EXTRACT_INTERRUPTED'): void {
    this.gamePhase = 'RESULT';
    this.sessionTimer.stop();
    
    // 保存结算前的物品状态（在清空之前）
    const safeItems = this.bag.getSafeItems();
    const unsafeItems = this.bag.getUnsafeItems();
    
    // 结算物品
    if (reason === 'SUCCESS') {
      // 成功：保留 safe + unsafe
      // 不需要操作，bag 保持原样
    } else {
      // 失败：保留 safe，清空 unsafe
      for (let i = unsafeItems.length - 1; i >= 0; i--) {
        this.bag.dropFromUnsafe(i);
      }
    }
    
    // 清除干扰
    this.interferences = [];
    
    // 更新 UI 状态
    this.uiState.uiMode = 'GAME';
    this.uiState.channelProgress = 0;
    this.uiState.channelType = null;
    
    // 设置结算信息（将在 UI 中显示）
    this.uiState.resultReason = reason;
    this.uiState.resultSafeItems = safeItems;
    this.uiState.resultUnsafeItems = reason === 'SUCCESS' ? unsafeItems : [];
    this.uiState.resultLostItems = reason === 'SUCCESS' ? [] : unsafeItems;
  }

  /**
   * 重新开始游戏
   */
  private restartGame(): void {
    // 重置玩家位置和状态
    this.player.x = 100;
    this.player.y = 400;
    this.player.reset();
    
    // 重置倒计时和灵气
    this.sessionTimer.reset();
    this.aura = new Aura();
    
    // 清空地面掉落物
    this.groundLoots = [];
    
    // 重新初始化地面掉落物
    this.initGroundLoots();
    
    // 清除干扰并重新初始化常驻怪物
    this.interferences = [];
    this.initInterferences();
    
    // 重置游戏阶段和撤离状态
    this.gamePhase = 'RUNNING';
    this.extractState = 'IDLE';
    this.extractProgress = 0;
    
    // 重置游戏开始时间和全局干扰波次
    this.gameStartTime = Date.now();
    // 设置全局干扰波次时间：每2分钟生成一波（12分钟游戏，共6波）
    const totalSeconds = 12 * 60;
    this.globalWaveTimes = [];
    this.globalWaveSpawned = [];
    for (let i = 1; i <= 6; i++) {
      this.globalWaveTimes.push((totalSeconds / 6) * i); // 2分钟、4分钟、6分钟、8分钟、10分钟、12分钟
      this.globalWaveSpawned.push(false);
    }
    
    // 重置 UI 状态
    this.uiState.resultReason = null;
    this.uiState.resultSafeItems = [];
    this.uiState.resultUnsafeItems = [];
    this.uiState.resultLostItems = [];
    this.uiState.uiMode = 'GAME';
    this.uiState.channelType = null;
    this.uiState.channelProgress = 0;
  }

  /**
   * 处理从安全区丢弃物品
   */
  private handleDropFromSafe(index: number): void {
    const item = this.bag.dropFromSafe(index);
    if (item) {
      this.spawnGroundLoot(item, this.player.x, this.player.y);
      console.log(`丢弃：${item.name}`);
    }
  }

  /**
   * 处理从普通区丢弃物品
   */
  private handleDropFromUnsafe(index: number): void {
    const item = this.bag.dropFromUnsafe(index);
    if (item) {
      this.spawnGroundLoot(item, this.player.x, this.player.y);
      console.log(`丢弃：${item.name}`);
    }
  }

  /**
   * 设置调试开关（F1 切换）
   */
  private setupDebugToggle(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.debugDraw = !this.debugDraw;
        console.log('调试绘制:', this.debugDraw ? '开启' : '关闭');
      }
    });
  }

  /**
   * 查找最近的灵气点
   */
  private findNearestAuraNode(): AuraNode | null {
    let nearest: AuraNode | null = null;
    let minDistance = Infinity;

    for (const node of this.auraNodes) {
      if (node.isPlayerInRange(this.player.x, this.player.y)) {
        const dx = node.x - this.player.x;
        const dy = node.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearest = node;
        }
      }
    }

    return nearest;
  }

  /**
   * 查找最近的掉落物
   * 核心函数：findNearestLoot
   */
  private findNearestLoot(): GroundLoot | null {
    let nearest: GroundLoot | null = null;
    let minDistance = this.pickupRadius;

    for (const loot of this.groundLoots) {
      const dx = loot.x - this.player.x;
      const dy = loot.y - this.player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.pickupRadius && distance < minDistance) {
        minDistance = distance;
        nearest = loot;
      }
    }

    return nearest;
  }

  /**
   * 尝试拾取物品
   * 核心函数：tryPickup
   */
  private tryPickup(loot: GroundLoot): void {
    if (this.bag.canAddUnsafe(loot.item)) {
      // 可以拾取，直接加入背包
      this.bag.addUnsafe(loot.item);
      // 从地面移除
      const index = this.groundLoots.indexOf(loot);
      if (index !== -1) {
        this.groundLoots.splice(index, 1);
      }
      console.log(`拾取成功：${loot.item.name}`);
    } else {
      // 放不下，弹出取舍弹窗
      this.uiState.pendingItem = loot.item;
      this.uiState.showChoiceDialog = true;
      // 从地面移除（暂时保存，如果玩家选择丢弃则不再生成）
      const index = this.groundLoots.indexOf(loot);
      if (index !== -1) {
        this.groundLoots.splice(index, 1);
      }
    }
  }

  /**
   * 处理拾取（E 键）
   */
  private handlePickup(): void {
    if (this.nearestLoot) {
      this.tryPickup(this.nearestLoot);
    }
  }

  /**
   * 处理丢弃新物品（按钮A）
   */
  private handleDiscardNewItem(): void {
    if (this.uiState.pendingItem) {
      // 生成新的 GroundLoot 掉在玩家脚边
      this.spawnGroundLoot(this.uiState.pendingItem, this.player.x, this.player.y);
      this.uiState.pendingItem = null;
      this.uiState.showChoiceDialog = false;
    }
  }

  /**
   * 处理打开背包（按钮B）
   */
  private handleOpenBag(): void {
    this.uiState.showBagDialog = true;
    this.uiState.showChoiceDialog = false;
  }

  /**
   * 处理从背包丢弃物品
   */
  private handleDropFromBag(index: number): void {
    const item = this.bag.dropFromUnsafe(index);
    if (item) {
      // 生成新的 GroundLoot 掉在玩家脚边
      this.spawnGroundLoot(item, this.player.x, this.player.y);
      console.log(`丢弃：${item.name}`);
    }
  }

  /**
   * 处理拾取待处理物品
   */
  private handlePickupPendingItem(): void {
    if (this.uiState.pendingItem && this.bag.canAddUnsafe(this.uiState.pendingItem)) {
      this.bag.addUnsafe(this.uiState.pendingItem);
      console.log(`拾取成功：${this.uiState.pendingItem.name}`);
      this.uiState.pendingItem = null;
      this.uiState.showBagDialog = false;
      this.uiState.showChoiceDialog = false;
    }
  }

  /**
   * 生成地面掉落物
   * 核心函数：spawnGroundLoot
   */
  private spawnGroundLoot(item: ItemInstance, x: number, y: number): void {
    // 在玩家脚边随机位置生成（避免重叠）
    const offsetX = (Math.random() - 0.5) * 30;
    const offsetY = (Math.random() - 0.5) * 30;
    const loot = new GroundLoot(x + offsetX, y + offsetY, item);
    this.groundLoots.push(loot);
  }

  /**
   * 更新游戏状态
   */
  private update(deltaTime: number): void {
    // RESULT 模式下不更新游戏逻辑
    if (this.gamePhase === 'RESULT') {
      return;
    }

    // 更新全局倒计时（仅在 RUNNING 且未结算时）
    if (this.gamePhase === 'RUNNING') {
      this.sessionTimer.update(deltaTime);
      if (this.sessionTimer.isExpired()) {
        this.failExtraction('TIMEOUT');
        return;
      }
      
      // 检查全局干扰波次生成（基于游戏时间）
      const gameElapsed = (Date.now() - this.gameStartTime) / 1000; // 游戏开始后的秒数
      for (let i = 0; i < this.globalWaveTimes.length; i++) {
        if (gameElapsed >= this.globalWaveTimes[i] && !this.globalWaveSpawned[i]) {
          this.spawnGlobalInterferenceWave();
          this.globalWaveSpawned[i] = true;
        }
      }
      
      // 更新全局干扰实体（非撤离期间）
      if (this.extractState !== 'EXTRACTING') {
        for (const interference of this.interferences) {
          interference.update();
          
          // 检查与玩家碰撞
          if (interference.checkCollision(this.player.x, this.player.y)) {
            // 扣血
            this.player.takeDamage(interference.damage);
            if (this.player.isDead()) {
              this.failExtraction('DEAD');
              return;
            }
            // 移除该干扰实体
            const index = this.interferences.indexOf(interference);
            if (index !== -1) {
              this.interferences.splice(index, 1);
            }
          }
        }
      }
    }

    // 更新撤离状态（如果正在撤离）
    if (this.extractState === 'EXTRACTING') {
      // 更新撤离进度
      this.updateExtraction(deltaTime);
      
      // 更新玩家位置（允许移动躲避干扰）
      this.player.update();
      
      // 检查玩家是否死亡（区域外死亡）
      if (this.player.isDead()) {
        this.failExtraction('DEAD');
        return;
      }
      
      // 更新相机跟随
      this.camera.follow(this.player.x, this.player.y);
      this.camera.update();
      
      // 处理干扰波次和碰撞（仅在撤离中）
      const elapsed = (Date.now() - this.extractionStartTime) / 1000;
      
      // 检查是否需要生成干扰波次
      for (let i = 0; i < this.extractionWaveTimes.length; i++) {
        if (elapsed >= this.extractionWaveTimes[i] && !this.extractionWaveSpawned[i]) {
          this.spawnInterferenceWave(i);
          this.extractionWaveSpawned[i] = true;
        }
      }
      
      // 更新干扰实体
      for (const interference of this.interferences) {
        interference.update();
        
        // 检查与玩家碰撞（伤害处理在 Player.takeDamage 中，会根据是否在区域内决定是否扣血）
        if (interference.checkCollision(this.player.x, this.player.y)) {
          // 尝试扣血（如果不在区域内会扣血，在区域内不会扣血）
          this.player.takeDamage(interference.damage, this.extractionZone || undefined);
          if (this.player.isDead()) {
            this.failExtraction('DEAD');
            return;
          }
          // 如果不在区域内且未死亡，离开区域会取消撤离（在 updateExtraction 中处理）
          // 移除该干扰实体
          const index = this.interferences.indexOf(interference);
          if (index !== -1) {
            this.interferences.splice(index, 1);
          }
        }
      }
      
      return;
    }

    // CHANNELING 模式下更新读条进度（其他读条类型：采集灵气、移动物品）
    if (this.uiState.uiMode === 'CHANNELING') {
      this.channeling.updateChannelProgress(deltaTime);
      this.uiState.channelProgress = this.channeling.getProgress();
      return;
    }

    // INVENTORY 模式下不更新玩家和拾取提示
    if (this.uiState.uiMode === 'INVENTORY') {
      return;
    }

    // GAME 模式下的更新
    // 更新玩家
    this.player.update();

    // 检查玩家是否死亡
    if (this.player.isDead()) {
      this.failExtraction('DEAD');
      return;
    }

    // 查找最近的灵气点（优先级最高）
    this.nearestAuraNode = this.findNearestAuraNode();

    // 查找最近的掉落物
    this.nearestLoot = this.findNearestLoot();

    // 重置提示状态（每帧重新计算）
    let shouldShowPrompt = false;
    let promptName = '';
    let promptSize = 0;
    
    // 检查撤离区域状态
    if (this.extractionZone) {
      const isInZone = this.extractionZone.isPlayerInRange(this.player.x, this.player.y);
      
      // 处理进入区域
      if (isInZone && this.extractState === 'IDLE') {
        // 进入区域：自动开始撤离
        this.onEnterZone();
      }
      
      // 处理离开区域（独立检查，避免类型推断问题）
      if (!isInZone && (this.extractState as 'IDLE' | 'EXTRACTING' | 'SUCCESS') === 'EXTRACTING') {
        // 离开区域：取消撤离
        this.onLeaveZone();
      }
      
      // 显示撤离提示（仅在 IDLE 状态且不在读条时）
      if (isInZone && this.extractState === 'IDLE' && this.uiState.uiMode === 'GAME') {
        if (this.aura.getCurrent() < this.extractionZone.costAura) {
          shouldShowPrompt = true;
          promptName = `灵气不足（当前${this.aura.getCurrent()}/需要${this.extractionZone.costAura}）`;
          promptSize = 0;
        }
        // 如果灵气足够，会自动开始撤离，不需要显示提示
      }
    }
    
    // 更新 UI 状态（显示交互提示）- 仅在未设置撤离提示时检查
    if (!shouldShowPrompt && this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling()) {
      const isNotExtracting = (this.extractState as 'IDLE' | 'EXTRACTING' | 'SUCCESS') !== 'EXTRACTING';
      if (isNotExtracting) {
        // 优先显示灵气点采集提示
        if (this.nearestAuraNode) {
          shouldShowPrompt = true;
          promptName = `采集灵气(+${this.nearestAuraNode.gainAmount})`;
          promptSize = 0;
        } else if (this.nearestLoot && !this.uiState.showChoiceDialog && !this.uiState.showBagDialog) {
          // 其次显示物品拾取提示
          shouldShowPrompt = true;
          promptName = this.nearestLoot.item.name;
          promptSize = this.nearestLoot.item.size;
        }
      }
    }
    
    // 更新 UI 状态
    this.uiState.showPickupPrompt = shouldShowPrompt;
    this.uiState.pickupItemName = promptName;
    this.uiState.pickupItemSize = promptSize;

    // 更新相机跟随（主要跟随 x，横向卷轴）
    this.camera.follow(this.player.x, this.player.y);
    this.camera.update();
  }

  /**
   * 渲染游戏画面
   */
  private render(): void {
    // 收集所有可渲染对象（包括地面掉落物、灵气点、撤离点和干扰实体）
    const renderables: Renderable[] = [
      this.groundBand,
      ...this.obstacles,
      ...this.groundLoots,
      ...this.auraNodes,
      ...this.interferences,
      this.player
    ];

    // 渲染撤离点（如果存在）
    if (this.extractionZone) {
      renderables.push(this.extractionZone);
    }

    // 使用渲染器渲染（会自动按 y + sortOffset 排序）
    this.renderer.render(renderables, this.camera, this.debugDraw);
    
    // 渲染灵气点高亮（如果玩家在范围内且不在读条）
    if (this.nearestAuraNode && this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling()) {
      const ctx = this.renderer.getContext();
      // 重新渲染最近的灵气点（带高亮），覆盖之前的渲染
      this.nearestAuraNode.renderWithHighlight(ctx, this.camera, true);
    }
    
    // 渲染撤离点高亮（如果玩家在范围内且不在读条）
    if (this.extractionZone && this.extractionZone.isPlayerInRange(this.player.x, this.player.y) 
        && this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling()) {
      const ctx = this.renderer.getContext();
      // 重新渲染撤离点（带高亮），覆盖之前的渲染
      this.extractionZone.render(ctx, this.camera, true);
    }
    
    // 调试绘制：绘制 footprint
    if (this.debugDraw) {
      this.renderer.debugDrawFootprints(this.player, this.obstacles, this.camera);
    }

    // 渲染 UI
    // INVENTORY 模式下渲染背包面板
    if (this.uiState.uiMode === 'INVENTORY') {
      this.ui.renderInventoryPanel(
        this.bag,
        this.aura,
        (index) => this.handleMoveSafeToUnsafe(index),
        (index) => this.handleMoveUnsafeToSafe(index),
        (index) => this.handleDropFromSafe(index),
        (index) => this.handleDropFromUnsafe(index)
      );
    } else if (this.gamePhase === 'RESULT') {
      // RESULT 模式下渲染结算界面
      this.ui.renderResultScreen(
        this.uiState,
        () => this.restartGame()
      );
    } else {
      // GAME/CHANNELING 模式下渲染 HUD
      // 如果正在撤离，也显示撤离进度
      if (this.extractState === 'EXTRACTING') {
        this.ui.renderHUD(this.bag, this.aura, this.sessionTimer, this.player, this.uiState);
        this.ui.renderChanneling(this.uiState);
      } else {
        this.ui.renderHUD(this.bag, this.aura, this.sessionTimer, this.player, this.uiState);
      }
      
      // 渲染取舍弹窗
      if (this.uiState.showChoiceDialog) {
        this.ui.renderChoiceDialog(
          this.uiState,
          this.bag,
          () => this.handleDiscardNewItem(),
          () => this.handleOpenBag()
        );
      }

      // 渲染背包对话框
      if (this.uiState.showBagDialog) {
        const canPickup = this.uiState.pendingItem ? this.bag.canAddUnsafe(this.uiState.pendingItem) : false;
        this.ui.renderBagDialog(
          this.uiState,
          this.bag,
          (index) => this.handleDropFromBag(index),
          () => this.handlePickupPendingItem(),
          canPickup
        );
      }
    }
  }

  /**
   * 游戏循环
   */
  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // 更新
    this.update(deltaTime);

    // 渲染
    this.render();

    // 继续循环
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 启动游戏
   */
  start(): void {
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 停止游戏
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }
}
