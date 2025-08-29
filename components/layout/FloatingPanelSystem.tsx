'use client';

import React, { useMemo, useEffect } from 'react';
import { FloatingPanel } from './FloatingPanel';
import { IconToolbar, PANEL_CONFIGS } from './IconToolbar';
import { useFloatingPanels } from '../../lib/hooks/useFloatingPanels';
import { PanelType, PanelState } from '../../types/floating-panel';
import { useVoiceCommandStore } from '../../lib/stores/voice-command-store';

// 导入各个面板组件
import AIAssistant from '../ai/AIAssistant';
import CalendarContainer from '../calendar/CalendarContainer';
import MarketStatusBar from '../market/MarketStatusBar';
import EnhancedFlowCanvas from '../timeflow/FlowCanvas';
import VoiceInputButton from '../voice/VoiceInputButton';
import InboxPanel from '../inbox/InboxPanel';
import TimeBudgetDashboard from '../timebudget/TimeBudgetDashboard';
// import RelationshipManager from '../relationship/RelationshipManager' // 已合并到PersonCardPanel;
import DailyBriefingPanel from '../briefing/DailyBriefingPanel';
import WhatIfSimulatorPanel from '../whatif/WhatIfSimulatorPanel';
import PersonCardPanel from '../personcard/PersonCardPanel';
import CommutePlannerPanel from '../commute/CommutePlannerPanel';
import { TaskInbox } from '../gtd/TaskInbox';
import TradingFocusPanel from '../trading/TradingFocusPanel';
import CognitiveManagementPanel from '../cognitive/CognitiveManagementPanel';

interface FloatingPanelSystemProps {
  className?: string;
  selectedEvent?: any;
  onTaskSchedule?: (task: any) => void;
}

// 面板内容映射
const PANEL_COMPONENTS: Record<PanelType, React.ComponentType<any>> = {
  [PanelType.AI_ASSISTANT]: AIAssistant,
  // [PanelType.CALENDAR]: CalendarContainer,
  [PanelType.MARKET_STATUS]: MarketStatusBar,
  // [PanelType.TIME_FLOW]: EnhancedFlowCanvas,
  [PanelType.VOICE_INPUT]: VoiceInputButton,
  // [PanelType.INBOX]: InboxPanel, // Merged into GTD_INBOX
  [PanelType.TIME_BUDGET]: TimeBudgetDashboard,
  // [PanelType.RELATIONSHIPS]: RelationshipManager, // 已合并到PersonCardPanel
  [PanelType.DAILY_BRIEFING]: DailyBriefingPanel,
  [PanelType.WHAT_IF]: WhatIfSimulatorPanel,
  [PanelType.PERSON_CARD]: PersonCardPanel,
  [PanelType.COMMUTE_PLANNER]: CommutePlannerPanel,
  [PanelType.GTD_INBOX]: TaskInbox,
  [PanelType.TRADING_FOCUS]: TradingFocusPanel,
  [PanelType.COGNITIVE_MANAGEMENT]: CognitiveManagementPanel
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

  const { command, clearCommand } = useVoiceCommandStore();

  useEffect(() => {
    if (command) {
      if (command.intent === 'open_panel' && command.panelType) {
        openPanel(command.panelType);
      } else if (command.intent === 'close_panel' && command.panelType) {
        closePanel(command.panelType);
      }
      // Reset the command after processing
      clearCommand();
    }
  }, [command, openPanel, closePanel, clearCommand]);

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
        const PanelComponent = PANEL_COMPONENTS[panel.id];
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
