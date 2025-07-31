# 🎯 秉笔太监智能秘书系统 v2.0

**Smart Calendar v2** - 基于3D时间流的智能日历管理系统，支持Trading专业任务和语音创建

[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-3D-green?logo=three.js)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38b2ac?logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 功能特色

### 🎨 革命性3D时间流可视化
- **立体时间轴** - Three.js驱动的3D时间管理体验
- **交互操作** - 拖拽旋转、滚轮缩放、点击选择
- **空间布局** - 智能事件空间分布算法
- **双视图切换** - 传统日历与3D时间流无缝切换

### 🎤 智能语音解析系统
- **复杂中文理解** - "明天下午2点开会，提前1小时提醒发材料"
- **自动任务生成** - 智能创建主事件和准备任务
- **多重提醒系统** - 自动30分钟+5分钟双重提醒
- **语音确认反馈** - 实时语音解析结果展示

### 📊 Trading专业工作流
- **扫watchlist** - 每小时整点执行，5分钟高效扫描
- **key in数据** - 每15分钟数据录入，保持信息实时
- **捕兽夹任务** - 会议间隙执行，灵活时间管理
- **TABATA锻炼** - 5分钟高效锻炼，保持最佳状态
- **市场保护时段** - 重要交易时间自动保护

### 🧠 智能分析引擎
- **冲突检测** - 实时检测时间重叠并提供解决建议
- **工时预算** - 16小时工作预算，实时利用率监控
- **精力管理** - Peak/High/Medium/Low精力等级优化
- **灵活度评分** - 评估任务可调整程度

### 📚 用户指南系统 (v2.0新增)
- **互动式教程** - 6步完整学习路径
- **智能浮动提示** - 8个分类技巧自动轮换
- **上下文感知** - 根据当前视图显示相关内容
- **新手友好** - 完整的用户引导体验

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- 现代浏览器支持

### 安装运行
```bash
# 克隆项目
git clone https://github.com/[username]/smart-calendar-v2.git
cd smart-calendar-v2

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
open http://localhost:3000
```

### 生产构建
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🎮 使用指南

### 基础操作
1. **创建事件** - 点击"📝 新建事件"或"🎤 语音输入"
2. **3D操作** - 拖拽旋转视角，滚轮缩放，点击选择事件
3. **视图切换** - 点击头部"📅 日历视图"或"🌊 时间流"按钮
4. **用户指南** - 点击"📚 使用指南"查看完整教程

### 语音输入示例
```
🎤 "明天下午2点和小王开会，提前1小时提醒发材料"
```
系统将自动：
- ✅ 创建明天14:00-15:00会议事件
- ✅ 生成明天13:00发送材料准备任务
- ✅ 设置1小时+30分钟双重提醒

### Trading专业功能
- **整点任务**: 扫watchlist每小时自动提醒
- **间隔任务**: key in数据每15分钟执行
- **灵活任务**: 捕兽夹、锻炼安排在空闲时间
- **市场保护**: 重要交易时段自动避免安排其他任务

## 🏗️ 技术架构

### 核心技术栈
- **前端框架**: Next.js 15.4 + React 19
- **类型安全**: TypeScript 完整类型系统
- **样式系统**: Tailwind CSS 4 现代化设计
- **3D渲染**: Three.js 立体时间轴
- **状态管理**: Zustand 轻量级状态管理
- **组件库**: Shadcn/ui 现代组件

### 项目结构
```
smart-calendar-v2/
├── 📁 src/app/              # Next.js App Router
├── 📁 components/           # React组件库
│   ├── 📁 calendar/        # 日历相关组件
│   ├── 📁 help/            # 用户指南组件
│   ├── 📁 timeflow/        # 3D时间流组件
│   ├── 📁 voice/           # 语音输入组件
│   ├── 📁 trading/         # Trading功能组件
│   └── 📁 ...              # 其他功能模块
├── 📁 lib/                 # 核心逻辑库
│   ├── 📁 stores/          # 状态管理
│   ├── 📁 services/        # 业务服务
│   └── 📁 engines/         # 分析引擎
├── 📁 types/               # TypeScript类型定义
└── 📁 public/              # 静态资源
```

## 📊 功能演示

### 预置演示数据
系统包含11个完整演示事件：
- 🔴 **Trading任务** (4个): 扫watchlist、key in数据、捕兽夹、TABATA锻炼
- 🟡 **语音创建示例** (2个): 复杂会议安排、自动准备任务
- 🟢 **生活例程** (2个): 晨间例程、晚餐时间
- 🔵 **系统功能演示** (3个): 当前进行任务、冲突检测示例

### 核心亮点展示
1. **3D时间流体验** - 拖拽查看不同角度的时间安排
2. **智能语音解析** - 复杂中文时间表达理解
3. **Trading专业支持** - 完整交易员工作流
4. **冲突智能检测** - 实时标记重叠事件
5. **用户友好指导** - 完整的学习和提示系统

## 🛠️ 开发指南

### 开发环境搭建
```bash
# 安装依赖
npm install

# 启动开发服务器 (带热重载)
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 技术要求
- **Node.js**: 18.0+
- **TypeScript**: 5.0+
- **React**: 19.0+
- **Three.js**: 基础3D概念理解

### 代码规范
- ✅ TypeScript strict模式
- ✅ ESLint + Prettier
- ✅ 组件优先设计
- ✅ 响应式设计优先
- ✅ Accessibility支持

## 🎯 开发路线图

### v2.1 (计划中)
- 📦 **数据持久化** - IndexedDB本地存储
- 🔔 **高级提醒** - 浏览器通知集成
- 📱 **PWA支持** - 离线功能
- 📊 **分析报告** - 时间使用统计

### v2.5 (规划中)
- 👥 **协作功能** - 团队日历共享
- 🤖 **AI助手** - 智能日程建议
- 🌐 **云同步** - 跨设备数据同步
- 📈 **高级分析** - 效率评估报告

### v3.0 (愿景)
- 🏢 **企业级** - 多租户支持
- 🔌 **API开放** - 第三方集成
- 🌍 **国际化** - 多语言支持
- 🧠 **机器学习** - 个性化推荐

## 📸 功能截图

### 主界面
- 🖥️ 双视图系统 (日历 + 3D时间流)
- 📊 实时数据分析面板
- 🎛️ 智能控制组件

### 3D时间流
- 🌊 立体时间轴可视化
- 🎨 色彩分类事件系统
- ⚡ 流畅交互体验

### 用户指南
- 📚 6步互动式教程
- 💡 智能浮动提示
- 🎯 上下文感知帮助

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 贡献流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

### 问题反馈
- 🐛 Bug报告: [Issues](https://github.com/[username]/smart-calendar-v2/issues)
- 💡 功能建议: [Discussions](https://github.com/[username]/smart-calendar-v2/discussions)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- **项目主页**: [GitHub Repository](https://github.com/[username]/smart-calendar-v2)
- **在线演示**: [Demo Link](https://smart-calendar-v2.vercel.app)
- **文档地址**: [Wiki](https://github.com/[username]/smart-calendar-v2/wiki)

---

## 🌟 Star History

如果这个项目对您有帮助，请给我们一个⭐！

[![Star History Chart](https://api.star-history.com/svg?repos=[username]/smart-calendar-v2&type=Date)](https://star-history.com/#[username]/smart-calendar-v2&Date)

---

**© 2025 秉笔太监智能秘书系统 - 让时间管理更智能** 🚀

> 这不仅是一个日历应用，更是一个理解中文、支持专业工作流、具备智能冲突检测的全能个人秘书系统！
