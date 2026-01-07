import './style.css';
import { Game } from './gameplay/Game';
import { AppState } from './gameplay/state/AppState';
import { ProfileStore } from './gameplay/state/ProfileStore';
import { PlayerProfile } from './gameplay/state/PlayerProfile';
import { MainMenuUI, ButtonClickResult } from './gameplay/ui/MainMenuUI';
import { DungeonLoader } from './content/loaders/DungeonLoader';
import { DungeonConfig } from './content/config/DungeonConfig';
import { ItemInstance } from './gameplay/entities/Item';
import { UIManager } from './ui/core/UIManager';
import { bindCanvasEvents } from './ui/integration/bindCanvasEvents';
import { bindResize } from './ui/integration/bindResize';
import { MainMenuPanel } from './ui/panels/MainMenuPanel';

// 获取 Canvas 元素
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('找不到 Canvas 元素');
}

// 初始化状态
const appState = new AppState();
let playerProfile: PlayerProfile = ProfileStore.loadProfile();
let game: Game | null = null;
let mainMenuUI: MainMenuUI;
let uiManager: UIManager;
let mainMenuPanel: MainMenuPanel | null = null;

// 主界面状态
let currentMenuPage: 'HOME' | 'START' | 'CULTIVATION' | 'STASH' | 'SETTINGS' | 'RESULT_SUMMARY' = 'HOME';
let previousMenuPage: 'HOME' | 'START' | 'CULTIVATION' | 'STASH' | 'SETTINGS' | 'RESULT_SUMMARY' | null = null;
let selectedDungeonIndex: number = -1;
let availableDungeons: Array<{ id: string; config: DungeonConfig }> = [];
let cultivationTempAttrs = { ...playerProfile.attrs };
let cultivationTempUnspentPoints = playerProfile.unspentPoints;
let stashTempItems: ItemInstance[] = [...playerProfile.stashItems];
let stashTempLoadoutItems: ItemInstance[] = [...playerProfile.loadoutSafeItems];
let settingsVolume: number = 1.0;
let settingsDebugEnabled: boolean = false;

// 初始化主界面 UI
mainMenuUI = new MainMenuUI(canvas);

// 加载可用秘境列表（写死列表，后续可以改为动态扫描）
async function loadAvailableDungeons(): Promise<void> {
  try {
    // 先写死列表，后续可以改为扫描 data/dungeons 目录
    const dungeonIds = ['demo_dungeon'];
    availableDungeons = [];
    
    for (const dungeonId of dungeonIds) {
      try {
        const config = await DungeonLoader.loadDungeonConfig(dungeonId);
        availableDungeons.push({ id: dungeonId, config });
      } catch (error) {
        console.error(`[Main] 加载秘境失败: ${dungeonId}`, error);
      }
    }
    
    if (availableDungeons.length > 0) {
      selectedDungeonIndex = 0;
    }
  } catch (error) {
    console.error('[Main] 加载秘境列表失败:', error);
  }
}

// 处理主界面点击（仅用于非 HOME 页面，HOME 页面使用新 UI 系统）
function handleMainMenuClick(e: MouseEvent | TouchEvent): void {
  if (appState.getScreen() !== 'MAIN_MENU' && appState.getScreen() !== 'RESULT') {
    return;
  }

  // 如果当前是 HOME 页面且使用新 UI，不处理（新 UI 系统会处理）
  if (currentMenuPage === 'HOME' && mainMenuPanel && mainMenuPanel.isOpen) {
    return;
  }

  // 只在主菜单模式下处理，避免与游戏内 UI 冲突
  e.preventDefault();
  e.stopPropagation();

  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
  
  if (!clientX || !clientY) return;

  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let result: ButtonClickResult | null = null;

  if (currentMenuPage === 'START') {
    result = mainMenuUI.checkStartPageClick(x, y, availableDungeons);
  } else if (currentMenuPage === 'CULTIVATION') {
    result = mainMenuUI.checkCultivationPageClick(x, y, playerProfile);
  } else if (currentMenuPage === 'STASH') {
    result = mainMenuUI.checkStashPageClick(x, y, stashTempItems, stashTempLoadoutItems);
  } else if (currentMenuPage === 'SETTINGS') {
    result = mainMenuUI.checkSettingsPageClick(x, y);
  } else if (currentMenuPage === 'RESULT_SUMMARY') {
    result = mainMenuUI.checkResultSummaryPageClick(x, y);
  }

  if (result && result.type === 'button') {
    handleMainMenuButton(result.buttonId || '');
  } else if (result && result.type === 'item') {
    handleMainMenuItemClick(result.itemIndex || 0);
  }
}

