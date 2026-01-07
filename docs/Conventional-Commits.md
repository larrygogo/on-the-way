# Conventional Commits 使用指南

本项目已配置 Conventional Commits 规范，所有提交消息必须遵循该规范。

## 📋 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 必需部分

- **type**: 提交类型（必需）
- **subject**: 提交主题（必需）

### 可选部分

- **scope**: 影响范围（可选）
- **body**: 详细描述（可选）
- **footer**: 相关引用（可选）

## 🏷️ 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加背包系统` |
| `fix` | 修复 bug | `fix: 修复碰撞检测问题` |
| `docs` | 文档变更 | `docs: 更新 README` |
| `style` | 代码格式（不影响代码运行） | `style: 格式化代码` |
| `refactor` | 重构 | `refactor: 重构渲染系统` |
| `perf` | 性能优化 | `perf: 优化渲染性能` |
| `test` | 增加测试 | `test: 添加碰撞测试` |
| `chore` | 构建过程或辅助工具的变动 | `chore: 更新依赖` |
| `revert` | 回滚 | `revert: 回滚某次提交` |
| `build` | 构建系统或外部依赖的更改 | `build: 更新构建配置` |
| `ci` | CI 配置文件和脚本的更改 | `ci: 添加 GitHub Actions` |

## 📝 示例

### 简单提交

```bash
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
```

### 带 scope 的提交

```bash
feat(ui): 添加背包界面
fix(collision): 修复碰撞检测问题
refactor(renderer): 重构渲染系统
```

### 带详细描述的提交

```bash
feat: 添加背包系统

实现了安全区和普通区的双区域背包管理
- 安全区容量 2 格
- 普通区容量 8 格
- 支持物品转移功能
```

### 带 footer 的提交

```bash
fix: 修复内存泄漏问题

修复了渲染器中的内存泄漏

Closes #123
```

## ⚠️ 注意事项

1. **主题行**：
   - 使用中文或英文都可以
   - 首字母大小写不限
   - 结尾不要加句号
   - 长度建议不超过 50 个字符

2. **类型和主题之间必须有冒号和空格**：
   - ✅ `feat: 添加功能`
   - ❌ `feat:添加功能`
   - ❌ `feat 添加功能`

3. **提交消息会自动验证**：
   - 如果格式不正确，提交会被拒绝
   - 需要修改提交消息后重新提交

## 🔧 工具配置

### Commitlint

配置文件：`commitlint.config.js`

- 使用 `@commitlint/config-conventional` 作为基础配置
- 支持中文提交消息
- 主题行大小写不限制

### Husky

Git hooks 配置在 `.husky/` 目录：

- `commit-msg`: 自动验证提交消息格式
- `pre-commit`: 提交前运行测试（可自定义）

## 🚀 使用流程

1. 编写代码并暂存：
   ```bash
   git add .
   ```

2. 提交时使用正确的格式：
   ```bash
   git commit -m "feat: 添加新功能"
   ```

3. 如果格式不正确，提交会被拒绝，需要修改后重新提交。

## 📚 参考资源

- [Conventional Commits 规范](https://www.conventionalcommits.org/)
- [Commitlint 文档](https://commitlint.js.org/)
- [Husky 文档](https://typicode.github.io/husky/)



