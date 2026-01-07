# 场景系统

## 场景位置

所有场景都应该放在 `src/app/scenes/` 目录下。

## 场景组织

```
src/app/scenes/
├── Scene.ts              # 场景接口定义
├── SceneManager.ts       # 场景管理器
├── MainMenuScene.ts      # 主菜单场景
├── GameScene.ts          # 游戏场景
├── ResultScene.ts        # 结算场景
└── README.md             # 本文件
```

## 创建新场景

1. 在 `src/app/scenes/` 目录下创建新的场景文件
2. 实现 `Scene` 接口
3. 在 `AppBootstrap` 或 `main.ts` 中注册场景

### 示例

```typescript
import { Scene } from './Scene';

export class MyNewScene implements Scene {
  readonly name = 'MY_SCENE';
  
  async init(): Promise<void> {
    // 初始化场景
  }
  
  update(deltaTime: number): void {
    // 更新场景
  }
  
  render(ctx: CanvasRenderingContext2D): void {
    // 渲染场景
  }
  
  destroy(): void {
    // 清理资源
  }
}
```

## 场景命名规范

- 场景名称使用大写字母和下划线：`MAIN_MENU`、`GAME`、`RESULT`
- 场景类名使用 PascalCase：`MainMenuScene`、`GameScene`、`ResultScene`
- 文件名与类名一致：`MainMenuScene.ts`

## 场景职责

每个场景应该：
- 管理自己的生命周期（init、update、render、destroy）
- 处理场景内的逻辑和状态
- 通过 SceneManager 进行场景切换
- 使用事件系统与其他系统通信

## 场景切换

使用 SceneManager 进行场景切换：

```typescript
const sceneManager = appBootstrap.getSceneManager();
await sceneManager.switchTo('GAME');
```

## 当前场景

- **MainMenuScene** - 主菜单场景（处理主菜单显示和交互）
- **GameScene** - 游戏场景（处理游戏运行时的逻辑）
- **ResultScene** - 结算场景（显示游戏结算结果）

## 注意事项

- 场景切换是异步的，使用 `await` 等待切换完成
- 场景销毁时会自动清理资源
- 场景可以通过 `pause()` 和 `resume()` 方法暂停和恢复