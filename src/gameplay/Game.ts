import { Camera } from '../engine/render/Camera';
import { Player } from '../gameplay/entities/Player';
import { GroundBand } from '../engine/render/GroundBand';
import { Renderer } from '../engine/render/Renderer';
import { Obstacle } from '../gameplay/entities/Obstacle';
import { Renderable } from '../engine/render/Renderable';
import { GroundLoot } from '../gameplay/entities/GroundLoot';
import { ItemInstance } from '../gameplay/entities/Item';
import { Bag } from '../gameplay/systems/Bag';
import { UI, UIState } from '../gameplay/ui/UI';
import { Aura } from '../gameplay/systems/Aura';
import { AuraNode } from '../gameplay/entities/AuraNode';
import { Channeling, ChannelType } from '../gameplay/systems/Channeling';
import { SessionTimer } from '../gameplay/systems/SessionTimer';
import { ExtractionZone } from '../gameplay/entities/ExtractionZone';
import { Enemy } from '../gameplay/entities/Enemy';
import { GameConfig } from '../content/config/GameConfig';
import { MapLoader } from '../content/loaders/MapLoader';
import { WorldBuilder } from '../content/builders/WorldBuilder';
import { Collision } from '../engine/physics/Collision';
import { DungeonLoader } from '../content/loaders/DungeonLoader';
import { DungeonRunState } from '../gameplay/state/DungeonRunState';
import { PortalInstance } from '../gameplay/entities/PortalInstance';
import { PortalSpawner } from '../content/builders/PortalSpawner';
import { PortalChannelController } from '../gameplay/systems/PortalChannelController';
import { PortalTemplateLoader } from '../content/loaders/PortalTemplateLoader';
import { MapSwitcher } from '../content/runtime/MapSwitcher';
import { MobileControls } from '../gameplay/ui/MobileControls';
import { AppState } from './state/AppState';
import { PlayerProfile } from './state/PlayerProfile';
import { ProfileStore } from './state/ProfileStore';
import { UIManager } from '../ui/core/UIManager';
import { InventoryPanel } from '../ui/panels/InventoryPanel';

/**
 * 主游戏循环
 */
export class Game {
  private renderer: Renderer;
  private camera: Camera;
  private player: Player;
  private groundBand!: GroundBand; // 将在 initFromMap 中初始化
  private obstacles: Obstacle[] = [];
  private groundLoots: GroundLoot[] = [];
  private auraNodes: AuraNode[] = [];
  private extractionZone: ExtractionZone | null = null;
  private enemies: Enemy[] = [];
  private bag: Bag;
  private aura: Aura;
  private channeling: Channeling;
  private sessionTimer: SessionTimer;
  private ui: UI;
  private gamePhase: 'RUNNING' | 'RESULT' = 'RUNNING';
  private appState: AppState;
  private playerProfile: PlayerProfile;
  private extractState: 'IDLE' | 'EXTRACTING' | 'SUCCESS' = 'IDLE';
  private extractProgress: number = 0; // 撤离进度（秒）
  private lastEnemySpawnTime: number = 0; // 上次刷新敌人的时间
  private enemyRefreshConfig: {
    intervalSec: number;
    maxAlive: number;
    minDistanceToPlayer: number;
    weights?: { normal?: number; elite?: number };
  } | null = null; // 敌人刷新配置（从地图配置加载）
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
  
  // 秘境系统
  private dungeonRunState: DungeonRunState | null = null;
  private portalInstances: PortalInstance[] = [];
  private portalChannelController: PortalChannelController;
  private nearestPortal: PortalInstance | null = null;

  // 移动端控制
  private mobileControls: MobileControls | null = null;
  private portraitOverlayDismissed: boolean = false; // 竖屏提示遮罩是否已关闭

  // 新 UI 系统
  private uiManager: UIManager | null = null;
  private inventoryPanel: InventoryPanel | null = null;

