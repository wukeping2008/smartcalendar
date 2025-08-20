# 浮动面板系统 - 使用说明

## 概述

浮动面板系统是智能日历v4.0的核心UI创新，提供了更优雅的侧边栏交互体验。系统包含右侧图标工具条和可拖动的浮动面板，支持智能优先级显示和键盘快捷键操作。

## 核心功能

### 1. 图标工具条 (IconToolbar)
- 固定在屏幕右侧，宽度60px
- 根据时间智能高亮最可能用到的功能
- 8个主要功能面板：AI助手、日历、市场状态、时间流、语音输入、收件箱、时间预算、关系管理
- 支持键盘快捷键 Alt+1-8 快速打开对应面板
- ESC键关闭所有面板

### 2. 浮动面板 (FloatingPanel)
- 完全可拖动和调整大小
- 支持钉住、最小化功能
- 智能层级管理和焦点切换
- 边界约束和碰撞检测
- 优雅的动画过渡效果

### 3. 智能优先级系统
- 基于当前时间自动调整面板优先级
- 根据用户使用习惯动态学习
- 上下文感知优先级调整
- 视觉优先级指示器

## 集成方式

### 在现有页面中使用

```tsx
import { FloatingPanelSystem } from '@/components/layout/FloatingPanelSystem';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* 你的现有内容 */}
      <main>...</main>
      
      {/* 添加浮动面板系统 */}
      <FloatingPanelSystem />
    </div>
  );
}
```

### 替换现有侧边栏

如果你想用浮动面板系统替换现有的固定侧边栏：

```tsx
// 之前的实现
<div className="w-96 bg-black/20 backdrop-blur-sm border-l border-white/10 p-6">
  {/* 侧边栏内容 */}
</div>

// 新的实现 - 完全移除侧边栏，使用浮动面板
<FloatingPanelSystem />
```

## 时间段智能优先级

系统会根据当前时间自动调整面板优先级：

- **上午 (9:00-12:00)**: 日历 > AI助手 > 收件箱 > 时间预算
- **下午 (12:00-18:00)**: 市场状态 > 时间流 > AI助手 > 关系管理
- **晚上 (18:00-22:00)**: 时间预算 > 日历 > AI助手 > 语音输入
- **夜间 (22:00-9:00)**: 语音输入 > 收件箱 > AI助手 > 时间流

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Alt+1 | AI智能助手 |
| Alt+2 | 智能日历 |
| Alt+3 | 市场监控 |
| Alt+4 | 3D时间流 |
| Alt+5 | 语音助手 |
| Alt+6 | 智能收件箱 |
| Alt+7 | 时间预算 |
| Alt+8 | 关系管理 |
| ESC | 关闭所有面板 |

## 面板内容自定义

每个面板都可以自定义内容：

```tsx
// 在 FloatingPanelSystem.tsx 中修改面板组件映射
const SIMPLE_PANEL_COMPONENTS: Record<PanelType, React.ComponentType<any>> = {
  [PanelType.AI_ASSISTANT]: YourCustomAIComponent,  // 使用你的组件
  [PanelType.CALENDAR]: YourCustomCalendarComponent,
  // ...
};
```

## 状态管理

浮动面板系统使用 `useFloatingPanels` Hook 进行状态管理：

```tsx
const {
  openPanel,      // 打开面板
  closePanel,     // 关闭面板
  togglePanel,    // 切换面板状态
  minimizePanel,  // 最小化面板
  pinPanel,       // 钉住面板
  // ...
} = useFloatingPanels();
```

## 性能优化

- 面板内容懒加载
- 智能垃圾回收（非钉住面板30分钟后自动清理）
- 渲染优化（只渲染可见面板）
- 事件处理防抖

## 兼容性

- 支持现代浏览器
- 响应式设计（移动端友好）
- 触摸设备支持
- 键盘导航支持

## 架构文件

- `types/floating-panel.ts` - 类型定义
- `lib/utils/smartPriority.ts` - 智能优先级逻辑  
- `lib/hooks/useFloatingPanels.ts` - 面板状态管理
- `components/layout/FloatingPanel.tsx` - 单个面板组件
- `components/layout/IconToolbar.tsx` - 图标工具条
- `components/layout/FloatingPanelSystem.tsx` - 系统容器

## 下一步优化

1. 添加面板位置记忆功能
2. 实现面板组合和标签页
3. 支持自定义工具条位置
4. 添加面板动画效果配置
5. 实现面板快照和恢复