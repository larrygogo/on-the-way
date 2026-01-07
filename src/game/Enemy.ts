import { Camera } from './Camera';
import { Renderable } from './Renderable';
import { GameConfig } from './GameConfig';
import { Collision, Rect, Point } from './Collision';
import { Obstacle } from './Obstacle';
import { WalkAreaConfig } from './MapConfig';

/**
 * 敌人类型
 */
export type EnemyType = 'NORMAL' | 'ELITE';

/**
 * 敌人AI状态
 */
export type EnemyState = 'IDLE' | 'CHASE' | 'ATTACK';

/**
 * 敌人实体
 */
export class Enemy implements Renderable {
  public readonly id: string;
  public readonly type: EnemyType;
  public x: number;
  public y: number;
  public z: number = 0;
  
  // 敌人属性
  public hp: number;
  public maxHp: number;
  public damage: number;
  public speed: number;
  public attackRange: number;
  public attackCooldown: number;
  public auraReward: number;
  
  // 脚底碰撞盒
  public footprintWidth: number;
  public footprintHeight: number;
  
  // AI状态
  public state: EnemyState = 'IDLE';
  private lastAttackTime: number = 0;
  private loseTimeStart: number = 0; // 开始丢失追踪的时间
  private isDead: boolean = false;
  
  // 碰撞相关
  private obstacles: Obstacle[] = [];
  private walkArea: WalkAreaConfig | null = null;

