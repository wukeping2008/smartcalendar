'use client';

import React, { useMemo } from 'react';
import {
  Bot,
  Calendar,
  TrendingUp,
  Waves,
  Mic,
  Inbox,
  Clock,
  Users,
  HelpCircle
} from 'lucide-react';
import {
  PanelType,
  PanelConfig,
  PanelPriority,
  IconToolbarConfig
} from '../../types/floating-panel';
import { getPriorityStyles } from '../../lib/utils/smartPriority';

// 默认工具条配置
const DEFAULT_TOOLBAR_CONFIG: IconToolbarConfig = {
  width: 60,
  iconSize: 24,
  spacing: 12,
  position: 'right',
  showLabels: true,
  showShortcuts: true,
  highlightActive: true
};

// 面板配置
const PANEL_CONFIGS: Record<PanelType, Omit<PanelConfig, 'component'>> = {
  [PanelType.AI_ASSISTANT]: {
    id: PanelType.AI_ASSISTANT,
    title: 'AI助手',
    icon: Bot,
    shortcut: 'Alt+1',
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 350, height: 400 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.HIGH,
    description: 'AI智能助手，提供决策建议和对话支持'
  },
  [PanelType.CALENDAR]: {
    id: PanelType.CALENDAR,
    title: '日历视图',
    icon: Calendar,
    shortcut: 'Alt+2',
    defaultSize: { width: 450, height: 500 },
    minSize: { width: 400, height: 350 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.MEDIUM,
    description: '智能日历管理和事件规划'
  },
  [PanelType.MARKET_STATUS]: {
    id: PanelType.MARKET_STATUS,
    title: '市场状态',
    icon: TrendingUp,
    shortcut: 'Alt+3',
    defaultSize: { width: 380, height: 450 },
    minSize: { width: 320, height: 300 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.MEDIUM,
    description: '实时市场数据和交易信息监控'
  },
  [PanelType.TIME_FLOW]: {
    id: PanelType.TIME_FLOW,
    title: '时间流',
    icon: Waves,
    shortcut: 'Alt+4',
    defaultSize: { width: 500, height: 600 },
    minSize: { width: 400, height: 400 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.LOW,
    description: '3D时间流可视化和时间管理'
  },
  [PanelType.VOICE_INPUT]: {
    id: PanelType.VOICE_INPUT,
    title: '语音输入',
    icon: Mic,
    shortcut: 'Alt+5',
    defaultSize: { width: 350, height: 300 },
    minSize: { width: 300, height: 200 },
    resizable: true,
    draggable: true,
    canPin: false,
    canMinimize: true,
    priority: PanelPriority.LOW,
    description: '语音识别和语音命令输入'
  },
  [PanelType.INBOX]: {
    id: PanelType.INBOX,
    title: '收件箱',
    icon: Inbox,
    shortcut: 'Alt+6',
    defaultSize: { width: 400, height: 500 },
    minSize: { width: 350, height: 300 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.MEDIUM,
    description: '智能收件箱和待办事项管理'
  },
  [PanelType.TIME_BUDGET]: {
    id: PanelType.TIME_BUDGET,
    title: '时间预算',
    icon: Clock,
    shortcut: 'Alt+7',
    defaultSize: { width: 420, height: 480 },
    minSize: { width: 380, height: 350 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.LOW,
    description: '时间预算管理和效率分析'
  },
  [PanelType.RELATIONSHIPS]: {
    id: PanelType.RELATIONSHIPS,
    title: '关系管理',
    icon: Users,
    shortcut: 'Alt+8',
    defaultSize: { width: 450, height: 550 },
    minSize: { width: 400, height: 400 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.LOW,
    description: '人际关系和社交网络管理'
  }
};

interface IconToolbarProps {
  activePanelIds: PanelType[];
  onPanelClick: (panelId: PanelType) => void;
  getSmartPriority: (panelId: PanelType) => PanelPriority;
  config?: Partial<IconToolbarConfig>;
  className?: string;
}

interface ToolbarIconProps {
  config: Omit<PanelConfig, 'component'>;
  isActive: boolean;
  priority: PanelPriority;
  onClick: () => void;
  showLabel?: boolean;
  showShortcut?: boolean;
  iconSize?: number;
}

function ToolbarIcon({
  config,
  isActive,
  priority,
  onClick,
  showLabel = true,
  showShortcut = true,
  iconSize = 24
}: ToolbarIconProps) {
  const IconComponent = config.icon;
  const priorityStyles = getPriorityStyles(priority);

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`
          relative flex items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
          ${isActive 
            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-md scale-105' 
            : `${priorityStyles.iconClassName} hover:scale-105 hover:shadow-md`
          }
          ${priorityStyles.glowEffect && !isActive ? 'opacity-90' : ''}
        `}
        title={`${config.description} (${config.shortcut})`}
        style={{
          width: iconSize + 24,
          height: iconSize + 24
        }}
      >
        <IconComponent 
          size={iconSize} 
          className="transition-transform hover:scale-110"
        />
        
        {/* 优先级指示器 */}
        {priority > PanelPriority.LOW && !isActive && (
          <div 
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${priorityStyles.badgeClassName} text-xs flex items-center justify-center`}
            style={{ fontSize: '10px' }}
          >
            {priority}
          </div>
        )}

        {/* 活跃状态指示器 */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
        )}
      </button>

      {/* 悬浮提示 */}
      <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-safe pointer-events-none z-50">
        <div className="bg-gray-800 text-gray-100 px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg border border-gray-700">
          <div className="font-medium">{config.title}</div>
          {showLabel && (
            <div className="text-gray-300 text-xs mt-1">{config.description}</div>
          )}
          {showShortcut && (
            <div className="text-gray-400 text-xs mt-1">
              快捷键: <span className="font-mono">{config.shortcut}</span>
            </div>
          )}
          <div className="absolute left-full top-1/2 transform -translate-y-1/2">
            <div className="w-0 h-0 border-l-4 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function IconToolbar({
  activePanelIds,
  onPanelClick,
  getSmartPriority,
  config: userConfig,
  className = ''
}: IconToolbarProps) {
  const config = { ...DEFAULT_TOOLBAR_CONFIG, ...userConfig };

  // 按优先级排序面板
  const sortedPanelTypes = useMemo(() => {
    return Object.keys(PANEL_CONFIGS).sort((a, b) => {
      const priorityA = getSmartPriority(a as PanelType);
      const priorityB = getSmartPriority(b as PanelType);
      return priorityB - priorityA; // 高优先级在前
    }) as PanelType[];
  }, [getSmartPriority]);

  return (
    <div
      className={`fixed top-1/2 transform -translate-y-1/2 z-30 ${
        config.position === 'right' ? 'right-4' : 'left-4'
      } ${className}`}
      style={{ width: config.width }}
    >
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-2">
        <div className="flex flex-col gap-2">
          {/* 工具条标题 */}
          <div className="px-2 py-1 text-center">
            <h3 className="text-xs font-semibold text-gray-200">工具面板</h3>
            <div className="text-xs text-gray-400 mt-1">
              {activePanelIds.length > 0 ? `${activePanelIds.length} 个已打开` : '点击打开'}
            </div>
          </div>

          <div className="w-full h-px bg-gray-700" />

          {/* 面板图标列表 */}
          <div className="space-y-2">
            {sortedPanelTypes.map(panelType => {
              const panelConfig = PANEL_CONFIGS[panelType];
              const isActive = activePanelIds.includes(panelType);
              const priority = getSmartPriority(panelType);

              return (
                <ToolbarIcon
                  key={panelType}
                  config={panelConfig}
                  isActive={isActive}
                  priority={priority}
                  onClick={() => onPanelClick(panelType)}
                  showLabel={config.showLabels}
                  showShortcut={config.showShortcuts}
                  iconSize={config.iconSize}
                />
              );
            })}
          </div>

          <div className="w-full h-px bg-gray-700" />

          {/* 帮助按钮 */}
          <div className="px-2">
            <button
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors text-xs"
              title="查看帮助 (F1)"
            >
              <HelpCircle size={16} className="mr-1" />
              帮助
            </button>
          </div>
        </div>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-4 text-center">
        <div className="inline-block bg-gray-800 text-gray-200 px-2 py-1 rounded text-xs opacity-90">
          <div>Alt + 1-8: 快速打开</div>
          <div className="mt-1">ESC: 关闭所有</div>
        </div>
      </div>
    </div>
  );
}

export { PANEL_CONFIGS };
export default IconToolbar;