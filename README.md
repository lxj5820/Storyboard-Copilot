<div align="center">
  <img src="./src-tauri/icons/128x128@2x.png" width="100" height="100" alt="Storyboard Copilot" style="margin-bottom: -50px;">
  <h1 style="color: ##111227;">分镜助手</h1>
  <h3>基于节点画布的 AI 分镜工作台，一站式完成图片生成、编辑与分镜流程</h3>

  [![Bilibili](https://img.shields.io/badge/bilibili-痕继痕迹-00AEEC?logo=bilibili)](https://space.bilibili.com/39337803)
</div>

<div align="center">
  <img src="./docs/imgs/readme/storyboard-copilot-homepage.webp" alt="Storyboard Copilot 首页截图" width="820" />
</div>

## 核心功能

| 功能 | 描述 |
|------|------|
| **图片上传** | 支持拖拽上传、粘贴图片、文件选择 |
| **AI 生图** | 支持多模型、多比例、多分辨率，prompt 支持引用上游图片（@图1、@图2） |
| **图片编辑** | AI 局部重绘、扩图、消除等能力 |
| **分镜切割** | 将图片按网格切割为分镜帧，支持自定义标注 |
| **AI 分镜生成** | 根据描述一次性生成完整分镜板 |
| **节点连线** | 可视化流程编排，节点间自动传递图片 |
| **导出输出** | 支持单图导出、分镜板导出、标注导出 |

## 下载

<div align="center">
Windows 用户请下载 **.exe** 文件，macOS 用户请下载 **.dmg** 文件

Windows 用户如果在启动时遇到了报错，请尝试安装 [WebView2 运行时](https://developer.microsoft.com/zh-cn/Microsoft-edge/webview2#download)

### Github 下载
[![Download Latest Release](https://img.shields.io/github/v/release/henjicc/Storyboard-Copilot?style=for-the-badge&color=blue)](https://github.com/henjicc/Storyboard-Copilot/releases/latest)

### 网盘下载
**夸克网盘**：[https://pan.quark.cn/s/5b6733a8fc8e](https://pan.quark.cn/s/5b6733a8fc8e)

</div>

## 赞助

<div align="center">
  <div style="text-align: center; font-weight: 700; margin-bottom: 10px; font-size: 20px;">
    <a href="https://platform.minimaxi.com/subscribe/coding-plan?code=8XOI15IbO4&source=link" target="_blank" style="color: #f0440bff; text-decoration: none;">
      MiniMax M2.5 Coding Plan 专属 88 折优惠
    </a>
  </div>
  <a href="https://platform.minimaxi.com/subscribe/coding-plan?code=8XOI15IbO4&source=link" target="_blank">
    <img src="./docs/imgs/readme/MiniMax_Coding_Plan.webp" alt="MiniMax Coding Plan" width="720">
  </a>
</div>

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 状态管理 | Zustand |
| 画布引擎 | @xyflow/react |
| 样式 | TailwindCSS |
| 桌面容器 | Tauri 2 |
| 后端 | Rust 命令接口 |
| 数据存储 | SQLite（rusqlite，WAL 模式） |
| 国际化 | react-i18next + i18next |

## 环境要求

- Node.js 20+
- npm 10+
- Rust stable（含 Cargo）
- Tauri 平台依赖（Windows/macOS）

安装与平台准备可参考：
- [基础工具安装配置（Windows / macOS）](./docs/development-guides/base-tools-installation.md)

## 快速开始

```bash
# 安装依赖
npm install

# 仅前端开发
npm run dev

# Tauri 联调（推荐）
npm run tauri dev
```

## 常用命令

```bash
# TypeScript 类型检查
npx tsc --noEmit

# Rust 快速检查
cd src-tauri && cargo check

# 前端构建检查
npm run build

# Tauri 构建桌面应用
npm run tauri build
```

## 一键发布（自动构建 + Release）

本项目支持一条命令完成版本联动、触发 GitHub Actions 构建并发布 Release。

```bash
# patch 递增（例如 0.1.0 -> 0.1.1），并写入本次更新说明
npm run release -- patch "修复导出节点在大图下崩溃；优化启动速度"

# 或指定版本号
npm run release -- 0.2.0 "新增分镜批量裁剪工具"
```

命令会自动执行：
- 同步版本号到 `package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`
- 提交版本变更并创建带说明的 tag（如 `v0.2.0`）
- 推送分支和 tag，触发 `.github/workflows/build.yml`
- 由 Action 构建 Windows/macOS 安装包并发布到 GitHub Releases

---

## 架构设计

### 核心理念

- **解耦**：模块间依赖接口/类型，不直接依赖实现细节
- **可扩展**：模型、工具、节点各自独立注册
- **可回归验证**：自动化测试覆盖核心路径
- **自动持久化**：项目状态实时保存，无需手动保存
- **交互性能优先**：拖拽中不写盘，使用防抖 + idle 调度

### 分层数据流

```
UI 输入 → Store → Application Service → Command/API → Persistence
```

### 节点系统

项目定义了 **7 种节点类型**：

| 类型 | 用途 | 输入 | 输出 |
|------|------|------|------|
| `uploadNode` | 图片上传 | - | ✓ |
| `imageEditNode` | AI 图片生成 | ✓ | ✓ |
| `exportImageNode` | 导出结果展示 | ✓ | ✓ |
| `textAnnotationNode` | 文字标注 | - | - |
| `groupNode` | 分组容器 | - | - |
| `storyboardNode` | 分镜切割 | ✓ | ✓ |
| `storyboardGenNode` | AI 分镜生成 | ✓ | ✓ |

**单一真相源原则**：所有节点元数据（类型、默认数据、菜单展示、连线能力）统一在 `nodeRegistry.ts` 声明。

### 工具体系

工具采用分层架构：

```
tools/types.ts        # 能力定义
tools/builtInTools.ts # 插件注册
ui/tool-editors/*     # UI 编辑器
application/toolProcessor.ts # 执行逻辑
```

### 持久化策略

- **双通道设计**：
  - 项目快照：`upsert_project_record`（防抖 + idle 调度）
  - 视口快照：`update_project_viewport_record`（轻量更新、独立防抖）
- **图片去重**：`imagePool + __img_ref__` 编码
- **SQLite 位于**：`app_data_dir/projects.db`

### 性能优化实践

- 拖拽中不写盘，拖拽结束再保存
- 大图片场景使用 `previewImageUrl` 缩略图，原图按需加载
- 使用 `useMemo/useCallback` 控制重渲染
- viewport 持久化独立队列，避免与交互争用主线程

---

## 项目结构

```text
src/
├── App.tsx                          # 入口组件
├── stores/
│   ├── projectStore.ts              # 项目级状态 + 自动持久化
│   └── canvasStore.ts               # 画布状态
├── features/canvas/
│   ├── Canvas.tsx                   # 画布主组件
│   ├── domain/
│   │   ├── canvasNodes.ts           # 节点类型与数据结构
│   │   └── nodeRegistry.ts          # 节点注册表
│   ├── nodes/                       # 节点组件
│   │   ├── UploadNode.tsx           # 上传节点
│   │   ├── ImageEditNode.tsx        # AI 生成节点
│   │   ├── ImageNode.tsx            # 导出/结果节点
│   │   ├── StoryboardNode.tsx       # 分镜切割节点
│   │   └── ...
│   ├── tools/                       # 工具体系
│   ├── models/                      # AI 模型适配
│   │   ├── types.ts                 # 模型类型定义
│   │   ├── registry.ts              # 模型注册表
│   │   └── image/                   # 各供应商模型实现
│   └── ui/                          # 覆盖层、工具条、控件
├── commands/                        # Tauri 命令桥接
├── i18n/                           # 国际化
└── components/ui/                  # 通用 UI 组件

src-tauri/src/
├── commands/                       # Rust 命令实现
│   ├── project_state.rs            # 项目状态管理
│   └── ...
└── lib.rs                          # Tauri 入口

docs/development-guides/            # 开发文档
```

---

## 扩展开发

### 新增 AI 模型

1. 在 `src/features/canvas/models/image/<provider>/` 新增模型文件
2. 声明 `displayName`、`providerId`、支持分辨率/比例、默认参数
3. 实现请求映射函数 `resolveRequest`

详细指南：[供应商与模型扩展指南](./docs/development-guides/provider-and-model-extension.md)

### 新增工具

1. 在 `src/features/canvas/tools/types.ts` 声明工具能力
2. 在 `src/features/canvas/tools/builtInTools.ts` 注册插件
3. 在 `src/features/canvas/ui/tool-editors/` 新增编辑器
4. 在 `src/features/canvas/application/toolProcessor.ts` 接入执行逻辑

### 新增节点

1. 在 `src/features/canvas/domain/canvasNodes.ts` 增加类型与数据结构
2. 在 `src/features/canvas/domain/nodeRegistry.ts` 注册：
   - `createDefaultData`：默认数据工厂
   - `capabilities`：工具栏、prompt 输入等能力
   - `connectivity`：输入/输出端口、菜单可见性
3. 在 `src/features/canvas/nodes/index.ts` 注册渲染组件

**验证清单**：
- 手动创建策略（是否出现在节点菜单）
- 连线清理（删除节点时关联边是否正确清理）
- 历史快照（撤销/重做是否正常工作）
- 节点工具条位置是否正确跟随

---

## i18n 约定

- 入口：`src/i18n/index.ts`
- 语言包：`src/i18n/locales/zh.json`、`src/i18n/locales/en.json`
- 代码中使用 `useTranslation()` + `t('key.path')`，避免硬编码文案
- Key 命名采用模块化层级：`project.title`、`node.menu.uploadImage`

---

## 开发文档导航

- [项目开发环境与注意事项](./docs/development-guides/project-development-setup.md)
- [供应商与模型扩展指南](./docs/development-guides/provider-and-model-extension.md)
- [基础工具安装配置（Windows / macOS）](./docs/development-guides/base-tools-installation.md)
