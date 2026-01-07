/**
 * 应用屏幕状态
 */
export type AppScreen = 'MAIN_MENU' | 'RUN' | 'RESULT';

/**
 * 主菜单页面
 */
export type MenuPage = 'HOME' | 'START' | 'CULTIVATION' | 'STASH' | 'SETTINGS' | 'RESULT_SUMMARY';

/**
 * 应用状态管理器
 */
export class AppState {
  private screen: AppScreen = 'MAIN_MENU';
  private menuPage: MenuPage = 'HOME';
  private listeners: Array<() => void> = [];

  /**
   * 获取当前屏幕状态
   */
  getScreen(): AppScreen {
    return this.screen;
  }

  /**
   * 获取当前菜单页面
   */
  getMenuPage(): MenuPage {
    return this.menuPage;
  }

  /**
   * 设置屏幕状态
   */
  setScreen(screen: AppScreen): void {
    if (this.screen !== screen) {
      this.screen = screen;
      this.notifyListeners();
    }
  }

  /**
   * 设置菜单页面
   */
  setMenuPage(page: MenuPage): void {
    if (this.menuPage !== page) {
      this.menuPage = page;
      this.notifyListeners();
    }
  }

  /**
   * 添加状态变化监听器
   */
  addListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除状态变化监听器
   */
  removeListener(listener: () => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}
