# 入途 (On The Way) - 2.5D 横向卷轴生存游戏

一个使用 TypeScript + Canvas 开发的 2.5D 横向卷轴生存游戏 MVP。玩家需要在限时内收集物品、管理背包、采集灵气，并成功撤离。

## 🎮 游戏特性

### 核心玩法
- ✅ **横向卷轴 2.5D 视角** - 左右推进，上下走位，深度排序渲染
- ✅ **障碍物碰撞系统** - AABB 碰撞检测，滑墙效果
- ✅ **物品拾取系统** - 地面掉落物，E 键交互拾取
- ✅ **背包管理系统** - 安全区/普通区双区域，容量管理
- ✅ **灵气系统** - 采集灵气点，消耗灵气转移物品到安全区
- ✅ **撤离系统** - 自动开始撤离，区域内免伤，读条完成成功撤离
- ✅ **怪物系统** - 常驻怪物 + 全局波次 + 撤离波次
- ✅ **结算系统** - 成功/失败结算，物品保留/丢失机制

### 游戏机制
- **时间限制**: 12 分钟倒计时
- **HP 系统**: 100 HP，接触怪物扣血
- **读条系统**: 采集灵气、转移物品、撤离都需要读条
- **背包容量**: 安全区 2 格，普通区 8 格
- **撤离条件**: 需要 100 灵气，15 秒读条

## 🛠️ 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的前端构建工具
- **Canvas API** - 原生 Canvas 2D 渲染（不使用 Three.js）
- **原生 JavaScript** - 无框架依赖
- **Conventional Commits** - 提交消息规范（Commitlint + Husky）

## 📁 项目结构

```
on-the-way/
├── package.json              # 项目配置和依赖
├── tsconfig.json             # TypeScript 编译配置
├── vite.config.ts            # Vite 构建配置
├── commitlint.config.js      # Commitlint 配置
├── index.html                # 入口 HTML（全屏 Canvas）
├── .gitignore                # Git 忽略文件
├── data/                     # 游戏数据文件
│   ├── dungeons/             # 秘境配置
│   │   └── demo_dungeon.json
│   ├── maps/                 # 地图配置
│   │   ├── map_001.json
│   │   ├── map_002.json
│   │   ├── map_003.json
│   │   ├── map_004.json
│   │   └── map_005.json
│   └── portal_templates.json # 传送门模板
├── src/
│   ├── main.ts               # 应用入口，初始化游戏
│   ├── style.css             # 全屏样式，DPR 自适应
│   └── game/
│       ├── Renderable.ts     # 可渲染接口
│       ├── Camera.ts         # 相机系统（横向卷轴跟随）
│       ├── Player.ts         # 玩家实体（位置、移动、HP、碰撞）
│       ├── GroundBand.ts     # 地面带（可走区域）
│       ├── Renderer.ts       # 渲染器（Canvas 上下文管理，按 y 排序）
│       ├── Obstacle.ts       # 障碍物实体
│       ├── Collision.ts      # 碰撞检测工具
│       ├── Item.ts           # 物品类型定义
│       ├── GroundLoot.ts    # 地面掉落物
│       ├── Bag.ts            # 背包系统（安全区/普通区）
│       ├── Aura.ts           # 灵气系统
│       ├── AuraNode.ts       # 灵气点实体
│       ├── Channeling.ts     # 读条系统
│       ├── SessionTimer.ts   # 全局倒计时
│       ├── ExtractionZone.ts # 撤离点
│       ├── Enemy.ts          # 敌人实体（怪物）
│       ├── GameConfig.ts     # 游戏配置
│       ├── MapConfig.ts      # 地图配置类型
│       ├── MapLoader.ts      # 地图加载器
│       ├── DungeonConfig.ts  # 秘境配置类型
│       ├── PortalTemplate.ts # 传送门模板类型
│       ├── WorldBuilder.ts   # 世界构建器
│       ├── UI.ts             # UI 渲染系统
│       ├── Game.ts           # 主游戏循环
│       ├── dungeon/          # 秘境系统
│       │   ├── DungeonLoader.ts      # 秘境加载器
│       │   └── DungeonRunState.ts    # 秘境运行状态
│       ├── map/              # 地图切换系统
│       │   └── MapSwitcher.ts        # 地图切换器
│       └── portal/           # 传送门系统
│           ├── PortalInstance.ts            # 传送门实例
│           ├── PortalSpawner.ts             # 传送门生成器
│           ├── PortalChannelController.ts   # 传送门读条控制器
│           └── PortalTemplateLoader.ts      # 传送门模板加载器
└── docs/                     # 项目文档
    ├── 说明.md               # 文档目录
    ├── 改动记录.md           # 改动总结
    ├── Conventional-Commits.md              # 提交消息规范指南
    ├── 地图系统.md           # 地图系统文档
    ├── 碰撞系统.md           # 碰撞系统文档
    ├── 拾取与背包系统.md     # 拾取与背包系统文档
    ├── 灵气系统.md           # 灵气系统文档
    ├── 撤离与结算系统.md     # 撤离与结算系统文档
    └── 怪物系统.md           # 怪物系统文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- pnpm（推荐）或 npm

### 安装依赖

使用 pnpm（推荐）：
```bash
pnpm install
```

或使用 npm：
```bash
npm install
```

### 开发模式

启动开发服务器：
```bash
pnpm dev
# 或
npm run dev
```

浏览器访问 `http://localhost:5173`