  constructor(canvas: HTMLCanvasElement, appState: AppState, playerProfile: PlayerProfile, uiManager?: UIManager) {
    this.appState = appState;
    this.playerProfile = playerProfile;
    // 初始化渲染器
    this.renderer = new Renderer(canvas);

    // 保存 UIManager（如果提供）
    this.uiManager = uiManager || null;

    // 初始化 UI（传入 UIManager 以启用新系统）
    this.ui = new UI(canvas, uiManager);

    // 如果使用新 UI 系统，创建 InventoryPanel
    if (this.uiManager) {
      this.inventoryPanel = new InventoryPanel();
      this.inventoryPanel.setOnClose(() => {
        this.uiState.showBagDialog = false;
        this.uiState.uiMode = 'GAME';
      });
      this.inventoryPanel.setOnItemClick((area, index) => {
        if (area === 'safe') {
          // 点击安全区物品的处理（暂时保留旧逻辑）
        } else {
          // 点击普通区物品的处理（暂时保留旧逻辑）
        }
      });
    }

    // 初始化相机
    this.camera = new Camera();
    
    // 设置相机屏幕中心和尺寸
    const center = this.renderer.getScreenCenter();
    const size = this.renderer.getScreenSize();
    this.camera.setScreenCenter(center.x, center.y, size.width, size.height);
    
    // 启用 Y 方向跟随（使玩家始终在屏幕中心，除非到达地图边缘）
    this.camera.setFollowY(true);

    // 初始化储物袋
    this.bag = new Bag();

    // 初始化灵气系统
    this.aura = new Aura();

    // 初始化读条系统
    this.channeling = new Channeling();

    // 初始化传送门读条控制器
    this.portalChannelController = new PortalChannelController();

    // 初始化全局倒计时
    this.sessionTimer = new SessionTimer(12 * 60);

    // 初始化玩家（临时位置，后续从地图配置加载）
    this.player = new Player(100, 400, 0);
    
    // 设置玩家配置（基础值 + 修炼点加成）
    const baseHp = GameConfig.player.maxHp;
    const baseAtk = GameConfig.player.attackDamage;
    this.player.maxHp = baseHp + playerProfile.attrs.hp;
    this.player.hp = this.player.maxHp;
    this.player.attackDamage = baseAtk + playerProfile.attrs.atk;
    this.player.attackRange = GameConfig.player.attackRange;
    this.player.attackYThreshold = GameConfig.player.attackYThreshold;
    this.player.attackCooldown = GameConfig.player.attackCooldown;
    
    // 应用移动速度加成（如果有 move 属性影响速度）
    // 注意：Player 的 speed 是私有属性，可能需要通过其他方式设置
    // 这里先保留，后续可以根据需要调整

    // 初始化移动端控制（如果支持）
    this.setupMobileControls(canvas);

    // 设置输入处理
    this.setupInput();
    
    // 设置调试开关（按 F1 切换）
    this.setupDebugToggle();

    // 设置窗口大小变化处理
    window.addEventListener('resize', () => {
      this.renderer.handleResize();
      // 更新相机屏幕中心和尺寸
      const newCenter = this.renderer.getScreenCenter();
      const newSize = this.renderer.getScreenSize();
      this.camera.setScreenCenter(newCenter.x, newCenter.y, newSize.width, newSize.height);
    });

    // 设置鼠标点击处理（用于背包对话框）
    canvas.addEventListener('click', (e) => {
      this.handleClick(e);
    });
  }

  /**
   * 进入秘境
   * @param dungeonId 秘境ID
   * @param seed 随机种子（可选）
   */
  async enterDungeon(dungeonId: string, seed?: number): Promise<void> {
    try {
      // 重新加载 profile（确保最新）
      this.playerProfile = ProfileStore.loadProfile();
      
      // 注入出战安全区物品到 Bag
      for (const item of this.playerProfile.loadoutSafeItems) {
        this.bag.addSafe(item);
      }
      
      // 加载传送门模板（如果尚未加载）
      if (!PortalTemplateLoader.isLoaded()) {
        await PortalTemplateLoader.loadPortalTemplates();
      }

      // 加载秘境配置
      const dungeonConfig = await DungeonLoader.loadDungeonConfig(dungeonId);
      
      // 创建秘境运行状态
      this.dungeonRunState = new DungeonRunState(dungeonId, dungeonConfig, seed);
      
      // 初始化入口地图
      await this.initFromMap(dungeonConfig.entryMapId, true);
      
      console.log(`[Game] 进入秘境: ${dungeonId}`);
    } catch (error) {
      console.error('[Game] 进入秘境失败:', error);
      throw error;
    }
  }

