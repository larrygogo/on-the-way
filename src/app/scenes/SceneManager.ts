import { Scene } from './Scene';

/**
 * 场景管理器
 * 管理场景的切换、更新和渲染
 */
export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private nextSceneName: string | null = null;
  private isTransitioning: boolean = false;

  /**
   * 注册场景
   * @param scene 场景实例
   */
  register(scene: Scene): void {
    this.scenes.set(scene.name, scene);
  }

  /**
   * 注销场景
   * @param name 场景名称
   */
  unregister(name: string): void {
    const scene = this.scenes.get(name);
    if (scene) {
      if (this.currentScene === scene) {
        this.currentScene = null;
      }
      scene.destroy();
      this.scenes.delete(name);
    }
  }

  /**
   * 切换到指定场景
   * @param name 场景名称
   * @param force 是否强制切换（即使已经是当前场景）
   */
  async switchTo(name: string, force: boolean = false): Promise<void> {
    if (this.isTransitioning) {
      // 如果正在切换，记录下一个场景
      this.nextSceneName = name;
      return;
    }

    if (!force && this.currentScene?.name === name) {
      return; // 已经是当前场景
    }

    const targetScene = this.scenes.get(name);
    if (!targetScene) {
      throw new Error(`[SceneManager] 场景不存在: ${name}`);
    }

    this.isTransitioning = true;

    try {
      // 暂停当前场景
      if (this.currentScene) {
        this.currentScene.pause?.();
      }

      // 初始化新场景
      await targetScene.init();

      // 销毁旧场景
      if (this.currentScene && this.currentScene !== targetScene) {
        this.currentScene.destroy();
      }

      // 切换场景
      this.currentScene = targetScene;
      this.currentScene.resume?.();

      // 如果还有待切换的场景，继续切换
      if (this.nextSceneName && this.nextSceneName !== name) {
        const next = this.nextSceneName;
        this.nextSceneName = null;
        await this.switchTo(next, true);
      }
    } catch (error) {
      console.error(`[SceneManager] 切换场景失败 (${name}):`, error);
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * 获取当前场景
   */
  getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  /**
   * 获取当前场景名称
   */
  getCurrentSceneName(): string | null {
    return this.currentScene?.name || null;
  }

  /**
   * 更新当前场景
   * @param deltaTime 帧时间差（秒）
   */
  update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  /**
   * 渲染当前场景
   * @param ctx Canvas 2D 上下文
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.currentScene) {
      this.currentScene.render(ctx);
    }
  }

  /**
   * 检查场景是否存在
   * @param name 场景名称
   */
  hasScene(name: string): boolean {
    return this.scenes.has(name);
  }

  /**
   * 获取所有已注册的场景名称
   */
  getSceneNames(): string[] {
    return Array.from(this.scenes.keys());
  }

  /**
   * 清除所有场景
   */
  clear(): void {
    if (this.currentScene) {
      this.currentScene.destroy();
      this.currentScene = null;
    }

    for (const scene of this.scenes.values()) {
      scene.destroy();
    }

    this.scenes.clear();
    this.nextSceneName = null;
    this.isTransitioning = false;
  }
}