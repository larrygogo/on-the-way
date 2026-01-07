import { UIManager } from '../core/UIManager';
import { getSafeInsets, SafeInsets } from '../core/Layout';

/**
 * Safe Area 提供者函数类型
 */
export type SafeInsetsProvider = () => SafeInsets;

/**
 * 绑定 Resize 事件到 UIManager
 */
export function bindResize(
  canvas: HTMLCanvasElement,
  ui: UIManager,
  safeInsetsProvider?: SafeInsetsProvider
): void {
  const getSafeInsetsFn = safeInsetsProvider ?? getSafeInsets;

  const handleResize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const screenW = rect.width;
    const screenH = rect.height;

    // 调整 Canvas 实际像素尺寸
    canvas.width = screenW * dpr;
    canvas.height = screenH * dpr;
    // 重置并应用 DPR 缩放，保证坐标系统始终使用 CSS 像素
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换，避免累积缩放
      ctx.scale(dpr, dpr);
    }

    // 获取 Safe Area
    const safeInsets = getSafeInsetsFn();

    // 更新 UI 布局
    ui.resize(screenW, screenH, dpr, safeInsets);
  };

  // 初始调用
  handleResize();

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize);

  // 监听 DPR 变化（某些设备上可能变化）
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener('change', handleResize);
  }
}
