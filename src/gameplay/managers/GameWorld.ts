import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { GroundLoot } from '../entities/GroundLoot';
import { AuraNode } from '../entities/AuraNode';
import { ExtractionZone } from '../entities/ExtractionZone';
import { Enemy } from '../entities/Enemy';
import { PortalInstance } from '../entities/PortalInstance';
import { GroundBand } from '../../engine/render/GroundBand';
import { WalkArea } from '../../content/config/MapConfig';

/**
 * 游戏世界管理器
 * 负责管理游戏世界中的所有实体
 */
export class GameWorld {
  private player: Player | null = null;
  private groundBand: GroundBand | null = null;
  private obstacles: Obstacle[] = [];
  private groundLoots: GroundLoot[] = [];
  private auraNodes: AuraNode[] = [];
  private extractionZone: ExtractionZone | null = null;
  private enemies: Enemy[] = [];
  private portalInstances: PortalInstance[] = [];
  private walkArea: WalkArea | null = null;

  /**
   * 设置玩家
   */
  setPlayer(player: Player): void {
    this.player = player;
    if (this.obstacles.length > 0) {
      player.setObstacles(this.obstacles);
    }
    if (this.walkArea) {
      player.setWalkArea(this.walkArea);
    }
  }

  /**
   * 获取玩家
   */
  getPlayer(): Player | null {
    return this.player;
  }

  /**
   * 设置地面带
   */
  setGroundBand(groundBand: GroundBand): void {
    this.groundBand = groundBand;
  }

  /**
   * 获取地面带
   */
  getGroundBand(): GroundBand | null {
    return this.groundBand;
  }

  /**
   * 设置障碍物
   */
  setObstacles(obstacles: Obstacle[]): void {
    this.obstacles = obstacles;
    if (this.player) {
      this.player.setObstacles(obstacles);
    }
    // 更新所有敌人的障碍物
    for (const enemy of this.enemies) {
      enemy.setObstacles(obstacles);
    }
  }

  /**
   * 获取障碍物
   */
  getObstacles(): Obstacle[] {
    return [...this.obstacles];
  }

  /**
   * 添加障碍物
   */
  addObstacle(obstacle: Obstacle): void {
    this.obstacles.push(obstacle);
    if (this.player) {
      this.player.setObstacles(this.obstacles);
    }
  }

  /**
   * 设置地面掉落物
   */
  setGroundLoots(loots: GroundLoot[]): void {
    this.groundLoots = loots;
  }

  /**
   * 获取地面掉落物
   */
  getGroundLoots(): GroundLoot[] {
    return [...this.groundLoots];
  }

  /**
   * 添加地面掉落物
   */
  addGroundLoot(loot: GroundLoot): void {
    this.groundLoots.push(loot);
  }

  /**
   * 移除地面掉落物
   */
  removeGroundLoot(loot: GroundLoot): void {
    const index = this.groundLoots.indexOf(loot);
    if (index !== -1) {
      this.groundLoots.splice(index, 1);
    }
  }

  /**
   * 设置灵气点
   */
  setAuraNodes(nodes: AuraNode[]): void {
    this.auraNodes = nodes;
  }

  /**
   * 获取灵气点
   */
  getAuraNodes(): AuraNode[] {
    return [...this.auraNodes];
  }

  /**
   * 设置撤离点
   */
  setExtractionZone(zone: ExtractionZone | null): void {
    this.extractionZone = zone;
  }

  /**
   * 获取撤离点
   */
  getExtractionZone(): ExtractionZone | null {
    return this.extractionZone;
  }

  /**
   * 设置敌人
   */
  setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
    if (this.obstacles.length > 0) {
      for (const enemy of enemies) {
        enemy.setObstacles(this.obstacles);
      }
    }
    if (this.walkArea) {
      for (const enemy of enemies) {
        enemy.setWalkArea(this.walkArea);
      }
    }
  }

  /**
   * 获取敌人
   */
  getEnemies(): Enemy[] {
    return [...this.enemies];
  }

  /**
   * 添加敌人
   */
  addEnemy(enemy: Enemy): void {
    this.enemies.push(enemy);
    if (this.obstacles.length > 0) {
      enemy.setObstacles(this.obstacles);
    }
    if (this.walkArea) {
      enemy.setWalkArea(this.walkArea);
    }
  }

  /**
   * 移除敌人
   */
  removeEnemy(enemy: Enemy): void {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }

  /**
   * 移除所有已死亡的敌人
   */
  removeDeadEnemies(): void {
    this.enemies = this.enemies.filter(enemy => !enemy.isEnemyDead());
  }

  /**
   * 设置传送门实例
   */
  setPortalInstances(portals: PortalInstance[]): void {
    this.portalInstances = portals;
  }

  /**
   * 获取传送门实例
   */
  getPortalInstances(): PortalInstance[] {
    return [...this.portalInstances];
  }

  /**
   * 设置可走区域
   */
  setWalkArea(area: WalkArea): void {
    this.walkArea = area;
    if (this.player) {
      this.player.setWalkArea(area);
    }
    for (const enemy of this.enemies) {
      enemy.setWalkArea(area);
    }
  }

  /**
   * 获取可走区域
   */
  getWalkArea(): WalkArea | null {
    return this.walkArea;
  }

  /**
   * 清除所有实体
   */
  clear(): void {
    this.player = null;
    this.groundBand = null;
    this.obstacles = [];
    this.groundLoots = [];
    this.auraNodes = [];
    this.extractionZone = null;
    this.enemies = [];
    this.portalInstances = [];
    this.walkArea = null;
  }

  /**
   * 获取所有可渲染实体（用于渲染排序）
   */
  getAllRenderables(): Array<{ entity: any; y: number; z: number }> {
    const renderables: Array<{ entity: any; y: number; z: number }> = [];

    if (this.player) {
      renderables.push({ entity: this.player, y: this.player.y, z: this.player.z });
    }

    for (const obstacle of this.obstacles) {
      renderables.push({ entity: obstacle, y: obstacle.y, z: obstacle.z });
    }

    for (const loot of this.groundLoots) {
      renderables.push({ entity: loot, y: loot.y, z: loot.z });
    }

    for (const node of this.auraNodes) {
      renderables.push({ entity: node, y: node.y, z: node.z });
    }

    if (this.extractionZone) {
      renderables.push({ entity: this.extractionZone, y: this.extractionZone.y, z: this.extractionZone.z });
    }

    for (const enemy of this.enemies) {
      renderables.push({ entity: enemy, y: enemy.y, z: enemy.z });
    }

    for (const portal of this.portalInstances) {
      renderables.push({ entity: portal, y: portal.y, z: portal.z });
    }

    return renderables;
  }
}