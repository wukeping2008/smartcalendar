'use client';

import React, { useMemo } from 'react';
import { FloatingPanel } from './FloatingPanel';
import { IconToolbar, PANEL_CONFIGS } from './IconToolbar';
import { useFloatingPanels } from '../../lib/hooks/useFloatingPanels';
import { PanelType, PanelState } from '../../types/floating-panel';

// 导入各个面板组件
import AIAssistant from '../ai/AIAssistant';
import CalendarContainer from '../calendar/CalendarContainer';
import MarketStatusBar from '../market/MarketStatusBar';
import EnhancedFlowCanvas from '../timeflow/FlowCanvas';
import VoiceInputButton from '../voice/VoiceInputButton';
import InboxPanel from '../inbox/InboxPanel';
import TimeBudgetDashboard from '../timebudget/TimeBudgetDashboard';
import RelationshipManager from '../relationship/RelationshipManager';
import DailyBriefingPanel from '../briefing/DailyBriefingPanel';

interface FloatingPanelSystemProps {
  className?: string;
  selectedEvent?: any;
  onTaskSchedule?: (task: any) => void;
}

// 面板内容映射
const PANEL_COMPONENTS: Record<PanelType, React.ComponentType<any>> = {
  [PanelType.AI_ASSISTANT]: AIAssistant,
  [PanelType.CALENDAR]: CalendarContainer,
  [PanelType.MARKET_STATUS]: MarketStatusBar,
  [PanelType.TIME_FLOW]: EnhancedFlowCanvas,
  [PanelType.VOICE_INPUT]: VoiceInputButton,
  [PanelType.INBOX]: InboxPanel,
  [PanelType.TIME_BUDGET]: TimeBudgetDashboard,
  [PanelType.RELATIONSHIPS]: RelationshipManager,
  [PanelType.DAILY_BRIEFING]: DailyBriefingPanel
};

// 简化的面板内容组件，用于演示
function SimpleAIPanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">AI智能助手</div>
      <div className="space-y-2">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">今日建议</div>
          <div className="text-sm text-blue-600 mt-1">
            根据您的日程安排，建议在10:30-11:30处理重要邮件
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-sm font-medium text-green-800">效率提醒</div>
          <div className="text-sm text-green-600 mt-1">
            当前是您的高效时段，适合进行深度工作
          </div>
        </div>
      </div>
      <div className="border-t pt-4">
        <textarea
          placeholder="向AI助手提问..."
          className="w-full h-20 p-2 border rounded-lg resize-none text-sm"
        />
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
          发送
        </button>
      </div>
    </div>
  );
}

function SimpleCalendarPanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">智能日历</div>
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center font-medium text-gray-600 p-2">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className="aspect-square p-1 hover:bg-gray-100 rounded cursor-pointer">
            <div className="w-full h-full flex items-center justify-center text-sm">
              {i - 6 > 0 && i - 6 <= 31 ? i - 6 : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t pt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">今日事件</div>
        <div className="space-y-2">
          <div className="p-2 bg-blue-50 rounded text-sm">
            <div className="font-medium">团队会议</div>
            <div className="text-gray-600">09:00 - 10:00</div>
          </div>
          <div className="p-2 bg-green-50 rounded text-sm">
            <div className="font-medium">项目评审</div>
            <div className="text-gray-600">14:00 - 15:30</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleMarketPanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">市场监控</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600">上证指数</div>
          <div className="text-lg font-bold text-green-600">3,245.67</div>
          <div className="text-xs text-green-500">+1.23%</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-sm text-gray-600">深证成指</div>
          <div className="text-lg font-bold text-red-600">10,856.42</div>
          <div className="text-xs text-red-500">-0.87%</div>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">BTC/USD</div>
          <div className="text-lg font-bold text-blue-600">45,230</div>
          <div className="text-xs text-blue-500">+2.15%</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="text-sm text-gray-600">黄金</div>
          <div className="text-lg font-bold text-yellow-600">1,895.30</div>
          <div className="text-xs text-yellow-500">+0.45%</div>
        </div>
      </div>
      <div className="text-xs text-gray-500 text-center">
        数据更新时间: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

function SimpleTimeFlowPanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">3D时间流</div>
      <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🌊</div>
          <div className="text-sm text-gray-600">时间流可视化</div>
          <div className="text-xs text-gray-500 mt-1">3D渲染区域</div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">当前效率:</span>
          <span className="font-medium text-green-600">87%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">专注时长:</span>
          <span className="font-medium text-blue-600">2小时15分</span>
        </div>
      </div>
    </div>
  );
}

function SimpleVoicePanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">语音助手</div>
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <div className="text-white text-2xl">🎤</div>
        </div>
        <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          开始语音输入
        </button>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">语音转文字结果将显示在这里...</div>
      </div>
    </div>
  );
}

function SimpleInboxPanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">智能收件箱</div>
      <div className="space-y-2">
        <div className="p-3 border-l-4 border-red-500 bg-red-50">
          <div className="text-sm font-medium text-red-800">紧急任务</div>
          <div className="text-sm text-red-600">完成项目报告</div>
          <div className="text-xs text-red-500 mt-1">截止时间: 今天 18:00</div>
        </div>
        <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
          <div className="text-sm font-medium text-yellow-800">待办事项</div>
          <div className="text-sm text-yellow-600">回复客户邮件</div>
          <div className="text-xs text-yellow-500 mt-1">2小时前</div>
        </div>
        <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
          <div className="text-sm font-medium text-blue-800">提醒</div>
          <div className="text-sm text-blue-600">明日会议准备材料</div>
          <div className="text-xs text-blue-500 mt-1">明天 09:00</div>
        </div>
      </div>
      <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
        添加新任务
      </button>
    </div>
  );
}

function SimpleTimeBudgetPanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">时间预算</div>
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-800">深度工作</span>
            <span className="text-sm text-blue-600">4/6小时</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-green-800">会议沟通</span>
            <span className="text-sm text-green-600">1.5/2小时</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-yellow-800">学习提升</span>
            <span className="text-sm text-yellow-600">0/1小时</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleRelationshipPanel() {
  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold text-gray-800">关系管理</div>
      <div className="space-y-3">
        <div className="p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              张
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">张经理</div>
              <div className="text-xs text-gray-500">上次联系: 3天前</div>
            </div>
            <div className="text-xs text-orange-500">需要联系</div>
          </div>
        </div>
        <div className="p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
              李
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">李总监</div>
              <div className="text-xs text-gray-500">上次联系: 1天前</div>
            </div>
            <div className="text-xs text-green-500">联系良好</div>
          </div>
        </div>
        <div className="p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
              王
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">王同事</div>
              <div className="text-xs text-gray-500">上次联系: 今天</div>
            </div>
            <div className="text-xs text-blue-500">刚刚联系</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 简化的面板内容组件映射
const SIMPLE_PANEL_COMPONENTS: Record<PanelType, React.ComponentType<any>> = {
  [PanelType.AI_ASSISTANT]: SimpleAIPanel,
  [PanelType.CALENDAR]: SimpleCalendarPanel,
  [PanelType.MARKET_STATUS]: SimpleMarketPanel,
  [PanelType.TIME_FLOW]: SimpleTimeFlowPanel,
  [PanelType.VOICE_INPUT]: SimpleVoicePanel,
  [PanelType.INBOX]: SimpleInboxPanel,
  [PanelType.TIME_BUDGET]: SimpleTimeBudgetPanel,
  [PanelType.RELATIONSHIPS]: SimpleRelationshipPanel
};

export function FloatingPanelSystem({ 
  className = '', 
  selectedEvent,
  onTaskSchedule 
}: FloatingPanelSystemProps) {
  const {
    state,
    openPanel,
    closePanel,
    minimizePanel,
    maximizePanel,
    pinPanel,
    unpinPanel,
    movePanel,
    resizePanel,
    focusPanel,
    togglePanel,
    getSmartPriority
  } = useFloatingPanels();

  // 获取活跃面板ID列表
  const activePanelIds = useMemo(() => {
    return Array.from(state.panels.entries())
      .filter(([_, panel]) => panel.state === PanelState.OPEN && !panel.isMinimized)
      .map(([id, _]) => id);
  }, [state.panels]);

  // 获取按z-index排序的面板列表
  const sortedPanels = useMemo(() => {
    return Array.from(state.panels.values())
      .filter(panel => panel.state === PanelState.OPEN && !panel.isMinimized)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [state.panels]);

  return (
    <div className={`${className}`}>
      {/* 图标工具条 */}
      <IconToolbar
        activePanelIds={activePanelIds}
        onPanelClick={togglePanel}
        getSmartPriority={getSmartPriority}
      />

      {/* 浮动面板渲染 */}
      {sortedPanels.map(panel => {
        const config = PANEL_CONFIGS[panel.id];
        const PanelComponent = SIMPLE_PANEL_COMPONENTS[panel.id];
        const isActive = state.activePanelId === panel.id;

        return (
          <FloatingPanel
            key={panel.id}
            panel={panel}
            title={config.title}
            isActive={isActive}
            onClose={() => closePanel(panel.id)}
            onMinimize={() => minimizePanel(panel.id)}
            onMaximize={() => maximizePanel(panel.id)}
            onPin={() => pinPanel(panel.id)}
            onUnpin={() => unpinPanel(panel.id)}
            onMove={(position) => movePanel(panel.id, position)}
            onResize={(size) => resizePanel(panel.id, size)}
            onFocus={() => focusPanel(panel.id)}
          >
            <PanelComponent 
              selectedEvent={selectedEvent}
              onTaskSchedule={onTaskSchedule}
            />
          </FloatingPanel>
        );
      })}

      {/* 最小化面板状态栏（可选） */}
      {Array.from(state.panels.values()).some(panel => panel.isMinimized) && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">最小化:</span>
              {Array.from(state.panels.values())
                .filter(panel => panel.isMinimized)
                .map(panel => {
                  const config = PANEL_CONFIGS[panel.id];
                  return (
                    <button
                      key={panel.id}
                      onClick={() => maximizePanel(panel.id)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      title={`恢复 ${config.title}`}
                    >
                      {config.title}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FloatingPanelSystem;