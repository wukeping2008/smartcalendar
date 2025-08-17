# CLAUDE.md - 智能日历项目记忆文件

## 🎯 项目概览
- **项目名称**: 智能日历系统 v4.0
- **项目类型**: Web应用 - AI驱动的时间管理平台
- **目标用户**: 量化交易者、专业人士
- **核心价值**: AI智能决策 + 实时市场感知 + 3D可视化

## 🛠️ 技术栈
- **框架**: Next.js 15.4.3 + React 19.1.0
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4 + Radix UI
- **状态管理**: Zustand 5.0.6
- **3D渲染**: Three.js + React Three Fiber
- **AI服务**: Claude API + OpenAI + Azure Speech
- **实时数据**: WebSocket + REST API

## 📁 关键路径
```
D:\Documents\smartcalendar\
├── src/app/page.tsx          # 主页面入口
├── components/               # UI组件
│   ├── ai/                  # AI相关组件
│   ├── calendar/            # 日历组件
│   ├── timeflow/           # 3D时间流
│   └── relationship/       # 关系管理
├── lib/                     # 核心逻辑
│   ├── services/           # 服务层
│   ├── stores/            # 状态管理
│   └── engines/           # AI引擎
└── types/                  # TypeScript类型定义
```

## 🚀 开发命令
```bash
# 基础命令
npm run dev          # 启动开发服务器 (端口3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查

# 调试命令
npm ls --depth=0     # 检查依赖
npm run typecheck    # TypeScript类型检查 (如果配置)

# 清理命令
rm -rf .next node_modules  # 清理缓存
npm install               # 重新安装依赖
```

## 🔑 环境变量
需要在 `.env.local` 中配置：
```env
# AI服务密钥
ANTHROPIC_API_KEY=sk-xxx
OPENAI_API_KEY=sk-xxx
AZURE_SPEECH_KEY=xxx
AZURE_SPEECH_REGION=xxx

# 市场数据API
MARKET_DATA_API_KEY=xxx
```

## 💡 项目特定约定

### 命名规范
- **组件**: PascalCase (如 `CalendarView.tsx`)
- **服务**: PascalCase + Service (如 `AIService.ts`)
- **工具函数**: camelCase (如 `formatDate.ts`)
- **常量**: UPPER_SNAKE_CASE (如 `MAX_EVENTS`)
- **类型**: PascalCase + 语义后缀 (如 `EventType`, `EventProps`)

### 文件组织
- 组件按功能域分组 (ai/, calendar/, voice/ 等)
- 服务统一放在 lib/services/
- 类型定义放在 types/
- 共享组件放在 components/ui/

### 代码风格
- 使用函数组件和Hooks
- 优先使用 TypeScript
- 避免使用 any 类型
- 组件保持单一职责

## 🐛 常见问题和解决方案

### 1. 端口冲突
**问题**: 3000端口被占用
**解决**: 
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 或修改端口
npm run dev -- -p 3001
```

### 2. AI服务连接失败
**问题**: AI API调用超时或失败
**解决**: 
- 检查 .env.local 中的API密钥
- 确认网络连接正常
- 查看 lib/services/AIService.ts 中的错误处理

### 3. 市场数据不更新
**问题**: 实时市场数据停止更新
**解决**:
- 检查 WebSocket 连接状态
- 查看 RealTimeMarketService.ts 的重连逻辑
- 确认市场API密钥有效

### 4. 3D渲染性能问题
**问题**: 时间流3D视图卡顿
**解决**:
- 减少渲染的事件数量
- 调整 Three.js 渲染设置
- 使用 Chrome 开发工具性能分析

## 📊 核心功能模块

### AI决策引擎
- **位置**: lib/engines/AIDecisionEngine.ts
- **功能**: 4维度智能决策 (Market/Productivity/Energy/AI)
- **关键方法**: `generateRecommendations()`, `analyzeContext()`

### 实时市场服务
- **位置**: lib/services/RealTimeMarketService.ts
- **功能**: WebSocket实时数据, 10种资产价格
- **更新频率**: 3秒

### 日程优化器
- **位置**: lib/engines/ScheduleOptimizer.ts
- **功能**: 冲突检测, 自动调整, 效率优化

### 语音交互
- **位置**: lib/services/AzureSpeechService.ts
- **功能**: 中文语音识别, 语音合成
- **依赖**: Azure Cognitive Services

## 🎨 UI组件架构

### 主要视图
1. **日历视图** (默认): 传统月历 + AI推荐
2. **3D时间流**: Three.js驱动的创新视图
3. **AI助手面板**: Claude对话 + 智能建议

### 核心组件
- `CalendarContainer`: 日历容器组件
- `FlowCanvas`: 3D时间流画布
- `AIAssistant`: AI助手界面
- `MarketStatusBar`: 市场状态栏
- `SmartEventCreator`: 智能事件创建器

## 📈 性能优化点
1. 使用 React.memo 优化重渲染
2. 虚拟化长列表 (如事件列表)
3. 懒加载 3D 组件
4. AI响应缓存机制
5. WebSocket断线重连

## 🔄 Git工作流
- **主分支**: main
- **功能分支**: feature/xxx
- **修复分支**: fix/xxx
- **提交规范**: feat:/fix:/docs:/style:/refactor:

## 📝 待优化事项
1. [ ] 添加 TypeScript 严格模式
2. [ ] 实现完整的单元测试
3. [ ] 优化bundle大小
4. [ ] 添加PWA支持
5. [ ] 实现数据导出功能

## 🚨 重要提醒
- 不要提交 .env.local 文件
- 保持 AI API 密钥安全
- 定期备份用户数据
- 测试市场数据连接稳定性
- 监控 AI 服务调用配额

---

最后更新: 2025-01-17
版本: v4.0