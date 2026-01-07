import './style.css';
import { Game } from './gameplay/Game';
import { AppState } from './gameplay/state/AppState';
import { ProfileStore } from './gameplay/state/ProfileStore';
import { PlayerProfile } from './gameplay/state/PlayerProfile';
import { MainMenuUI, ButtonClickResult } from './gameplay/ui/MainMenuUI';
import { DungeonLoader } from './content/loaders/DungeonLoader';
import { DungeonConfig } from './content/config/DungeonConfig';
import { ItemInstance } from './gameplay/entities/Item';

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

// 主界面状态
let currentMenuPage: 'HOME' | 'START' | 'CULTIVATION' | 'STASH' | 'SETTINGS' | 'RESULT_SUMMARY' = 'HOME';
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

// 处理主界面点击
function handleMainMenuClick(e: MouseEvent | TouchEvent): void {
  if (appState.getScreen() !== 'MAIN_MENU' && appState.getScreen() !== 'RESULT') {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const rect = canvas.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
  
  if (!clientX || !clientY) return;

  const x = clientX - rect.left;
  const y = clientY - rect.top;

  let result: ButtonClickResult | null = null;

  if (currentMenuPage === 'HOME') {
    result = mainMenuUI.checkHomePageClick(x, y);
  } else if (currentMenuPage === 'START') {
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
    if (buttonId === 'start') {
      currentMenuPage = 'START';
    } else if (buttonId === 'cultivation') {
      currentMenuPage = 'CULTIVATION';
      // 重置临时属性
      cultivationTempAttrs = { ...playerProfile.attrs };
      cultivationTempUnspentPoints = playerProfile.unspentPoints;
    } else if (buttonId === 'stash') {
      currentMenuPage = 'STASH';
      // 重置临时物品
      stashTempItems = [...playerProfile.stashItems];
      stashTempLoadoutItems = [...playerProfile.loadoutSafeItems];
      mainMenuUI.resetScroll();
    } else if (buttonId === 'settings') {
      currentMenuPage = 'SETTINGS';
    }
  } else if (currentMenuPage === 'START') {
    if (buttonId === 'enter' && selectedDungeonIndex >= 0) {
      startGame(availableDungeons[selectedDungeonIndex].id);
    } else if (buttonId === 'back') {
      currentMenuPage = 'HOME';
    }
  } else if (currentMenuPage === 'CULTIVATION') {
    if (buttonId === 'save') {
      // 保存修炼点分配
      playerProfile.attrs = { ...cultivationTempAttrs };
      playerProfile.unspentPoints = cultivationTempUnspentPoints;
      ProfileStore.saveProfile(playerProfile);
      currentMenuPage = 'HOME';
    } else if (buttonId === 'reset') {
      // 重置临时属性
      cultivationTempAttrs = { ...playerProfile.attrs };
      cultivationTempUnspentPoints = playerProfile.unspentPoints;
    } else if (buttonId === 'back') {
      currentMenuPage = 'HOME';
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
      currentMenuPage = 'HOME';
    } else if (buttonId === 'back') {
      currentMenuPage = 'HOME';
    }
  } else if (currentMenuPage === 'SETTINGS') {
    if (buttonId === 'back') {
      currentMenuPage = 'HOME';
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
    
    // 创建游戏实例
    game = new Game(canvas, appState, playerProfile);
    
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
    if (currentMenuPage === 'HOME') {
      mainMenuUI.renderHomePage(playerProfile);
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
function gameLoop(): void {
  const screen = appState.getScreen();
  const menuPage = appState.getMenuPage();
  
  // 同步菜单页面状态（如果 appState 中的状态更新了）
  if (screen === 'MAIN_MENU' || screen === 'RESULT') {
    // 如果 appState 中的 menuPage 与 currentMenuPage 不一致，同步它
    if (menuPage !== currentMenuPage) {
      currentMenuPage = menuPage;
    }
    renderMainMenu();
  } else if (screen === 'RUN' && game) {
    // 游戏循环由 Game 类内部处理
    // 这里不需要额外渲染
  }
  
  requestAnimationFrame(gameLoop);
}

// 初始化
(async () => {
  try {
    console.log('[Main] 开始初始化...');
    
    // 设置 Canvas 尺寸
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
    window.addEventListener('resize', resizeCanvas);
    
    // 设置初始状态
    appState.setScreen('MAIN_MENU');
    appState.setMenuPage('HOME');
    
    console.log('[Main] 加载秘境列表...');
    // 加载秘境列表
    await loadAvailableDungeons();
    console.log('[Main] 秘境列表加载完成，数量:', availableDungeons.length);
    
    // 设置事件监听
    canvas.addEventListener('click', handleMainMenuClick);
    canvas.addEventListener('touchstart', handleMainMenuClick);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
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