  constructor(
    type: EnemyType,
    x: number,
    y: number
  ) {
    this.id = `enemy_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.x = x;
    this.y = y;

    // 根据类型设置属性
    const config = type === 'NORMAL' ? GameConfig.enemy.normal : GameConfig.enemy.elite;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.damage = config.damage;
    this.speed = config.speed;
    this.attackRange = config.attackRange;
    this.attackCooldown = config.attackCooldown;
    this.auraReward = config.auraReward;
    this.footprintWidth = config.footprintWidth;
    this.footprintHeight = config.footprintHeight;
  }

  /**
   * 设置障碍物列表和可走区域（用于碰撞检测）
   */
  setObstacles(obstacles: Obstacle[]): void {
    this.obstacles = obstacles;
  }

  setWalkArea(area: WalkAreaConfig): void {
    this.walkArea = area;
  }

  /**
   * 获取深度键（用于排序）
   */
  getDepthKey(): number {
    return this.y;
  }

  /**
   * 检查与障碍物碰撞
   */
  private checkCollision(rect: Rect): boolean {
    for (const obstacle of this.obstacles) {
      const obstacleRect = Collision.toRect(
        obstacle.x,
        obstacle.y,
        obstacle.footprintWidth,
        obstacle.footprintHeight
      );
      if (Collision.rectsIntersect(rect, obstacleRect)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 限制坐标在 walkArea 内
   */
  private clampPosition(): void {
    if (!this.walkArea) return;

    const point: Point = { x: this.x, y: this.y };

    if (this.walkArea.type === 'rect') {
      // 矩形边界限制
      const rect = this.walkArea.rect;
      this.x = Math.max(rect.x, Math.min(rect.x + rect.width, this.x));
      this.y = Math.max(rect.y, Math.min(rect.y + rect.height, this.y));
    } else if (this.walkArea.type === 'polygon') {
      // 多边形边界限制
      const clamped = Collision.clampPointToPolygon(point, this.walkArea.points);
      this.x = clamped.x;
      this.y = clamped.y;
    }
  }

  /**
   * 带碰撞的移动（axis-separate，实现滑墙效果）
   * 核心函数：enemyMove
   */
  private moveWithCollisions(dx: number, dy: number): void {
    const originalX = this.x;
    const originalY = this.y;

    // 先处理 x 方向移动
    if (dx !== 0) {
      this.x += dx * this.speed;
      const newRect = this.getFootprintRect();
      if (this.checkCollision(newRect)) {
        // 碰撞了，回退 x
        this.x = originalX;
      }
    }

    // 再处理 y 方向移动
    if (dy !== 0) {
      this.y += dy * this.speed;
      const newRect = this.getFootprintRect();
      if (this.checkCollision(newRect)) {
        // 碰撞了，回退 y
        this.y = originalY;
      }
    }

    // 限制在可走区域内
    this.clampPosition();
  }

  /**
   * 计算到玩家的距离
   */
  private distanceToPlayer(playerX: number, playerY: number): number {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 更新敌人AI
   * 核心函数：updateEnemyAI
   */
  updateAI(_deltaTime: number, playerX: number, playerY: number, applyDamageCallback: (damage: number) => void): void {
    if (this.isDead) return;

    const distance = this.distanceToPlayer(playerX, playerY);
    const aiConfig = GameConfig.enemy.ai;
    const now = Date.now();

    // 状态机更新
    switch (this.state) {
      case 'IDLE':
        // 如果玩家进入视野，开始追击
        if (distance <= aiConfig.visionRadius) {
          this.state = 'CHASE';
          this.loseTimeStart = 0;
        }
        break;

      case 'CHASE':
        // 朝玩家方向移动
        if (distance > this.attackRange) {
          const dx = playerX - this.x;
          const dy = playerY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0.1) {
            const moveDx = dx / dist;
            const moveDy = dy / dist;
            this.moveWithCollisions(moveDx, moveDy);
          }
        }

        // 如果进入攻击范围，切换到攻击状态
        if (distance <= this.attackRange) {
          this.state = 'ATTACK';
          this.loseTimeStart = 0;
        }
        // 如果超出丢失半径，开始计时
        else if (distance > aiConfig.loseRadius) {
          if (this.loseTimeStart === 0) {
            this.loseTimeStart = now;
          } else {
            const loseTime = (now - this.loseTimeStart) / 1000;
            if (loseTime >= aiConfig.loseTimeSec) {
              // 脱战，回到IDLE
              this.state = 'IDLE';
              this.loseTimeStart = 0;
            }
          }
        } else {
          // 在丢失半径内，重置计时
          this.loseTimeStart = 0;
        }
        break;

      case 'ATTACK':
        // 如果玩家离开攻击范围，回到追击
        if (distance > this.attackRange) {
          this.state = 'CHASE';
          this.loseTimeStart = 0;
        } else {
          // 在攻击范围内，执行攻击
          this.enemyAttack(now, applyDamageCallback);
        }
        break;
    }
  }

  /**
   * 敌人攻击
   * 核心函数：enemyAttack
   */
  private enemyAttack(now: number, applyDamageCallback: (damage: number) => void): void {
    const timeSinceLastAttack = (now - this.lastAttackTime) / 1000;
    if (timeSinceLastAttack >= this.attackCooldown) {
      this.lastAttackTime = now;
      applyDamageCallback(this.damage);
    }
  }

  /**
   * 受到伤害
   */
  takeDamage(amount: number): void {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  /**
   * 检查是否死亡
   */
  isEnemyDead(): boolean {
    return this.isDead || this.hp <= 0;
  }


  /**
   * 获取脚底碰撞盒矩形
   */
  getFootprintRect(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - this.footprintWidth / 2,
      y: this.y - this.footprintHeight / 2,
      width: this.footprintWidth,
      height: this.footprintHeight,
    };
  }

  /**
   * 渲染敌人
   */
  render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    if (this.isDead) return;

    const screenPos = camera.worldToScreen(this.x, this.y, this.z);

    // 绘制阴影
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
      screenPos.sx,
      screenPos.sy,
      this.footprintWidth / 2,
      this.footprintHeight / 4,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // 根据类型选择颜色
    const color = this.type === 'NORMAL' ? '#ff8800' : '#ff0088';
    const darkColor = this.type === 'NORMAL' ? '#cc6600' : '#cc0066';
    const size = this.type === 'NORMAL' ? this.footprintWidth / 2 : this.footprintWidth / 2 + 2;

    // 绘制敌人（橙色/粉色球体）
    ctx.save();
    const gradient = ctx.createRadialGradient(
      screenPos.sx,
      screenPos.sy - 4,
      0,
      screenPos.sx,
      screenPos.sy - 4,
      size
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, darkColor);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenPos.sx, screenPos.sy - 4, size, 0, Math.PI * 2);
    ctx.fill();
    
    // 描边
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 精英怪显示额外标识
    if (this.type === 'ELITE') {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screenPos.sx, screenPos.sy - 4, size + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 绘制HP条（如果受伤）
    if (this.hp < this.maxHp) {
      const barWidth = size * 2;
      const barHeight = 4;
      const barX = screenPos.sx - barWidth / 2;
      const barY = screenPos.sy - size - 10;

      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // HP条
      const hpPercent = this.hp / this.maxHp;
      ctx.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }

    ctx.restore();
  }
}