### 构建生产版本

```bash
pnpm build
# 或
npm run build
```

构建产物在 `dist/` 目录

### 预览生产版本

```bash
pnpm preview
# 或
npm run preview
```

## 🎯 游戏操作

### 基本操作
- **W/A/S/D** - 移动（上/左/下/右）
- **E** - 交互（采集灵气点 / 拾取物品）
- **I / Tab** - 打开/关闭背包
- **Esc** - 取消读条 / 关闭背包
- **F1** - 切换调试模式（显示碰撞盒）

### 游戏流程
1. **收集物品** - 在地图上拾取掉落物（药水、装备）
2. **采集灵气** - 靠近灵气点按 E 采集（需要 2 秒读条）
3. **管理背包** - 按 I 打开背包，管理安全区和普通区物品
4. **转移物品** - 消耗 8 灵气将普通区物品转移到安全区（需要 1.5 秒读条）
5. **撤离** - 收集 100 灵气后，进入撤离区域自动开始撤离（需要 15 秒读条）
6. **结算** - 成功撤离保留所有物品，失败只保留安全区物品

## 🎨 核心系统

### 坐标系统
- **世界坐标**: `(x, y, z)` 
  - `x`: 左右推进（横向卷轴方向）
  - `y`: 上下走位（深度轴，用于排序）
  - `z`: 保留字段（暂未使用）
- **屏幕映射**: `sx = x - cameraX`, `sy = y - cameraY`
- **深度排序**: 使用 `y` 作为 depthKey，越靠下（y 值大）的实体越在前

### 相机系统
- **横向卷轴**: 相机主要跟随玩家 x 坐标
- **屏幕中心**: 玩家始终在屏幕中心（x 方向）
- **文件**: `src/game/Camera.ts`

### 碰撞系统
- **AABB 碰撞检测**: 轴对齐包围盒
- **滑墙效果**: axis-separate 移动处理
- **文件**: `src/game/Collision.ts`, `src/game/Player.ts`

### 背包系统
- **安全区**: 容量 2 格，结算时必定保留
- **普通区**: 容量 8 格，成功撤离时保留，失败时清空
- **物品类型**: 
  - `POTION` - 占 1 格
  - `EQUIPMENT` - 占 2 格
- **文件**: `src/game/Bag.ts`

### 灵气系统
- **容量**: 200
- **采集**: 每个灵气点 +20，需要 2 秒读条
- **消耗**: 转移物品到安全区消耗 8，撤离消耗 100
- **文件**: `src/game/Aura.ts`, `src/game/AuraNode.ts`

### 撤离系统
- **自动开始**: 进入撤离区域且灵气 >= 100 时自动开始
- **读条时间**: 15 秒
- **区域内免伤**: 在撤离区域内不受怪物伤害
- **离开取消**: 离开区域自动取消撤离（不触发失败）
- **扣费时机**: 读条完成时扣费（成功时）
- **文件**: `src/game/ExtractionZone.ts`, `src/game/Game.ts`

### 怪物系统
- **常驻怪物**: 游戏开始时生成 8-10 个怪物
- **全局波次**: 每 2 分钟生成一波（2-4 个）
- **撤离波次**: 撤离开始后第 3 秒和第 9 秒各生成一波（3-5 个）
- **伤害**: 接触怪物扣 10 HP
- **文件**: `src/game/Enemy.ts`

### UI 系统
- **HUD**: 显示背包占用、灵气、倒计时、HP
- **交互提示**: 显示可拾取物品、可采集灵气点
- **背包面板**: 两栏布局（安全区/普通区）
- **读条进度**: 显示读条进度条
- **结算界面**: 显示成功/失败原因、带回物品、丢失物品
- **文件**: `src/game/UI.ts`

### 地图系统
- **地图配置**: 从 JSON 文件加载地图配置
- **地图切换**: 支持多地图切换和状态保存
- **世界构建**: 从配置生成游戏世界（障碍物、灵气点、撤离点等）
- **文件**: `src/game/MapConfig.ts`, `src/game/MapLoader.ts`, `src/game/WorldBuilder.ts`, `src/game/map/MapSwitcher.ts`