// 处理主界面按钮点击
function handleMainMenuButton(buttonId: string): void {
  if (currentMenuPage === 'HOME') {
    // HOME 页面的按钮点击由新 UI 系统处理，这里不应该被调用
    console.warn('[Main] HOME 页面按钮点击应该由新 UI 系统处理');
  } else if (currentMenuPage === 'START') {
    if (buttonId === 'enter' && selectedDungeonIndex >= 0) {
      startGame(availableDungeons[selectedDungeonIndex].id);
    } else if (buttonId === 'back') {
      previousMenuPage = currentMenuPage;
      currentMenuPage = 'HOME';
      appState.setMenuPage('HOME');
      if (mainMenuPanel) {
        mainMenuPanel.setHomePageVisible(true);
      }
    }
  } else if (currentMenuPage === 'CULTIVATION') {
    if (buttonId === 'save') {
      // 保存修炼点分配
      playerProfile.attrs = { ...cultivationTempAttrs };
      playerProfile.unspentPoints = cultivationTempUnspentPoints;
      ProfileStore.saveProfile(playerProfile);
      previousMenuPage = currentMenuPage;
      currentMenuPage = 'HOME';
      appState.setMenuPage('HOME');
      if (mainMenuPanel) {
        mainMenuPanel.setHomePageVisible(true);
        mainMenuPanel.updateProfile(playerProfile);
      }
    } else if (buttonId === 'reset') {
      // 重置临时属性
      cultivationTempAttrs = { ...playerProfile.attrs };
      cultivationTempUnspentPoints = playerProfile.unspentPoints;
    } else if (buttonId === 'back') {
      previousMenuPage = currentMenuPage;
      currentMenuPage = 'HOME';
      appState.setMenuPage('HOME');
      if (mainMenuPanel) {
        mainMenuPanel.setHomePageVisible(true);
      }
    } else if (buttonId.startsWith('increase_')) {
      const attrIndex = parseInt(buttonId.split('_')[1]);
      const attrKeys: Array<'atk' | 'hp' | 'move'> = ['atk', 'hp', 'move'];
      if (cultivationTempUnspentPoints > 0) {
        cultivationTempAttrs[attrKeys[attrIndex]]++;
        cultivationTempUnspentPoints--;
      }
    } else if (buttonId.startsWith('decrease_')) {
      const attrIndex = parseInt(buttonId.split('_')[1]);
      const attrKeys: Array<'atk' | 'hp' | 'move'> = ['atk', 'hp', 'move'];
      const baseValue = [playerProfile.attrs.atk, playerProfile.attrs.hp, playerProfile.attrs.move][attrIndex];
      if (cultivationTempAttrs[attrKeys[attrIndex]] > baseValue) {
        cultivationTempAttrs[attrKeys[attrIndex]]--;
        cultivationTempUnspentPoints++;
      }
    }
  } else if (currentMenuPage === 'STASH') {
    if (buttonId === 'save') {
      // 保存仓库配置
      playerProfile.stashItems = [...stashTempItems];
      playerProfile.loadoutSafeItems = [...stashTempLoadoutItems];
      ProfileStore.saveProfile(playerProfile);
      previousMenuPage = currentMenuPage;
      currentMenuPage = 'HOME';
      appState.setMenuPage('HOME');
      if (mainMenuPanel) {
        mainMenuPanel.setHomePageVisible(true);
      }
    } else if (buttonId === 'back') {
      previousMenuPage = currentMenuPage;
      currentMenuPage = 'HOME';
      appState.setMenuPage('HOME');
      if (mainMenuPanel) {
        mainMenuPanel.setHomePageVisible(true);
      }
    }
  } else if (currentMenuPage === 'SETTINGS') {
    if (buttonId === 'back') {
      previousMenuPage = currentMenuPage;
      currentMenuPage = 'HOME';
      appState.setMenuPage('HOME');
      if (mainMenuPanel) {
        mainMenuPanel.setHomePageVisible(true);
      }
    } else if (buttonId.startsWith('volume_')) {
      settingsVolume = parseFloat(buttonId.split('_')[1]);
    } else if (buttonId === 'toggle_debug') {
      settingsDebugEnabled = !settingsDebugEnabled;
    }
  } else if (currentMenuPage === 'RESULT_SUMMARY') {
    if (buttonId === 'back') {
      currentMenuPage = 'HOME';
      appState.setScreen('MAIN_MENU');
    }
  }
}

