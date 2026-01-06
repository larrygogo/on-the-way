import './style.css';
import { Game } from './game/Game';

// 获取 Canvas 元素
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('找不到 Canvas 元素');
}

// 创建并启动游戏
const game = new Game(canvas);
game.start();
