# 智能Calendar v2.1 - 更新版开发计划

## 项目状态概览

### ✅ 已完成功能
- Next.js 15.4 + React 19 + TypeScript 基础架构
- AI服务集成（Claude/OpenAI API）
- 时间分析引擎（TimeAnalyzer）
- 实时市场数据服务（模拟）
- AI决策引擎框架
- 基础UI组件和布局

### 🎯 客户需求调整
- **优先**: 传统日历视图（日/周/月）
- **降低**: 3D时间河流可视化
- **重点**: 实用性和易用性

## 📋 调整后的开发优先级

### 第一阶段：核心日历功能（1-2周）

#### 1. **传统日历视图** 🔴 最高优先级
- **日视图**
  - 24小时时间轴
  - 拖拽调整事件
  - 实时冲突检测
  - 快速添加功能
  
- **周视图**
  - 7天并列显示
  - 工作时间高亮
  - 交易时段标记
  - 跨天事件支持
  
- **月视图**
  - 传统月历布局
  - 事件密度热力图
  - 快速导航
  - 迷你事件预览

#### 2. **精确工时预算系统** 🔴 最高优先级
- 升级 WorkHoursBudget.tsx
- 16小时精确预算计算
- 固定扣除项管理
  - 交易时段（周一至五 6PM-11PM）
  - 每日捕兽夹（1小时）
  - 固定会议
  - 个人时间
- 实时可用时间显示
- 周/月统计报表

#### 3. **智能周计划生成器** 🔴 最高优先级
- 创建 WeeklyPlanGenerator 组件
- 集成多个数据源
  - 季度目标拆解
  - 上周未完成任务
  - SOP例行任务
  - 收集箱新任务
- 智能排程算法
- 冲突自动解决
- 一键应用计划

### 第二阶段：AI增强功能（2-3周）

#### 4. **AI助手界面增强** 🟡 中优先级
- 优化 AIAssistant 组件
- 自然语言快速输入
- 智能命令解析
- 任务分解可视化
- 实时建议面板

#### 5. **多维SOP系统** 🟡 中优先级
- 扩展 TradingTaskTemplates
- 实现多维度管理
  - 日常例行
  - 周例行
  - 月度任务
  - 季度/年度
- 自动任务生成
- 灵活调整机制

#### 6. **情境感知提醒系统** 🟡 中优先级
- 智能提醒引擎
- 多维度触发
  - 时间触发
  - 位置触发
  - 状态触发
  - 关联触发
- 个性化提醒文案
- 免打扰时段管理

### 第三阶段：高级功能（3-4周）

#### 7. **What-If模拟器** 🟢 低优先级
- 基于现有 ScheduleOptimizer
- 场景影响分析
- 调整建议生成
- 简单可视化预览

#### 8. **3D时间河流** 🟢 低优先级
- 作为可选视图
- 基础流动效果
- 事件可视化
- 性能优化

## 🛠️ 技术决策记录

### 1. 数据持久化方案
**需要决策的问题：**
- 使用本地存储（localStorage/IndexedDB）还是后端数据库？
- 是否需要用户账号系统？
- 如何处理数据同步和冲突？

**方案对比：**
```
A. 纯前端方案（推荐初期使用）
   - localStorage 存储用户偏好设置
   - IndexedDB 存储事件数据
   - 优点：无需后端，快速开发，离线可用
   - 缺点：无法跨设备同步，数据可能丢失

B. 后端API方案
   - PostgreSQL + Prisma ORM
   - RESTful API 或 tRPC
   - 优点：数据安全，可跨设备，支持协作
   - 缺点：需要部署维护，增加复杂度

C. 混合方案
   - 本地优先，可选云同步
   - 使用 Supabase 或 Firebase
   - 优点：渐进式增强，灵活性高
   - 缺点：同步逻辑复杂
```

### 2. 状态管理策略
**需要决策的问题：**
- 使用 Zustand、Redux 还是 Context API？
- 如何组织全局状态结构？
- 是否需要状态持久化？

**推荐方案：**
```typescript
// 使用 Zustand + 持久化中间件
interface CalendarStore {
  // 事件数据
  events: Event[]
  // 用户设置
  preferences: UserPreferences
  // AI状态
  aiSuggestions: Suggestion[]
  // 市场数据
  marketData: MarketOverview
  
  // Actions
  addEvent: (event: Event) => void
  updateEvent: (id: string, event: Partial<Event>) => void
  deleteEvent: (id: string) => void
  // ...
}
```

### 3. AI功能实现策略
**需要决策的问题：**
- API调用频率限制如何处理？
- 是否需要本地AI模型作为降级方案？
- 如何优化API成本？

**建议方案：**
```
1. 请求缓存
   - 相似查询结果缓存
   - TTL 设置（如30分钟）
   
2. 批量处理
   - 合并多个小请求
   - 定时批量分析
   
3. 智能降级
   - API限流时使用本地规则
   - 优先级队列管理
   
4. 成本控制
   - 设置月度预算上限
   - 按功能重要性分配
```

### 4. 实时更新机制
**需要决策的问题：**
- 市场数据更新频率？
- 是否需要 WebSocket？
- 如何处理离线场景？

**方案选择：**
```
A. 轮询方案（推荐初期）
   - 市场数据：3-5秒轮询
   - 日历数据：30秒轮询
   - 简单可靠，易于实现

B. WebSocket方案
   - 实时推送更新
   - 适合高频交易场景
   - 需要处理重连逻辑

C. Server-Sent Events
   - 单向推送
   - 自动重连
   - 中间方案
```

### 5. 性能优化策略
**关键考虑：**
- 大量事件渲染性能
- AI调用响应延迟
- 首屏加载时间

**优化方案：**
```
1. 虚拟滚动
   - 日/周视图虚拟化
   - 仅渲染可见区域
   
2. 懒加载
   - 路由级代码分割
   - AI功能按需加载
   
3. 缓存策略
   - SWR 数据缓存
   - 计算结果缓存
   
4. Web Worker
   - AI计算后台处理
   - 大数据分析任务
```

## 🚀 立即开始的开发任务

### 本周目标（第1周）
1. **实现日视图组件**
   - 基础24小时布局
   - 事件渲染和交互
   - 拖拽功能
   
2. **实现周视图组件**
   - 7天网格布局
   - 跨天事件支持
   - 当前时间指示器

3. **完善工时预算系统**
   - 固定扣除项配置
   - 实时计算显示
   - 可视化展示

### 开发环境准备
```bash
# 1. 安装依赖
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install date-fns dayjs
npm install react-beautiful-dnd
npm install recharts

# 2. 创建必要的目录结构
mkdir -p components/calendar/{DayView,WeekView,MonthView}
mkdir -p components/planning
mkdir -p components/budget
mkdir -p hooks
mkdir -p utils/calendar

# 3. 启动开发服务器
npm run dev
```

### 测试要点
- 确保所有组件可以本地运行
- 模拟数据要充分测试各种场景
- AI功能提供 mock 模式
- 响应式设计适配不同屏幕

## 📝 后续讨论事项
1. 确定数据持久化最终方案
2. API密钥管理和安全策略
3. 部署方案（Vercel/自建服务器）
4. 用户反馈收集机制
5. 版本更新策略