// 处理主界面物品点击
function handleMainMenuItemClick(itemIndex: number): void {
  if (currentMenuPage === 'START') {
    // 选择秘境
    if (itemIndex >= 0 && itemIndex < availableDungeons.length) {
      selectedDungeonIndex = itemIndex;
    }
  } else if (currentMenuPage === 'STASH') {
    // 仓库/出战物品交互
    if (itemIndex >= 0) {
      // 点击仓库物品，尝试放入出战格子
      const item = stashTempItems[itemIndex];
      const loadoutUsed = stashTempLoadoutItems.reduce((sum, item) => sum + item.size, 0);
      if (loadoutUsed + item.size <= 2) {
        stashTempItems.splice(itemIndex, 1);
        stashTempLoadoutItems.push(item);
      }
    } else {
      // 点击出战物品，移回仓库
      const loadoutIndex = -1 - itemIndex;
      if (loadoutIndex >= 0 && loadoutIndex < stashTempLoadoutItems.length) {
        const item = stashTempLoadoutItems[loadoutIndex];
        stashTempLoadoutItems.splice(loadoutIndex, 1);
        stashTempItems.push(item);
      }
    }
  }
}

// 处理键盘输入
function handleKeyDown(e: KeyboardEvent): void {
  if (appState.getScreen() === 'MAIN_MENU' || appState.getScreen() === 'RESULT') {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (currentMenuPage !== 'HOME' && currentMenuPage !== 'RESULT_SUMMARY') {
        currentMenuPage = 'HOME';
      } else if (currentMenuPage === 'RESULT_SUMMARY') {
        currentMenuPage = 'HOME';
        appState.setScreen('MAIN_MENU');
      }
    }
  }
}

// 处理鼠标滚轮（用于列表滚动）
function handleWheel(e: WheelEvent): void {
  if (appState.getScreen() !== 'MAIN_MENU') {
    return;
  }

  if (currentMenuPage === 'START') {
    e.preventDefault();
    mainMenuUI.updateStartPageScroll(-e.deltaY / 100, availableDungeons);
  } else if (currentMenuPage === 'STASH') {
    e.preventDefault();
    mainMenuUI.updateStashPageScroll(-e.deltaY / 100, stashTempItems);
  }
}

// 开始游戏
async function startGame(dungeonId: string): Promise<void> {
  try {
    // 重新加载 profile（确保最新）
    playerProfile = ProfileStore.loadProfile();
    
    // 创建游戏实例（传入 UIManager 以启用新 UI 系统）
    game = new Game(canvas, appState, playerProfile, uiManager);
    
    // 进入秘境
    await game.enterDungeon(dungeonId);
    
    // 启动游戏
    game.start();
    
    // 切换到 RUN 状态
    appState.setScreen('RUN');
  } catch (error) {
    console.error('[Main] 游戏启动失败:', error);
    alert('游戏启动失败，请检查控制台错误信息');
  }
}

// 渲染主界面
function renderMainMenu(): void {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 如果从其他页面切换到HOME，清空canvas清除旧UI残留
    if (currentMenuPage === 'HOME' && previousMenuPage !== 'HOME' && previousMenuPage !== null) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 填充背景色（与新UI系统保持一致）
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if (currentMenuPage === 'HOME') {
      // HOME 页面由新 UI 系统渲染，这里不需要渲染
      // 但需要更新角色信息
      if (mainMenuPanel) {
        mainMenuPanel.updateProfile(playerProfile);
      }
    } else if (currentMenuPage === 'START') {
      mainMenuUI.renderStartPage(availableDungeons, selectedDungeonIndex);
    } else if (currentMenuPage === 'CULTIVATION') {
      mainMenuUI.renderCultivationPage(playerProfile, cultivationTempAttrs, cultivationTempUnspentPoints);
    } else if (currentMenuPage === 'STASH') {
      mainMenuUI.renderStashPage(playerProfile, stashTempItems, stashTempLoadoutItems);
    } else if (currentMenuPage === 'SETTINGS') {
      mainMenuUI.renderSettingsPage(settingsVolume, settingsDebugEnabled);
    } else if (currentMenuPage === 'RESULT_SUMMARY') {
      // 从游戏获取结算状态
      if (game) {
        const uiState = game.getUIState();
        if (uiState && uiState.resultReason) {
          mainMenuUI.renderResultSummaryPage(uiState);
        } else {
          // 如果没有结算状态，显示默认信息
          console.warn('[Main] 结算状态不存在，显示默认页面');
          mainMenuUI.renderHomePage(playerProfile);
        }
      } else {
        // 如果游戏实例不存在，返回主页
        console.warn('[Main] 游戏实例不存在，返回主页');
        currentMenuPage = 'HOME';
        appState.setMenuPage('HOME');
        mainMenuUI.renderHomePage(playerProfile);
      }
    }
  } catch (error) {
    console.error('[Main] 渲染主界面失败:', error);
  }
}