  /**
   * 从地图配置初始化世界
   * @param mapId 地图ID（例如 "map_001"）
   * @param isDungeonMode 是否为秘境模式（影响传送门生成）
   */
  async initFromMap(mapId: string, isDungeonMode: boolean = false): Promise<void> {
    try {
      // 加载地图配置
      const mapConfig = await MapLoader.loadMap(mapId);
      
      // 从配置构建世界
      const world = WorldBuilder.buildFromConfig(mapConfig);
      
      // 设置地面带
      this.groundBand = world.groundBand;
      
      // 设置障碍物
      this.obstacles = world.obstacles;
      this.player.setObstacles(this.obstacles);
      
      // 设置撤离点
      this.extractionZone = world.extractionZone;
      
      // 设置灵气点
      this.auraNodes = world.auraNodes;
      
      // 设置地面掉落物
      this.groundLoots = world.lootDrops;
      
      // 设置敌人
      this.enemies = world.enemies;
      this.enemyRefreshConfig = world.enemyRefreshConfig;
      
      // 设置玩家可走区域和位置
      const walkArea = world.walkArea;
      this.player.setWalkArea(walkArea);
      
      // 计算地图边界并设置相机边界限制
      let mapBounds: { minX: number; maxX: number; minY: number; maxY: number };
      if (walkArea.type === 'rect') {
        const rect = walkArea.rect;
        mapBounds = {
          minX: rect.x,
          maxX: rect.x + rect.width,
          minY: rect.y,
          maxY: rect.y + rect.height
        };
      } else {
        // 多边形：计算边界框
        const bounds = Collision.getPolygonBounds(walkArea.points);
        mapBounds = {
          minX: bounds.x,
          maxX: bounds.x + bounds.width,
          minY: bounds.y,
          maxY: bounds.y + bounds.height
        };
      }
      
      // 获取屏幕尺寸并设置相机边界
      const screenSize = this.renderer.getScreenSize();
      const screenCenter = this.renderer.getScreenCenter();
      this.camera.setScreenCenter(
        screenCenter.x,
        screenCenter.y,
        screenSize.width,
        screenSize.height
      );
      this.camera.setMapBounds(mapBounds.minX, mapBounds.maxX, mapBounds.minY, mapBounds.maxY);
      
      // 如果是在秘境模式下，生成传送门
      if (isDungeonMode && this.dungeonRunState) {
        this.portalInstances = PortalSpawner.spawnPortalsForMap(
          mapId,
          this.dungeonRunState.dungeonConfig,
          mapConfig
        );
        this.dungeonRunState.portalInstances = this.portalInstances;
      } else {
        this.portalInstances = [];
      }
      
      // 设置玩家位置（使用地图配置的 spawnPoints 或默认位置）
      const spawnPoint = MapSwitcher.getSpawnPoint(mapConfig);
      this.player.x = spawnPoint.x;
      this.player.y = spawnPoint.y;
      
      // 设置敌人刷新配置
      this.lastEnemySpawnTime = Date.now();
      
      console.log(`[Game] 地图加载成功: ${mapConfig.name} (${mapConfig.id})`);
    } catch (error) {
      console.error('[Game] 地图加载失败:', error);
      throw error;
    }
  }

