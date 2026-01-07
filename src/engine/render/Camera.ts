/**
 * 相机系统（横向卷轴）
 * 负责跟随玩家并处理世界坐标到屏幕坐标的转换
 */
export class Camera {
  public cameraX: number = 0;
  public cameraY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  
  // 相机跟随参数
  private followX: boolean = true;  // 主要跟随 x（横向卷轴）
  private followY: boolean = false; // y 可固定或轻微跟随

  /**
   * 设置屏幕中心位置（用于计算偏移）
   */
  setScreenCenter(centerX: number, centerY: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
  }

  /**
   * 设置相机跟随目标位置
   */
  follow(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * 更新相机位置（横向卷轴跟随）
   */
  update(): void {
    if (this.followX) {
      // 主要跟随 x，使玩家位于屏幕中心
      this.cameraX = this.targetX - this.centerX;
    }
    
    if (this.followY) {
      // y 可轻微跟随（可选）
      this.cameraY = this.targetY - this.centerY;
    } else {
      // y 固定（不跟随）
      this.cameraY = 0;
    }
  }

  /**
   * 将世界坐标转换为屏幕坐标
   * sx = x - cameraX
   * sy = y - cameraY
   */
  worldToScreen(x: number, y: number, _z: number = 0): { sx: number; sy: number } {
    return {
      sx: x - this.cameraX,
      sy: y - this.cameraY
    };
  }
}

