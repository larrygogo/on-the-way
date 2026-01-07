import { ItemInstance } from '../../gameplay/entities/Item';

/**
 * 游戏事件类型定义
 * 用于类型安全的事件系统
 */

// ==================== 玩家事件 ====================

/**
 * 玩家移动事件
 */
export interface PlayerMoveEvent {
  x: number;
  y: number;
  z: number;
}

/**
 * 玩家受到伤害事件
 */
export interface PlayerDamageEvent {
  damage: number;
  currentHp: number;
  maxHp: number;
  isDead: boolean;
}

/**
 * 玩家死亡事件
 */
export interface PlayerDeathEvent {
  reason: 'DEAD' | 'TIMEOUT' | 'EXTRACT_INTERRUPTED';
}

/**
 * 玩家攻击事件
 */
export interface PlayerAttackEvent {
  targetX: number;
  targetY: number;
  damage: number;
}

// ==================== 物品事件 ====================

/**
 * 物品拾取事件
 */
export interface ItemPickupEvent {
  item: ItemInstance;
  area: 'safe' | 'normal';
  success: boolean;
  reason?: string;
}

/**
 * 物品丢弃事件
 */
export interface ItemDropEvent {
  item: ItemInstance;
  x: number;
  y: number;
  z: number;
}

/**
 * 物品转移事件（普通区 → 安全区）
 */
export interface ItemTransferEvent {
  item: ItemInstance;
  fromArea: 'normal';
  toArea: 'safe';
  auraCost: number;
  success: boolean;
}

// ==================== 背包事件 ====================

/**
 * 背包打开事件
 */
export interface BagOpenEvent {
  safeItems: ItemInstance[];
  normalItems: ItemInstance[];
}

/**
 * 背包关闭事件
 */
export interface BagCloseEvent {}

/**
 * 背包容量变化事件
 */
export interface BagCapacityChangeEvent {
  safeUsed: number;
  safeCapacity: number;
  normalUsed: number;
  normalCapacity: number;
}

// ==================== 灵气事件 ====================

/**
 * 灵气采集开始事件
 */
export interface AuraCollectStartEvent {
  nodeId: string;
  x: number;
  y: number;
}

/**
 * 灵气采集完成事件
 */
export interface AuraCollectCompleteEvent {
  nodeId: string;
  amount: number;
  totalAura: number;
  maxAura: number;
}

/**
 * 灵气变化事件
 */
export interface AuraChangeEvent {
  amount: number;
  totalAura: number;
  maxAura: number;
  reason: 'collect' | 'transfer' | 'extract' | 'other';
}

// ==================== 撤离事件 ====================

/**
 * 撤离开始事件
 */
export interface ExtractionStartEvent {
  requiredAura: number;
  duration: number;
}

/**
 * 撤离进度更新事件
 */
export interface ExtractionProgressEvent {
  progress: number; // 0-1
  remainingTime: number; // 秒
}

/**
 * 撤离完成事件
 */
export interface ExtractionCompleteEvent {
  success: boolean;
  safeItems: ItemInstance[];
  unsafeItems: ItemInstance[];
  lostItems: ItemInstance[];
}

/**
 * 撤离取消事件
 */
export interface ExtractionCancelEvent {
  reason: 'player_left' | 'interrupted';
}

// ==================== 敌人事件 ====================

/**
 * 敌人生成事件
 */
export interface EnemySpawnEvent {
  enemyId: string;
  x: number;
  y: number;
  z: number;
  type: 'normal' | 'elite';
}

/**
 * 敌人死亡事件
 */
export interface EnemyDeathEvent {
  enemyId: string;
  x: number;
  y: number;
  z: number;
}

/**
 * 敌人攻击事件
 */
export interface EnemyAttackEvent {
  enemyId: string;
  damage: number;
  targetX: number;
  targetY: number;
}

// ==================== 游戏状态事件 ====================

/**
 * 游戏开始事件
 */
export interface GameStartEvent {
  dungeonId: string;
  mapId: string;
  playerProfile: any; // PlayerProfile
}

/**
 * 游戏结束事件
 */
export interface GameEndEvent {
  reason: 'SUCCESS' | 'TIMEOUT' | 'DEAD' | 'EXTRACT_INTERRUPTED';
  duration: number; // 秒
}

/**
 * 倒计时更新事件
 */
export interface TimerUpdateEvent {
  remainingTime: number; // 秒
  totalTime: number; // 秒
  isExpired: boolean;
}

// ==================== 地图事件 ====================

/**
 * 地图切换事件
 */
export interface MapSwitchEvent {
  fromMapId: string;
  toMapId: string;
  portalId?: string;
}

/**
 * 地图加载完成事件
 */
