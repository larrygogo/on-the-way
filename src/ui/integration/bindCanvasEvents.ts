import { UIManager } from '../core/UIManager';
import { PointerEvent, createPointerEvent, PointerEventType } from '../core/PointerEvent';

/**
 * 绑定 Canvas 事件到 UIManager
 */
export function bindCanvasEvents(canvas: HTMLCanvasElement, ui: UIManager): void {
  // 绑定事件（始终处理，但只在有面板打开时消费事件）
  // 注意：不使用 capture 阶段，避免与主菜单的 click 事件冲突
  canvas.addEventListener('pointerdown', (e) => {
    // 始终处理事件（主菜单面板也是面板）
    // 如果没有面板打开，说明可能是其他模式，不处理事件
    if (!ui.hasOpenPanels()) {
      console.log('[bindCanvasEvents] 没有打开的面板，跳过事件处理');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    const designPos = ui.toDesignSpace(canvasX, canvasY);
    
    console.log(`[bindCanvasEvents] pointerdown: 客户端(${e.clientX.toFixed(1)}, ${e.clientY.toFixed(1)}) -> Canvas(${canvasX.toFixed(1)}, ${canvasY.toFixed(1)}) -> 设计空间(${designPos.x.toFixed(1)}, ${designPos.y.toFixed(1)})`);

    const event = createPointerEvent(
      e,
      'down',
      canvas,
      (x, y) => ui.toDesignSpace(x, y)
    );
    console.log(`[bindCanvasEvents] 创建事件后，准备调用 dispatchPointer，事件坐标: (${event.x.toFixed(1)}, ${event.y.toFixed(1)})`);
    try {
      ui.dispatchPointer(event);
      console.log(`[bindCanvasEvents] dispatchPointer 返回，事件是否被消费: ${event.consumed}`);
    } catch (error) {
      console.error('[bindCanvasEvents] dispatchPointer 抛出异常:', error);
    }
    // 如果事件被消费，阻止默认行为和传播
    if (event.consumed) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!ui.hasOpenPanels()) {
      return;
    }

    const event = createPointerEvent(
      e,
      'move',
      canvas,
      (x, y) => ui.toDesignSpace(x, y)
    );
    ui.dispatchPointer(event);
    if (event.consumed) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!ui.hasOpenPanels()) {
      return;
    }

    const event = createPointerEvent(
      e,
      'up',
      canvas,
      (x, y) => ui.toDesignSpace(x, y)
    );
    ui.dispatchPointer(event);
    // 如果事件被消费，阻止默认行为和传播
    if (event.consumed) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  canvas.addEventListener('pointercancel', (e) => {
    if (!ui.hasOpenPanels()) {
      return;
    }

    const event = createPointerEvent(
      e,
      'cancel',
      canvas,
      (x, y) => ui.toDesignSpace(x, y)
    );
    ui.dispatchPointer(event);
    if (event.consumed) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  canvas.addEventListener('wheel', (e) => {
    const event = createPointerEvent(
      e,
      'wheel',
      canvas,
      (x, y) => ui.toDesignSpace(x, y)
    );
    ui.dispatchPointer(event);
    if (event.consumed) {
      e.preventDefault();
    }
  }, { passive: false });
}
