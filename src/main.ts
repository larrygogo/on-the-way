import './style.css';
import { Game } from './game/Game';

// 获取 Canvas 元素
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('找不到 Canvas 元素');
}

// 创建游戏实例
const game = new Game(canvas);

// 异步加载地图并启动游戏
(async () => {
  try {
    await game.initFromMap('map_002');
    game.start();
  } catch (error) {
    console.error('游戏启动失败:', error);
    alert('游戏启动失败，请检查控制台错误信息');
  }
})();