### 秘境系统
- **秘境配置**: 从 JSON 文件加载秘境配置
- **秘境运行**: 管理秘境运行状态和流程
- **文件**: `src/game/DungeonConfig.ts`, `src/game/dungeon/DungeonLoader.ts`, `src/game/dungeon/DungeonRunState.ts`

### 传送门系统
- **传送门模板**: 从 JSON 文件加载传送门模板
- **传送门实例**: 管理传送门的生成和交互
- **读条控制**: 传送门交互的读条机制
- **文件**: `src/game/PortalTemplate.ts`, `src/game/portal/PortalInstance.ts`, `src/game/portal/PortalSpawner.ts`, `src/game/portal/PortalChannelController.ts`, `src/game/portal/PortalTemplateLoader.ts`

## 📚 文档

详细开发文档位于 `docs/` 目录：

- **[说明.md](docs/说明.md)** - 文档目录索引
- **[改动记录.md](docs/改动记录.md)** - 项目改动总结
- **[Conventional-Commits.md](docs/Conventional-Commits.md)** - 提交消息规范指南
- **[地图系统.md](docs/地图系统.md)** - 地图系统：坐标系统、相机跟随、地面渲染和深度排序
- **[碰撞系统.md](docs/碰撞系统.md)** - 碰撞系统：障碍物、碰撞检测和滑墙效果
- **[拾取与背包系统.md](docs/拾取与背包系统.md)** - 拾取与背包系统：物品拾取、背包管理和容量系统
- **[灵气系统.md](docs/灵气系统.md)** - 灵气系统：灵气采集、消耗和读条机制
- **[撤离与结算系统.md](docs/撤离与结算系统.md)** - 撤离与结算系统：倒计时、撤离点、HP管理和游戏结算
- **[怪物系统.md](docs/怪物系统.md)** - 怪物系统：敌人类型、AI行为、战斗和刷新机制

## 🔧 技术细节

### 渲染系统
- **DPR 自适应**: 自动检测 `devicePixelRatio`，适配高 DPI 屏幕
- **深度排序**: 按 `y + sortOffset` 排序，实现正确的遮挡效果
- **扁平风格**: 简洁的 2D 扁平化设计

### 性能优化
- **按需渲染**: 只渲染屏幕可见区域
- **对象池**: 可扩展的对象池系统（预留）
- **帧率控制**: 使用 `requestAnimationFrame` 实现流畅动画

### 代码架构
- **模块化设计**: 每个系统独立文件，职责清晰
- **接口抽象**: `Renderable` 接口统一渲染接口
- **类型安全**: 完整的 TypeScript 类型定义

## 🎮 游戏机制说明

### 背包管理
- **安全区**: 容量 2，结算时必定保留，可以免费移回普通区
- **普通区**: 容量 8，成功撤离时保留，失败时清空
- **转移**: 普通区 → 安全区需要 8 灵气 + 1.5 秒读条
- **丢弃**: 可以随时丢弃物品，生成地面掉落物

### 撤离机制
- **条件**: 需要 100 灵气才能开始撤离
- **自动开始**: 进入撤离区域且满足条件时自动开始
- **读条**: 15 秒读条，期间可以移动
- **免伤**: 在撤离区域内不受怪物伤害
- **取消**: 离开区域自动取消，不触发失败结算
- **成功**: 读条完成时扣费并成功撤离

### 结算机制
- **成功**: 保留安全区 + 普通区所有物品
- **失败**: 只保留安全区物品，普通区物品清空
- **失败原因**: 
  - `TIMEOUT` - 倒计时到 0
  - `DEAD` - HP 归零
  - `EXTRACT_INTERRUPTED` - 撤离被打断（按 Esc）

## 🐛 调试功能

按 **F1** 键切换调试模式：
- 显示玩家碰撞盒（footprint）
- 显示障碍物碰撞盒
- 半透明矩形可视化碰撞区域

## 📝 开发计划

### 已完成 ✅
- [x] 横向卷轴 2.5D 基础系统
- [x] 障碍物与碰撞系统
- [x] 物品拾取与背包系统
- [x] 灵气系统与物品转移
- [x] 撤离点与结算系统
- [x] 常驻怪物与干扰波次

### 未来计划 🚧
- [ ] 更多怪物类型和 AI
- [ ] 更多物品类型和效果
- [ ] 技能系统
- [ ] 成就系统
- [ ] 音效和背景音乐
- [ ] 存档系统

## 📄 许可证

本项目仅供学习和参考使用。

## 🙏 致谢

感谢所有为这个项目提供帮助和建议的开发者。