// 主循环
let lastTime = performance.now();
function gameLoop(): void {
  const currentTime = performance.now();
  const dt = (currentTime - lastTime) / 1000; // 转换为秒
  lastTime = currentTime;

  const screen = appState.getScreen();
  const menuPage = appState.getMenuPage();
  
  // 更新 UI 管理器
  uiManager.update(dt);
  
  // 同步菜单页面状态（如果 appState 中的状态更新了）
  if (screen === 'MAIN_MENU' || screen === 'RESULT') {
    // 如果 appState 中的 menuPage 与 currentMenuPage 不一致，同步它
    if (menuPage !== currentMenuPage) {
      previousMenuPage = currentMenuPage;
      currentMenuPage = menuPage;
    }
    
    // 获取canvas上下文
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 先清空canvas（避免残留）
      if (currentMenuPage !== 'HOME') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // 渲染主菜单（旧UI系统，用于非HOME页面）
      renderMainMenu();
      
      // 渲染 UI 管理器（新UI系统，用于HOME页面）
      // 注意：只有在HOME页面时才渲染新UI系统，避免覆盖旧UI
      if (currentMenuPage === 'HOME') {
        uiManager.render(ctx);
      }
    }
    
    // 更新previousMenuPage（在渲染后，这样下次切换时能正确检测）
    if (previousMenuPage !== currentMenuPage) {
      previousMenuPage = currentMenuPage;
    }
  } else if (screen === 'RUN' && game) {
    // 游戏循环由 Game 类内部处理
    // 这里不需要额外渲染
  } else {
    // 其他状态也渲染UI管理器
    const ctx = canvas.getContext('2d');
    if (ctx) {
      uiManager.render(ctx);
    }
  }
  
  requestAnimationFrame(gameLoop);
}

/**
 * 检测是否为移动设备
 */
function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
}

/**
 * 检测设备类型并输出信息
 */
function detectDevice(): void {
  const isMobileDevice = isMobile();
  const userAgent = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  console.log('[Main] ========== 设备检测 ==========');
  console.log('[Main] 设备类型:', isMobileDevice ? '📱 移动设备' : '💻 桌面设备');
  console.log('[Main] 屏幕尺寸:', `${screenWidth} x ${screenHeight}`);
  console.log('[Main] 设备像素比:', devicePixelRatio);
  console.log('[Main] User Agent:', userAgent);
  
  // 检测具体设备类型
  if (/iPhone/i.test(userAgent)) {
    console.log('[Main] 具体设备: iPhone');
  } else if (/iPad/i.test(userAgent)) {
    console.log('[Main] 具体设备: iPad');
  } else if (/Android/i.test(userAgent)) {
    console.log('[Main] 具体设备: Android');
  } else if (/Windows/i.test(userAgent)) {
    console.log('[Main] 具体设备: Windows');
  } else if (/Mac/i.test(userAgent)) {
    console.log('[Main] 具体设备: Mac');
  } else if (/Linux/i.test(userAgent)) {
    console.log('[Main] 具体设备: Linux');
  }
  
  // 检测屏幕方向
  const isPortrait = screenHeight > screenWidth;
  console.log('[Main] 屏幕方向:', isPortrait ? '竖屏 (Portrait)' : '横屏 (Landscape)');
  console.log('[Main] ==============================');
}

