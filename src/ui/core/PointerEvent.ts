/**
 * Pointer 事件类型
 */
export type PointerEventType = 'down' | 'move' | 'up' | 'cancel' | 'wheel';

/**
 * Pointer 事件接口
 */
export interface PointerEvent {
  /** 事件类型 */
  type: PointerEventType;
  /** Pointer ID（用于多点触控） */
  id: number;
  /** 设计分辨率空间中的 x 坐标 */
  x: number;
  /** 设计分辨率空间中的 y 坐标 */
  y: number;
  /** 原始 Canvas 空间中的 x 坐标 */
  rawX: number;
  /** 原始 Canvas 空间中的 y 坐标 */
  rawY: number;
  /** 是否为触摸事件 */
  isTouch: boolean;
  /** 时间戳（毫秒） */
  timestamp: number;
  /** 事件是否已被消费（阻止继续传播） */
  consumed: boolean;
  /** 滚轮事件的 deltaY（仅 wheel 事件） */
  deltaY?: number;
}

/**
 * 从原生 PointerEvent 创建 PointerEvent
 */
export function createPointerEvent(
  nativeEvent: globalThis.PointerEvent | WheelEvent,
  type: PointerEventType,
  canvas: HTMLCanvasElement,
  toDesignSpace: (x: number, y: number) => { x: number; y: number }
): PointerEvent {
  const rect = canvas.getBoundingClientRect();
  const clientX = 'clientX' in nativeEvent ? nativeEvent.clientX : 0;
  const clientY = 'clientY' in nativeEvent ? nativeEvent.clientY : 0;
  
  // 转换为 Canvas 坐标（考虑 DPR）
  const canvasX = clientX - rect.left;
  const canvasY = clientY - rect.top;
  
  // 转换为设计分辨率空间
  const designPos = toDesignSpace(canvasX, canvasY);
  
  return {
    type,
    id: 'pointerId' in nativeEvent ? nativeEvent.pointerId : 0,
    x: designPos.x,
    y: designPos.y,
    rawX: canvasX,
    rawY: canvasY,
    isTouch: nativeEvent.pointerType === 'touch',
    timestamp: nativeEvent.timeStamp,
    consumed: false,
    deltaY: type === 'wheel' ? (nativeEvent as WheelEvent).deltaY : undefined,
  };
}
