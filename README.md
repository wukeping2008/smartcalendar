# 🚀 智能日历系统 Smart Calendar v4.0

一个 AI 驱动的智能时间管理平台，集成多种 AI 模型、实时数据感知和智能决策功能。

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![AI Enhanced](https://img.shields.io/badge/AI-Enhanced-purple)](https://github.com/yourusername/smartcalendar)

[English Version](./README_EN.md) | 中文版

## ✨ 核心特性

### 🧠 AI 智能核心
- **多 AI 模型集成** - Claude、OpenAI GPT 等多种模型协同工作
- **智能决策引擎** - 多维度分析（生产力、精力、AI 增强）
- **自然语言理解** - 支持自然语言创建和管理日程
- **智能推荐系统** - 基于用户习惯和数据分析提供个性化建议

### 📅 日程管理
- **多视图切换** - 日视图、周视图、月视图灵活切换
- **智能冲突检测** - 自动识别和解决日程冲突
- **认知带宽管理** - 基于认知科学的任务负载管理
- **时间预算系统** - 精确的时间分配和追踪

### 🎯 专业功能
- **GTD 任务管理** - 完整的 Getting Things Done 工作流
- **项目管理** - 多项目并行管理和进度追踪
- **SOP 执行器** - 标准操作流程自动化
- **What-If 模拟器** - 场景模拟和决策支持

### 🎤 交互体验
- **语音输入** - Azure Speech Service 支持的语音交互
- **3D 时间流** - Three.js 驱动的立体时间可视化
- **浮动面板系统** - 灵活的多面板工作区
- **响应式设计** - 完美适配桌面和移动设备

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/smartcalendar.git
cd smartcalendar
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
创建 `.env.local` 文件：
```env
# AI 服务配置（可选）
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

# 语音服务配置（可选）
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_region
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📖 使用指南

### 基础操作
1. **创建事件** - 点击"新建事件"按钮或使用语音输入
2. **切换视图** - 使用顶部导航栏切换日/周/月视图
3. **管理任务** - 通过 GTD 面板管理待办事项
4. **查看分析** - 访问认知带宽监控面板查看负载情况

### 高级功能
- **浮动面板** - 点击右侧图标栏打开各种功能面板
- **AI 助手** - 使用 AI 助手获取智能建议
- **项目管理** - 创建和管理多个项目
- **时间预算** - 设置和跟踪时间预算

## 🏗️ 技术架构

### 技术栈
- **前端框架**: Next.js 15.4 + React 19
- **类型系统**: TypeScript 5.0
- **样式方案**: Tailwind CSS + Radix UI
- **状态管理**: Zustand
- **3D 渲染**: Three.js + React Three Fiber
- **数据持久化**: IndexedDB

### 项目结构
```
smartcalendar/
├── src/
│   ├── app/              # Next.js 应用路由
│   └── components/       # UI 组件
├── components/           # 功能组件
│   ├── ai/              # AI 相关组件
│   ├── calendar/        # 日历组件
│   ├── cognitive/       # 认知管理
│   ├── gtd/            # GTD 任务管理
│   └── ...             # 其他功能组件
├── lib/                 # 核心库
│   ├── services/        # 服务层
│   ├── stores/          # 状态存储
│   └── engines/         # 业务引擎
├── types/               # TypeScript 类型定义
└── docs/                # 项目文档
```

## 🔧 开发指南

### 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
```

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 配置的代码规范
- 组件采用函数式组件和 Hooks
- 使用 Tailwind CSS 进行样式开发

## 📝 更新日志

查看 [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md) 了解详细的开发进度和更新历史。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request。在提交之前，请确保：

1. 代码通过 lint 检查
2. 添加必要的类型定义
3. 更新相关文档
4. 测试功能正常

## 📄 许可证

MIT License

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户。

---

**项目维护**: [Your Name]  
**最后更新**: 2025-01-17  
**版本**: v4.0 稳定版