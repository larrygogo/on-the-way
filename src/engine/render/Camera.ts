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
  private screenWidth: number = 0;
  private screenHeight: number = 0;
  
  // 相机跟随参数
  private followX: boolean = true;  // 主要跟随 x（横向卷轴）
  private followY: boolean = false; // y 可固定或轻微跟随

  // 地图边界限制（可选）
  private mapBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null = null;

  /**
   * 设置屏幕中心位置和尺寸（用于计算偏移和边界）
   */
  setScreenCenter(centerX: number, centerY: number, screenWidth?: number, screenHeight?: number): void {
    this.centerX = centerX;
    this.centerY = centerY;
    if (screenWidth !== undefined) {
      this.screenWidth = screenWidth;
    }
    if (screenHeight !== undefined) {
      this.screenHeight = screenHeight;
    }
  }

  /**
   * 设置地图边界限制
   * @param minX 地图最小 x 坐标
   * @param maxX 地图最大 x 坐标
   * @param minY 地图最小 y 坐标
   * @param maxY 地图最大 y 坐标
   */
  setMapBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.mapBounds = { minX, maxX, minY, maxY };
  }

  /**
   * 清除地图边界限制
   */
  clearMapBounds(): void {
    this.mapBounds = null;
  }

  /**
   * 设置 Y 方向跟随
   * @param enabled 是否启用 Y 方向跟随
   */
  setFollowY(enabled: boolean): void {
    this.followY = enabled;
  }

  /**
   * 设置相机跟随目标位置
   */
  follow(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  /**
   * 更新相机位置（横向卷轴跟随，带边界限制）
   */
  update(): void {
    if (this.followX) {
      // 主要跟随 x，使玩家位于屏幕中心
      let desiredCameraX = this.targetX - this.centerX;
      
      // 如果设置了地图边界，限制相机位置
      if (this.mapBounds && this.screenWidth > 0) {
        // 计算相机允许的范围
        // 相机最小位置：确保屏幕左边缘不超出地图左边界
        const minCameraX = this.mapBounds.minX;
        // 相机最大位置：确保屏幕右边缘不超出地图右边界
        const maxCameraX = this.mapBounds.maxX - this.screenWidth;
        
        // 如果地图宽度小于屏幕宽度，将相机固定在地图中心
        if (maxCameraX < minCameraX) {
          const mapCenterX = (this.mapBounds.minX + this.mapBounds.maxX) / 2;
          desiredCameraX = mapCenterX - this.centerX;
        } else {
          // 限制相机位置
          desiredCameraX = Math.max(minCameraX, Math.min(maxCameraX, desiredCameraX));
        }
      }
      
      this.cameraX = desiredCameraX;
    }
    
    if (this.followY) {
      // y 可轻微跟随（可选）
      let desiredCameraY = this.targetY - this.centerY;
      
      // 如果设置了地图边界，限制相机位置
      if (this.mapBounds && this.screenHeight > 0) {
        // 计算相机允许的范围
        const minCameraY = this.mapBounds.minY;
        const maxCameraY = this.mapBounds.maxY - this.screenHeight;
        
        // 如果地图高度小于屏幕高度，将相机固定在地图中心
        if (maxCameraY < minCameraY) {
          const mapCenterY = (this.mapBounds.minY + this.mapBounds.maxY) / 2;
          desiredCameraY = mapCenterY - this.centerY;
        } else {
          // 限制相机位置
          desiredCameraY = Math.max(minCameraY, Math.min(maxCameraY, desiredCameraY));
        }
      }
      
      this.cameraY = desiredCameraY;
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

