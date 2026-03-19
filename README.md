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

- [Windows 安装包 (v0.1.13)](https://github.com/lxj5820/Storyboard-Copilot/releases)

## 技术栈

- 前端：React + TypeScript + Zustand + @xyflow/react + TailwindCSS
- 后端：Tauri 2 + Rust
- 数据库：SQLite

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# Tauri 联调
npm run tauri dev

# 构建
npm run build
```

## License

MIT