  /**
   * 刷新敌人
   * 核心函数：refreshEnemies
   */
  private refreshEnemies(_deltaTime: number): void {
    if (!this.enemyRefreshConfig) {
      return; // 配置未加载，不刷新
    }
    
    const refreshConfig = this.enemyRefreshConfig;
    const now = Date.now();
    const timeSinceLastSpawn = (now - this.lastEnemySpawnTime) / 1000;
    
    // 检查是否到达刷新时间
    if (timeSinceLastSpawn < refreshConfig.intervalSec) {
      return;
    }
    
    // 检查是否超过上限
    const aliveCount = this.enemies.filter(e => !e.isEnemyDead()).length;
    if (aliveCount >= refreshConfig.maxAlive) {
      return;
    }
    
    // 尝试生成新怪物
    const playerPos = this.player.getPosition();
    const walkArea = this.groundBand.getWalkArea();
    
    // 从 GameConfig 获取刷新点（如果地图配置中没有，使用默认配置）
    const spawnPoints = GameConfig.enemy.spawn.spawnPoints;
    
    // 随机打乱spawnPoints，找到合适的刷新点
    const shuffledPoints = [...spawnPoints].sort(() => Math.random() - 0.5);
    
    for (const point of shuffledPoints) {
      // 检查距离玩家是否足够远
      const dx = point.x - playerPos.x;
      const dy = point.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < refreshConfig.minDistanceToPlayer) {
        continue; // 太近了，跳过
      }
      
      // 确保位置在地图范围内
      let clampedX = point.x;
      let clampedY = point.y;
      if (walkArea.type === 'rect') {
        clampedX = Math.max(walkArea.rect.x, Math.min(walkArea.rect.x + walkArea.rect.width, point.x));
        clampedY = Math.max(walkArea.rect.y, Math.min(walkArea.rect.y + walkArea.rect.height, point.y));
      } else {
        const clamped = Collision.clampPointToPolygon({ x: point.x, y: point.y }, walkArea.points);
        clampedX = clamped.x;
        clampedY = clamped.y;
      }
      
      // 根据权重决定生成普通怪还是精英怪
      let enemyType: 'NORMAL' | 'ELITE' = 'NORMAL';
      if (refreshConfig.weights) {
        const rand = Math.random();
        const normalWeight = refreshConfig.weights.normal ?? 0.8;
        if (rand > normalWeight) {
          enemyType = 'ELITE';
        }
      }
      
      const enemy = new Enemy(enemyType, clampedX, clampedY);
      enemy.setObstacles(this.obstacles);
      enemy.setWalkArea(walkArea);
      this.enemies.push(enemy);
      
      this.lastEnemySpawnTime = now;
      break; // 每次只生成一个
    }
  }


  /**
   * 设置移动端控制
   */
  private setupMobileControls(canvas: HTMLCanvasElement): void {
    this.mobileControls = new MobileControls(canvas, {
      onInteract: () => {
        // 交互按钮（E 键功能）
        if (this.uiState.uiMode === 'GAME' && !this.uiState.showChoiceDialog && !this.uiState.showBagDialog) {
          // 优先处理传送门交互
          if (this.nearestPortal && !this.portalChannelController.isChannelingNow() && !this.channeling.isChanneling()) {
            this.handlePortalInteraction();
            return;
          }
          // 其次处理灵气点采集
          if (this.nearestAuraNode && !this.channeling.isChanneling()) {
            this.handleCollectAura();
            return;
          }
          // 最后处理物品拾取
          if (this.nearestLoot) {
            this.handlePickup();
            return;
          }
        }
      },
      onAttack: () => {
        // 攻击按钮
        if (this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling() && !this.portalChannelController.isChannelingNow()) {
          this.handlePlayerAttack();
        }
      },
      onBag: () => {
        // 背包按钮（I/Tab 键功能）
        this.toggleInventory();
      },
      onCancel: () => {
        // 取消按钮（Esc 键功能）
        if (this.uiState.uiMode === 'CHANNELING') {
          this.cancelChanneling();
        } else if (this.uiState.uiMode === 'INVENTORY') {
          this.closeInventory();
        } else if (this.uiState.showBagDialog) {
          this.uiState.showBagDialog = false;
          this.uiState.showChoiceDialog = false;
          this.uiState.pendingItem = null;
        }
      }
    });
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

      // CHANNELING 模式下，只允许取消和移动（如果是撤离读条或传送门读条）
      if (this.uiState.uiMode === 'CHANNELING') {
        if (e.key === 'Escape') {
          this.cancelChanneling();
          return;
        }
        // 撤离读条期间允许移动（WASD）
        if (this.extractState === 'EXTRACTING') {
          // 允许 WASD 移动
          this.player.handleKeyDown(e.key);
          return;
        }
        // 传送门读条期间允许移动（WASD）
        if (this.portalChannelController.isChannelingNow()) {
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

      // GAME 模式下的 E 键交互（优先级：Portal > AuraNode > GroundLoot）
      if (e.key.toLowerCase() === 'e' && !this.uiState.showChoiceDialog && !this.uiState.showBagDialog) {
        // 优先处理传送门交互
        if (this.nearestPortal && !this.portalChannelController.isChannelingNow() && !this.channeling.isChanneling()) {
          this.handlePortalInteraction();
          return;
        }
        // 其次处理灵气点采集
        if (this.nearestAuraNode && !this.channeling.isChanneling()) {
          this.handleCollectAura();
          return;
        }
        // 最后处理物品拾取
        if (this.nearestLoot) {
          this.handlePickup();
          return;
        }
      }

      // F 键撤离已移除，改为自动开始

      // 空格键攻击
      if (e.key === ' ' && this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling() && !this.portalChannelController.isChannelingNow()) {
        e.preventDefault();
        this.handlePlayerAttack();
        return;
      }

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
    // 如果是传送门读条，取消传送门读条
    if (this.portalChannelController.isChannelingNow()) {
      this.portalChannelController.cancel('user_cancel');
      this.uiState.uiMode = 'GAME';
      this.uiState.channelType = null;
      this.uiState.channelProgress = 0;
      return;
    }

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
    
    // 停止游戏循环
    this.stop();
    
    // 保存结算前的物品状态（在清空之前）
    const safeItems = this.bag.getSafeItems();
    const unsafeItems = this.bag.getUnsafeItems();
    
    // 结算物品并保存到 profile
    if (reason === 'SUCCESS') {
      // 成功：保留 safe + unsafe，都加入仓库
      this.playerProfile.stashItems.push(...safeItems, ...unsafeItems);
    } else {
      // 失败：只保留 safe，加入仓库
      this.playerProfile.stashItems.push(...safeItems);
    }
    
    // 保存 profile
    ProfileStore.saveProfile(this.playerProfile);
    
    // 清空 Bag（为下一局做准备）
    // 注意：这里需要清空 Bag，但我们已经保存了物品
    // Bag 类没有 clear 方法，我们需要手动清空
    const allSafeItems = this.bag.getSafeItems();
    const allUnsafeItems = this.bag.getUnsafeItems();
    for (let i = allSafeItems.length - 1; i >= 0; i--) {
      this.bag.dropFromSafe(i);
    }
    for (let i = allUnsafeItems.length - 1; i >= 0; i--) {
      this.bag.dropFromUnsafe(i);
    }
    
    // 更新 UI 状态
    this.uiState.uiMode = 'GAME';
    this.uiState.channelProgress = 0;
    this.uiState.channelType = null;
    
    // 设置结算信息（将在 UI 中显示）
    this.uiState.resultReason = reason;
    this.uiState.resultSafeItems = safeItems;
    this.uiState.resultUnsafeItems = reason === 'SUCCESS' ? unsafeItems : [];
    this.uiState.resultLostItems = reason === 'SUCCESS' ? [] : unsafeItems;
    
    // 切换到主界面 RESULT 状态
    this.appState.setScreen('RESULT');
    this.appState.setMenuPage('RESULT_SUMMARY');
    
    console.log('[Game] 进入结算阶段:', reason);
  }

  /**
   * 重新开始游戏
   */
  private async restartGame(): Promise<void> {
    // 重置玩家位置和状态
    const walkArea = this.groundBand.getWalkArea();
    if (walkArea.type === 'rect') {
      this.player.x = walkArea.rect.x + 100;
      this.player.y = walkArea.rect.y + walkArea.rect.height / 2;
    } else {
      // 多边形：使用边界框的中心左侧
      const bounds = Collision.getPolygonBounds(walkArea.points);
      this.player.x = bounds.x + 100;
      this.player.y = bounds.y + bounds.height / 2;
    }
    this.player.reset();
    
    // 重置倒计时和灵气
    this.sessionTimer.reset();
    this.aura = new Aura();
    
    // 重新加载地图（重新生成所有内容）
    await this.initFromMap('map_001');
    
    // 重置游戏阶段和撤离状态
    this.gamePhase = 'RUNNING';
    this.extractState = 'IDLE';
    this.extractProgress = 0;
    
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
   * 查找最近的传送门
   */
  private findNearestPortal(): PortalInstance | null {
    let nearest: PortalInstance | null = null;
    let minDistance = Infinity;

    for (const portal of this.portalInstances) {
      if (portal.isPlayerInRange(this.player.x, this.player.y)) {
        const dx = portal.position.x - this.player.x;
        const dy = portal.position.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearest = portal;
        }
      }
    }

    return nearest;
  }

  /**
   * 更新传送门交互
   */
  private updatePortals(deltaTime: number): void {
    // 查找最近的传送门
    this.nearestPortal = this.findNearestPortal();

    // 如果正在读条，更新进度
    if (this.portalChannelController.isChannelingNow()) {
      const playerPos = { x: this.player.x, y: this.player.y };
      const targetMapId = this.portalChannelController.update(deltaTime, playerPos);

      if (targetMapId) {
        // 读条完成，切换地图
        this.switchMap(targetMapId);
      } else {
        // 更新UI进度
        this.uiState.channelProgress = this.portalChannelController.getProgress();
      }
    }
  }

  /**
   * 处理传送门交互
   */
  private handlePortalInteraction(): void {
    if (!this.nearestPortal) {
      return;
    }

    // 检查灵气是否足够
    if (this.nearestPortal.costSpirit && 
        !this.aura.canSpendAura(this.nearestPortal.costSpirit)) {
      console.log(`传送失败：灵气不足（需要 ${this.nearestPortal.costSpirit}）`);
      return;
    }

    // 开始读条
    this.portalChannelController.beginChannel(this.nearestPortal);
    this.uiState.uiMode = 'CHANNELING';
    this.uiState.channelType = 'PORTAL';
    this.uiState.channelProgress = 0;
  }

  /**
   * 切换地图
   */
  private async switchMap(toMapId: string): Promise<void> {
    if (!this.dungeonRunState) {
      console.error('[Game] 不在秘境模式，无法切换地图');
      return;
    }

    try {
      // 保存玩家状态
      const playerState = MapSwitcher.preservePlayerState(this.player, this.bag, this.aura);

      // 清理当前地图实体
      this.enemies = [];
      this.groundLoots = [];
      this.auraNodes = [];
      this.portalInstances = [];

      // 切换地图
      const result = await MapSwitcher.switchMap(
        toMapId,
        undefined,
        this.dungeonRunState
      );

      // 设置新地图的世界
      this.groundBand = result.world.groundBand;
      this.obstacles = result.world.obstacles;
      this.player.setObstacles(this.obstacles);
      this.extractionZone = result.world.extractionZone;
      this.auraNodes = result.world.auraNodes;
      this.groundLoots = result.world.lootDrops;
      this.enemies = result.world.enemies;
      this.enemyRefreshConfig = result.world.enemyRefreshConfig;

      // 设置玩家位置
      this.player.setWalkArea(result.world.walkArea);
      this.player.x = result.spawnPoint.x;
      this.player.y = result.spawnPoint.y;

      // 恢复玩家状态
      MapSwitcher.restorePlayerState(this.player, this.bag, this.aura, playerState);

      // 生成新地图的传送门
      if (this.dungeonRunState) {
        this.portalInstances = PortalSpawner.spawnPortalsForMap(
          toMapId,
          this.dungeonRunState.dungeonConfig,
          result.mapConfig
        );
        this.dungeonRunState.portalInstances = this.portalInstances;
      }

      // 重置敌人刷新时间
      this.lastEnemySpawnTime = Date.now();

      // 重置传送门读条状态
      this.portalChannelController.cancel('map_switch');
      this.uiState.uiMode = 'GAME';
      this.uiState.channelType = null;
      this.uiState.channelProgress = 0;

      console.log(`[Game] 地图切换成功: ${toMapId}`);
    } catch (error) {
      console.error('[Game] 地图切换失败:', error);
    }
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
   * 处理玩家攻击
   * 核心函数：handlePlayerAttack
   */
  private handlePlayerAttack(): void {
    // 检查是否可以攻击
    if (!this.player.canAttack()) {
      return;
    }

    // 执行攻击（更新冷却时间）
    if (!this.player.attack()) {
      return;
    }

    // 检查范围内的敌人并造成伤害
    let hitAny = false;

    for (const enemy of this.enemies) {
      if (enemy.isEnemyDead()) {
        continue;
      }

      // 使用玩家的命中检测
      if (this.player.hitTest(enemy.x, enemy.y)) {
        // 命中敌人，造成伤害
        enemy.takeDamage(this.player.attackDamage);
        hitAny = true;

        // 如果敌人死亡，给予灵气奖励
        if (enemy.isEnemyDead()) {
          this.aura.addAura(enemy.auraReward);
          console.log(`击杀敌人，获得 ${enemy.auraReward} 灵气`);
        }
      }
    }

    if (hitAny) {
      console.log('攻击命中敌人');
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
    // 如果使用新 UI 系统，打开 InventoryPanel
    if (this.uiManager && this.inventoryPanel) {
      // 更新布局（响应式）
      const layoutState = this.uiManager.getLayoutState();
      this.inventoryPanel.updateLayout(layoutState);
      this.inventoryPanel.setData(this.bag, this.aura);
      this.uiManager.open(this.inventoryPanel, { layer: 'modal' });
    }
    
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
      // 如果使用新 UI 系统，关闭 InventoryPanel
      if (this.uiManager && this.inventoryPanel && this.inventoryPanel.isOpen) {
        this.uiManager.close(this.inventoryPanel);
      }
      
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
      
      // 刷新敌人（非撤离期间）
      if (this.extractState !== 'EXTRACTING') {
        this.refreshEnemies(deltaTime);
      }

      // 更新敌人（非撤离期间）
      if (this.extractState !== 'EXTRACTING') {
        const playerPos = this.player.getPosition();
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
          const enemy = this.enemies[i];
          
          if (enemy.isEnemyDead()) {
            // 移除已死亡的敌人
            this.enemies.splice(i, 1);
            continue;
          }

          // 更新敌人AI（包括移动和攻击）
          enemy.updateAI(
            deltaTime,
            playerPos.x,
            playerPos.y,
            (damage: number) => {
              // 敌人攻击回调：对玩家造成伤害
              this.player.takeDamage(damage, this.extractionZone || undefined);
              if (this.player.isDead()) {
                this.failExtraction('DEAD');
              }
            }
          );
        }
      }
    }

    // 更新撤离状态（如果正在撤离）
    if (this.extractState === 'EXTRACTING') {
      // 更新移动端控制状态（撤离期间允许移动）
      if (this.mobileControls) {
        this.mobileControls.update();
        this.mobileControls.setJoystickEnabled(true);
        const joystickState = this.mobileControls.getJoystickState();
        // 只有当摇杆激活时才使用移动向量，否则清除让键盘输入工作
        if (joystickState.active) {
          const moveVec = this.mobileControls.getMoveVector();
          this.player.setMoveVector(moveVec.x, moveVec.y);
        } else {
          this.player.clearMoveVector();
        }
      }

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
      
      return;
    }

    // CHANNELING 模式下更新读条进度
    if (this.uiState.uiMode === 'CHANNELING') {
      // 更新移动端控制状态
      if (this.mobileControls) {
        this.mobileControls.update();
        
        // 根据读条类型设置摇杆可用性
        let joystickEnabled = false;
        if (this.portalChannelController.isChannelingNow()) {
          // 传送门读条：允许移动
          joystickEnabled = true;
        }
        this.mobileControls.setJoystickEnabled(joystickEnabled);
        
        if (joystickEnabled) {
          const joystickState = this.mobileControls.getJoystickState();
          // 只有当摇杆激活时才使用移动向量，否则清除让键盘输入工作
          if (joystickState.active) {
            const moveVec = this.mobileControls.getMoveVector();
            this.player.setMoveVector(moveVec.x, moveVec.y);
          } else {
            this.player.clearMoveVector();
          }
        } else {
          this.player.clearMoveVector();
        }
      }

      // 如果是传送门读条，使用传送门控制器更新
      if (this.portalChannelController.isChannelingNow()) {
        this.updatePortals(deltaTime);
        // 更新玩家位置（允许移动）
        this.player.update();
        // 更新相机跟随
        this.camera.follow(this.player.x, this.player.y);
        this.camera.update();
        return;
      }
      // 其他读条类型（采集灵气、移动物品）
      this.channeling.updateChannelProgress(deltaTime);
      this.uiState.channelProgress = this.channeling.getProgress();
      return;
    }

    // 更新移动端控制状态
    if (this.mobileControls) {
      this.mobileControls.update();

      // 根据输入优先级规则设置摇杆可用性
      let joystickEnabled = true;
      if (this.uiState.uiMode === 'INVENTORY') {
        // 背包打开时：摇杆不控制移动
        joystickEnabled = false;
      } else if ((this.uiState.uiMode as string) === 'CHANNELING') {
        // 读条进行时：按现有规则
        if ((this.extractState as string) === 'EXTRACTING' || this.portalChannelController.isChannelingNow()) {
          // 撤离/传送门读条：允许移动
          joystickEnabled = true;
        } else {
          // 其他读条（采集/转移）：禁止移动
          joystickEnabled = false;
        }
      }
      this.mobileControls.setJoystickEnabled(joystickEnabled);

      // 更新玩家移动向量
      if (joystickEnabled) {
        const joystickState = this.mobileControls.getJoystickState();
        // 只有当摇杆激活时才使用移动向量，否则清除让键盘输入工作
        if (joystickState.active) {
          const moveVec = this.mobileControls.getMoveVector();
          this.player.setMoveVector(moveVec.x, moveVec.y);
        } else {
          this.player.clearMoveVector();
        }
      } else {
        this.player.clearMoveVector();
      }
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

    // 查找最近的传送门（优先级最高）
    if (this.dungeonRunState) {
      this.nearestPortal = this.findNearestPortal();
    }

    // 查找最近的灵气点
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
    if (!shouldShowPrompt && this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling() && !this.portalChannelController.isChannelingNow()) {
      const isNotExtracting = (this.extractState as 'IDLE' | 'EXTRACTING' | 'SUCCESS') !== 'EXTRACTING';
      if (isNotExtracting) {
        // 优先显示传送门提示
        if (this.nearestPortal) {
          shouldShowPrompt = true;
          const costText = this.nearestPortal.costSpirit ? ` (消耗${this.nearestPortal.costSpirit}灵气)` : '';
          promptName = `按 E 传送${costText}`;
          promptSize = 0;
        } else if (this.nearestAuraNode) {
          // 其次显示灵气点采集提示
          shouldShowPrompt = true;
          promptName = `采集灵气(+${this.nearestAuraNode.gainAmount})`;
          promptSize = 0;
        } else if (this.nearestLoot && !this.uiState.showChoiceDialog && !this.uiState.showBagDialog) {
          // 最后显示物品拾取提示
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
    // 收集所有可渲染对象（包括地面掉落物、灵气点、撤离点和敌人）
    const renderables: Renderable[] = [
      this.groundBand,
      ...this.obstacles,
      ...this.groundLoots,
      ...this.auraNodes,
      ...this.enemies,
      this.player
    ];

    // 渲染撤离点（如果存在）
    if (this.extractionZone) {
      renderables.push(this.extractionZone);
    }

    // 渲染传送门（如果存在）
    if (this.portalInstances.length > 0) {
      renderables.push(...this.portalInstances);
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
        && this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling() && !this.portalChannelController.isChannelingNow()) {
      const ctx = this.renderer.getContext();
      // 重新渲染撤离点（带高亮），覆盖之前的渲染
      this.extractionZone.render(ctx, this.camera, true);
    }

    // 渲染传送门高亮（如果玩家在范围内且不在读条）
    if (this.nearestPortal && this.uiState.uiMode === 'GAME' && !this.channeling.isChanneling() && !this.portalChannelController.isChannelingNow()) {
      const ctx = this.renderer.getContext();
      // 重新渲染最近的传送门（带高亮），覆盖之前的渲染
      this.nearestPortal.render(ctx, this.camera, true);
    }
    
    // 调试绘制：绘制 footprint
    if (this.debugDraw) {
      this.renderer.debugDrawFootprints(this.player, this.obstacles, this.camera);
    }

    // 渲染 UI
    // INVENTORY 模式下渲染背包面板
    if (this.uiState.uiMode === 'INVENTORY') {
      // 如果使用新 UI 系统，InventoryPanel 已经通过 UIManager 渲染
      // 否则使用旧实现
      if (!this.uiManager || !this.inventoryPanel || !this.inventoryPanel.isOpen) {
        this.ui.renderInventoryPanel(
          this.bag,
          this.aura,
          (index) => this.handleMoveSafeToUnsafe(index),
          (index) => this.handleMoveUnsafeToSafe(index),
          (index) => this.handleDropFromSafe(index),
          (index) => this.handleDropFromUnsafe(index)
        );
      }
    } else if (this.gamePhase === 'RESULT') {
      // RESULT 模式下渲染结算界面
      this.ui.renderResultScreen(
        this.uiState,
        async () => { await this.restartGame(); }
      );
    } else {
      // GAME/CHANNELING 模式下渲染 HUD
      // 如果正在撤离或传送门读条，显示读条进度
      if (this.extractState === 'EXTRACTING' || this.portalChannelController.isChannelingNow()) {
        this.ui.renderHUD(this.bag, this.aura, this.sessionTimer, this.player, this.uiState, this.mobileControls);
        this.ui.renderChanneling(this.uiState);
      } else {
        this.ui.renderHUD(this.bag, this.aura, this.sessionTimer, this.player, this.uiState, this.mobileControls);
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

      // 渲染竖屏提示遮罩（如果是移动端且竖屏且未关闭）
      if (this.ui.isMobile() && this.ui.isPortrait() && !this.portraitOverlayDismissed) {
        this.ui.renderPortraitOverlay(() => {
          this.portraitOverlayDismissed = true;
        });
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
    this.appState.setScreen('RUN');
    // 标记游戏正在运行（用于事件处理）
    const canvas = this.renderer.getCanvas();
    if (canvas) {
      canvas.setAttribute('data-game-running', 'true');
    }
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  /**
   * 获取 UI 状态（用于主界面渲染结算页面）
   */
  getUIState(): UIState {
    return this.uiState;
  }

  /**
   * 停止游戏
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    // 移除游戏运行标记
    const canvas = this.renderer.getCanvas();
    if (canvas) {
      canvas.removeAttribute('data-game-running');
    }
  }
}