export interface MapLoadCompleteEvent {
  mapId: string;
  obstacles: number;
  loots: number;
  auraNodes: number;
  enemies: number;
}

// ==================== 传送门事件 ====================

/**
 * 传送门激活事件
 */
export interface PortalActivateEvent {
  portalId: string;
  targetMapId: string;
  x: number;
  y: number;
  z: number;
}

/**
 * 传送门交互开始事件
 */
export interface PortalInteractStartEvent {
  portalId: string;
  duration: number;
}

/**
 * 传送门交互完成事件
 */
export interface PortalInteractCompleteEvent {
  portalId: string;
  success: boolean;
}

// ==================== UI事件 ====================

/**
 * UI提示显示事件
 */
export interface UIPromptShowEvent {
  type: 'pickup' | 'aura' | 'portal' | 'extraction';
  message: string;
  data?: any;
}

/**
 * UI提示隐藏事件
 */
export interface UIPromptHideEvent {
  type: 'pickup' | 'aura' | 'portal' | 'extraction';
}

/**
 * 读条开始事件
 */
export interface ChannelingStartEvent {
  type: 'aura' | 'transfer' | 'extraction' | 'portal';
  duration: number;
  data?: any;
}

/**
 * 读条更新事件
 */
export interface ChannelingProgressEvent {
  type: 'aura' | 'transfer' | 'extraction' | 'portal';
  progress: number; // 0-1
  remainingTime: number; // 秒
}

/**
 * 读条完成事件
 */
export interface ChannelingCompleteEvent {
  type: 'aura' | 'transfer' | 'extraction' | 'portal';
  success: boolean;
  data?: any;
}

/**
 * 读条取消事件
 */
export interface ChannelingCancelEvent {
  type: 'aura' | 'transfer' | 'extraction' | 'portal';
  reason?: string;
}

// ==================== 应用状态事件 ====================

/**
 * 屏幕切换事件
 */
export interface ScreenChangeEvent {
  from: 'MAIN_MENU' | 'RUN' | 'RESULT';
  to: 'MAIN_MENU' | 'RUN' | 'RESULT';
}

/**
 * 菜单页面切换事件
 */
export interface MenuPageChangeEvent {
  from: 'HOME' | 'START' | 'CULTIVATION' | 'STASH' | 'SETTINGS' | 'RESULT_SUMMARY';
  to: 'HOME' | 'START' | 'CULTIVATION' | 'STASH' | 'SETTINGS' | 'RESULT_SUMMARY';
}

// ==================== 事件映射 ====================

/**
 * 游戏事件映射
 * 用于类型安全的事件系统
 */
export interface GameEventMap {
  // 玩家事件
  'player:move': PlayerMoveEvent;
  'player:damage': PlayerDamageEvent;
  'player:death': PlayerDeathEvent;
  'player:attack': PlayerAttackEvent;

  // 物品事件
  'item:pickup': ItemPickupEvent;
  'item:drop': ItemDropEvent;
  'item:transfer': ItemTransferEvent;

  // 背包事件
  'bag:open': BagOpenEvent;
  'bag:close': BagCloseEvent;
  'bag:capacity_change': BagCapacityChangeEvent;

  // 灵气事件
  'aura:collect_start': AuraCollectStartEvent;
  'aura:collect_complete': AuraCollectCompleteEvent;
  'aura:change': AuraChangeEvent;

  // 撤离事件
  'extraction:start': ExtractionStartEvent;
  'extraction:progress': ExtractionProgressEvent;
  'extraction:complete': ExtractionCompleteEvent;
  'extraction:cancel': ExtractionCancelEvent;

  // 敌人事件
  'enemy:spawn': EnemySpawnEvent;
  'enemy:death': EnemyDeathEvent;
  'enemy:attack': EnemyAttackEvent;

  // 游戏状态事件
  'game:start': GameStartEvent;
  'game:end': GameEndEvent;
  'timer:update': TimerUpdateEvent;

  // 地图事件
  'map:switch': MapSwitchEvent;
  'map:load_complete': MapLoadCompleteEvent;

  // 传送门事件
  'portal:activate': PortalActivateEvent;
  'portal:interact_start': PortalInteractStartEvent;
  'portal:interact_complete': PortalInteractCompleteEvent;

  // UI事件
  'ui:prompt_show': UIPromptShowEvent;
  'ui:prompt_hide': UIPromptHideEvent;
  'channeling:start': ChannelingStartEvent;
  'channeling:progress': ChannelingProgressEvent;
  'channeling:complete': ChannelingCompleteEvent;
  'channeling:cancel': ChannelingCancelEvent;

  // 应用状态事件
  'app:screen_change': ScreenChangeEvent;
  'app:menu_page_change': MenuPageChangeEvent;
}