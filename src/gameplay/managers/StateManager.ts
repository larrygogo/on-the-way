import { AppState, AppScreen, MenuPage } from '../state/AppState';
import { DungeonRunState } from '../state/DungeonRunState';
import { PlayerProfile } from '../state/PlayerProfile';
import { EventBus } from '../../core/events/EventBus';

/**
 * 统一状态管理器
 * 管理所有游戏状态，并使用事件系统同步状态变化
 */
export class StateManager {
  private appState: AppState;
  private dungeonRunState: DungeonRunState | null = null;
  private playerProfile: PlayerProfile;
  private eventBus: EventBus;

  constructor(appState: AppState, playerProfile: PlayerProfile) {
    this.appState = appState;
    this.playerProfile = playerProfile;
    this.eventBus = EventBus.getInstance();

    // 监听 AppState 变化并发送事件
    this.appState.addListener(() => {
      this.onAppStateChange();
    });
  }

  /**
   * 获取应用状态
   */
  getAppState(): AppState {
    return this.appState;
  }

  /**
   * 获取当前屏幕
   */
  getScreen(): AppScreen {
    return this.appState.getScreen();
  }

  /**
   * 设置屏幕
   */
  setScreen(screen: AppScreen): void {
    const previous = this.appState.getScreen();
    this.appState.setScreen(screen);
    
    // 事件已在 onAppStateChange 中发送
  }

  /**
   * 获取当前菜单页面
   */
  getMenuPage(): MenuPage {
    return this.appState.getMenuPage();
  }

  /**
   * 设置菜单页面
   */
  setMenuPage(page: MenuPage): void {
    const previous = this.appState.getMenuPage();
    this.appState.setMenuPage(page);
    
    // 事件已在 onAppStateChange 中发送
  }

  /**
   * 获取秘境运行状态
   */
  getDungeonRunState(): DungeonRunState | null {
    return this.dungeonRunState;
  }

  /**
   * 设置秘境运行状态
   */
  setDungeonRunState(state: DungeonRunState | null): void {
    this.dungeonRunState = state;
  }

  /**
   * 获取玩家档案
   */
  getPlayerProfile(): PlayerProfile {
    return this.playerProfile;
  }

  /**
   * 更新玩家档案
   */
  updatePlayerProfile(profile: PlayerProfile): void {
    this.playerProfile = profile;
  }

  /**
   * AppState 变化时的处理
   */
  private onAppStateChange(): void {
    // 发送屏幕切换事件
    // 注意：这里需要知道之前的屏幕状态，但 AppState 不保存历史
    // 实际使用时，可以在外部维护或通过事件系统获取
    const screen = this.appState.getScreen();
    const menuPage = this.appState.getMenuPage();

    // 发送菜单页面切换事件
    // 由于 AppState 不保存历史，这里只发送当前状态
    // 实际使用时可以通过其他方式获取 previous 值
    this.eventBus.emit('app:menu_page_change', {
      from: menuPage, // 这里应该是 previous，但 AppState 不提供
      to: menuPage
    });
  }

  /**
   * 重置所有状态
   */
  reset(): void {
    this.dungeonRunState = null;
    this.appState.setScreen('MAIN_MENU');
    this.appState.setMenuPage('HOME');
  }
}