// 初始化
(async () => {
  try {
    console.log('[Main] 开始初始化...');
    
    // 检测设备类型
    detectDevice();
    
    // 初始化 UI 管理器
    uiManager = new UIManager({ designW: 1280, designH: 720 });
    
    // 设置 Canvas 尺寸并绑定 Resize
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };
    resizeCanvas();
    
    // 绑定 UI 系统的 Resize 和事件
    bindResize(canvas, uiManager);
    bindCanvasEvents(canvas, uiManager);
    
    // 创建主菜单面板（在 bindResize 之后，确保布局已初始化）
    const layoutState = uiManager.getLayoutState();
    console.log('[Main] 布局状态:', {
      designW: layoutState.designW,
      designH: layoutState.designH,
      screenW: layoutState.screenW,
      screenH: layoutState.screenH,
      scale: layoutState.scale,
      viewportRect: layoutState.viewportRect,
      safeRect: layoutState.safeRect,
    });
    console.log('[Main] safeRect 详细信息:', JSON.stringify(layoutState.safeRect, null, 2));
    mainMenuPanel = new MainMenuPanel(layoutState, playerProfile);
    
    // 监听布局变化，更新主菜单面板布局
    // 注意：bindResize 已经监听了 resize，我们需要在它之后更新面板
    const updateMainMenuLayout = () => {
      if (mainMenuPanel) {
        const newLayoutState = uiManager.getLayoutState();
        mainMenuPanel.updateLayout(newLayoutState);
      }
    };
    
    // 在现有的 resize 监听之后添加我们的更新
    window.addEventListener('resize', updateMainMenuLayout);
    mainMenuPanel.setOnStartClick(() => {
      currentMenuPage = 'START';
      appState.setMenuPage('START');
      mainMenuPanel?.setHomePageVisible(false);
    });
    mainMenuPanel.setOnCultivationClick(() => {
      currentMenuPage = 'CULTIVATION';
      appState.setMenuPage('CULTIVATION');
      cultivationTempAttrs = { ...playerProfile.attrs };
      cultivationTempUnspentPoints = playerProfile.unspentPoints;
      mainMenuPanel?.setHomePageVisible(false);
    });
    mainMenuPanel.setOnStashClick(() => {
      currentMenuPage = 'STASH';
      appState.setMenuPage('STASH');
      stashTempItems = [...playerProfile.stashItems];
      stashTempLoadoutItems = [...playerProfile.loadoutSafeItems];
      mainMenuUI.resetScroll();
      mainMenuPanel?.setHomePageVisible(false);
    });
    mainMenuPanel.setOnSettingsClick(() => {
      currentMenuPage = 'SETTINGS';
      appState.setMenuPage('SETTINGS');
      mainMenuPanel?.setHomePageVisible(false);
    });
    
    // 打开主菜单面板
    uiManager.open(mainMenuPanel, { layer: 'ui' });
    console.log('[Main] 主菜单面板已打开，面板栈长度:', uiManager['panelStack'].length);
    console.log('[Main] 主菜单面板状态:', {
      isOpen: mainMenuPanel.isOpen,
      visible: mainMenuPanel.visible,
      interactive: mainMenuPanel.interactive,
      children: mainMenuPanel['children'].length,
    });
    console.log('[Main] UI 层级状态:', {
      uiLayer: {
        enabled: uiManager['layers'].ui.enabled,
        visible: uiManager['layers'].ui.visible,
        children: uiManager['layers'].ui['children'].length,
      },
    });
    console.log('[Main] 主菜单面板按钮位置:', {
      start: { x: mainMenuPanel['startButton'].x, y: mainMenuPanel['startButton'].y, visible: mainMenuPanel['startButton'].visible, interactive: mainMenuPanel['startButton'].interactive },
      cultivation: { x: mainMenuPanel['cultivationButton'].x, y: mainMenuPanel['cultivationButton'].y, visible: mainMenuPanel['cultivationButton'].visible, interactive: mainMenuPanel['cultivationButton'].interactive },
      stash: { x: mainMenuPanel['stashButton'].x, y: mainMenuPanel['stashButton'].y, visible: mainMenuPanel['stashButton'].visible, interactive: mainMenuPanel['stashButton'].interactive },
      settings: { x: mainMenuPanel['settingsButton'].x, y: mainMenuPanel['settingsButton'].y, visible: mainMenuPanel['settingsButton'].visible, interactive: mainMenuPanel['settingsButton'].interactive },
    });
    
    // 保留原有的事件监听（用于非 HOME 页面，后续逐步迁移）
    canvas.addEventListener('click', handleMainMenuClick);
    canvas.addEventListener('touchstart', handleMainMenuClick);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // 设置初始状态
    appState.setScreen('MAIN_MENU');
    appState.setMenuPage('HOME');
    
    console.log('[Main] 加载秘境列表...');
    // 加载秘境列表
    await loadAvailableDungeons();
    console.log('[Main] 秘境列表加载完成，数量:', availableDungeons.length);
    
    console.log('[Main] 启动主循环...');
    // 启动主循环
    gameLoop();
    
    console.log('[Main] 初始化完成');
  } catch (error) {
    console.error('[Main] 初始化失败:', error);
    if (error instanceof Error) {
      alert(`初始化失败: ${error.message}\n请检查控制台错误信息`);
    } else {
      alert('初始化失败，请检查控制台错误信息');
    }
  }
})();
