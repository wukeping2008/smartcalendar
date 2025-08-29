'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Bot,
  TrendingUp,
  Mic,
  Inbox,
  Clock,
  Users,
  HelpCircle,
  FileText,
  GitBranch,
  Train,
  Move,
  Zap,
  Brain,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  PanelType,
  PanelConfig,
  PanelPriority,
  IconToolbarConfig
} from '../../types/floating-panel';
import { getPriorityStyles } from '../../lib/utils/smartPriority';

// Redesigned Toolbar Config
const DEFAULT_TOOLBAR_CONFIG: IconToolbarConfig = {
  width: 200, // Increased width for single column layout
  iconSize: 18,
  spacing: 4,
  position: 'right',
  showLabels: true,
  showShortcuts: true,
  highlightActive: true
};

const TOOLBAR_POSITION_KEY = 'iconToolbar_position';
const TOOLBAR_COLLAPSED_KEY = 'iconToolbar_collapsed';
const EDGE_THRESHOLD = 30; // 靠边阈值（像素）
const HOVER_EXPAND_DELAY = 200; // 悬停展开延迟（毫秒）

interface ToolbarPosition {
  x: number;
  y: number;
  isDragged: boolean;
  isCollapsed?: boolean;
  dockedSide?: 'left' | 'right' | null;
}

function getDefaultPosition(): ToolbarPosition {
  if (typeof window === 'undefined') {
    return { x: 1200, y: 100, isDragged: false, isCollapsed: false, dockedSide: null };
  }
  return {
    x: window.innerWidth - DEFAULT_TOOLBAR_CONFIG.width - 20,
    y: 100,
    isDragged: false,
    isCollapsed: false,
    dockedSide: null
  };
}

function loadToolbarPosition(): ToolbarPosition {
    if (typeof window === 'undefined') return getDefaultPosition();
    try {
        const saved = localStorage.getItem(TOOLBAR_POSITION_KEY);
        const collapsed = localStorage.getItem(TOOLBAR_COLLAPSED_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as ToolbarPosition;
            const validX = Math.max(10, Math.min(parsed.x, window.innerWidth - DEFAULT_TOOLBAR_CONFIG.width - 10));
            // 确保Y坐标不会在导航栏区域（最小70px）
            const validY = Math.max(70, Math.min(parsed.y, window.innerHeight - 300));
            
            // 检查是否靠边
            let dockedSide: 'left' | 'right' | null = null;
            if (validX <= EDGE_THRESHOLD) {
                dockedSide = 'left';
            } else if (validX >= window.innerWidth - DEFAULT_TOOLBAR_CONFIG.width - EDGE_THRESHOLD) {
                dockedSide = 'right';
            }
            
            return { 
                ...parsed, 
                x: validX, 
                y: validY,
                isCollapsed: collapsed === 'true',
                dockedSide
            };
        }
    } catch (error) {
        // Failed to load toolbar position
    }
    return getDefaultPosition();
}

function saveToolbarPosition(position: ToolbarPosition): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(TOOLBAR_POSITION_KEY, JSON.stringify(position));
        localStorage.setItem(TOOLBAR_COLLAPSED_KEY, String(position.isCollapsed));
    } catch (error) {
        console.warn('Failed to save toolbar position:', error);
    }
}

export const PANEL_CONFIGS: Record<PanelType, Omit<PanelConfig, 'component'>> = {
  [PanelType.AI_ASSISTANT]: {
    id: PanelType.AI_ASSISTANT,
    title: 'AI助手',
    icon: Bot,
    shortcut: 'Alt+1',
    defaultSize: { width: 450, height: 700 },
    minSize: { width: 350, height: 400 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.HIGH,
    description: 'AI智能助手，提供决策建议和对话支持'
  },
  [PanelType.MARKET_STATUS]: {
    id: PanelType.MARKET_STATUS,
    title: '市场状态',
    icon: TrendingUp,
    shortcut: 'Alt+3',
    defaultSize: { width: 400, height: 500 },
    minSize: { width: 320, height: 300 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.MEDIUM,
    description: '实时市场数据和交易信息监控'
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
  [PanelType.TIME_BUDGET]: {
    id: PanelType.TIME_BUDGET,
    title: '时间预算',
    icon: Clock,
    shortcut: 'Alt+7',
    defaultSize: { width: 550, height: 750 },
    minSize: { width: 380, height: 350 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.LOW,
    description: '时间预算管理和效率分析'
  },
  [PanelType.DAILY_BRIEFING]: {
    id: PanelType.DAILY_BRIEFING,
    title: '今日简报',
    icon: FileText,
    shortcut: 'Alt+9',
    defaultSize: { width: 600, height: 800 },
    minSize: { width: 450, height: 400 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.HIGH,
    description: '每日智能简报和洞察分析'
  },
  [PanelType.WHAT_IF]: {
    id: PanelType.WHAT_IF,
    title: 'What-If模拟器',
    icon: GitBranch,
    shortcut: 'Alt+0',
    defaultSize: { width: 700, height: 800 },
    minSize: { width: 500, height: 500 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.MEDIUM,
    description: '决策模拟和影响分析工具'
  },
  [PanelType.PERSON_CARD]: {
    id: PanelType.PERSON_CARD,
    title: '人脉CRM',
    icon: Users,
    shortcut: 'Alt+8',
    defaultSize: { width: 600, height: 750 },
    minSize: { width: 450, height: 400 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.HIGH,
    description: '智能人脉管理·关系维护·礼物建议·执行秘书'
  },
  [PanelType.COMMUTE_PLANNER]: {
    id: PanelType.COMMUTE_PLANNER,
    title: '通勤规划',
    icon: Train,
    shortcut: 'Ctrl+T',
    defaultSize: { width: 480, height: 580 },
    minSize: { width: 420, height: 400 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.LOW,
    description: '通勤和碎片时间规划器'
  },
  [PanelType.GTD_INBOX]: {
    id: PanelType.GTD_INBOX,
    title: 'GTD收集箱',
    icon: Inbox,
    shortcut: 'Alt+G',
    defaultSize: { width: 600, height: 800 },
    minSize: { width: 450, height: 500 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.HIGH,
    description: 'GTD任务管理·智能分类·自动补全'
  },
  [PanelType.TRADING_FOCUS]: {
    id: PanelType.TRADING_FOCUS,
    title: 'Trading专注',
    icon: Zap,
    shortcut: 'Alt+T',
    defaultSize: { width: 700, height: 850 },
    minSize: { width: 500, height: 600 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.CRITICAL,
    description: '交易专注模式·1分钟决策·屏蔽干扰'
  },
  [PanelType.COGNITIVE_MANAGEMENT]: {
    id: PanelType.COGNITIVE_MANAGEMENT,
    title: '认知管理',
    icon: Brain,
    shortcut: 'Alt+C',
    defaultSize: { width: 650, height: 800 },
    minSize: { width: 500, height: 600 },
    resizable: true,
    draggable: true,
    canPin: true,
    canMinimize: true,
    priority: PanelPriority.HIGH,
    description: '认知带宽监控·智能拒绝·ROI决策'
  }
};

function useDraggable() {
  const [position, setPosition] = useState<ToolbarPosition>(() => loadToolbarPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 处理自动收起和展开
  useEffect(() => {
    if (position.dockedSide && !isDragging) {
      if (isHovering) {
        // 悬停时展开
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
          setPosition(prev => ({ ...prev, isCollapsed: false }));
          saveToolbarPosition({ ...position, isCollapsed: false });
        }, HOVER_EXPAND_DELAY);
      } else {
        // 离开时收起
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
          setPosition(prev => ({ ...prev, isCollapsed: true }));
          saveToolbarPosition({ ...position, isCollapsed: true });
        }, 500);
      }
    }
    
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovering, position.dockedSide, isDragging]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    let newX = e.clientX - dragStart.x;
    const newY = Math.max(70, Math.min(e.clientY - dragStart.y, window.innerHeight - 300));
    
    // 检查是否靠近边缘
    let dockedSide: 'left' | 'right' | null = null;
    if (newX <= EDGE_THRESHOLD) {
      newX = 0;
      dockedSide = 'left';
    } else if (newX >= window.innerWidth - DEFAULT_TOOLBAR_CONFIG.width - EDGE_THRESHOLD) {
      newX = window.innerWidth - DEFAULT_TOOLBAR_CONFIG.width;
      dockedSide = 'right';
    } else {
      newX = Math.max(10, Math.min(newX, window.innerWidth - DEFAULT_TOOLBAR_CONFIG.width - 10));
    }
    
    setPosition({ 
      x: newX, 
      y: newY, 
      isDragged: true,
      isCollapsed: false, // 拖动时展开
      dockedSide
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      saveToolbarPosition(position);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, position, dragStart]);

  return { 
    position, 
    isDragging, 
    handleMouseDown,
    isHovering,
    setIsHovering
  };
}

interface IconToolbarProps {
  activePanelIds: PanelType[];
  onPanelClick: (panelId: PanelType) => void;
  getSmartPriority: (panelId: PanelType) => PanelPriority;
  config?: Partial<IconToolbarConfig>;
  className?: string;
}

function ToolbarItem({ config, isActive, onClick, isCollapsed }: { 
  config: Omit<PanelConfig, 'component'>; 
  isActive: boolean; 
  onClick: () => void;
  isCollapsed: boolean;
}) {
  const IconComponent = config.icon;
  
  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md' 
            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
        }`}
        title={`${config.title} - ${config.description} (${config.shortcut})`}
      >
        <IconComponent size={18} />
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-2 rounded-lg text-left transition-all duration-200 ${
        isActive 
          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md' 
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
      }`}
      title={`${config.description} (${config.shortcut})`}
    >
      <IconComponent size={18} className="mr-3 flex-shrink-0" />
      <span className="text-sm font-medium flex-grow truncate">{config.title}</span>
      {isActive && <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />}
    </button>
  );
}

export function IconToolbar({ activePanelIds, onPanelClick, getSmartPriority, config: userConfig, className = '' }: IconToolbarProps) {
  const config = { ...DEFAULT_TOOLBAR_CONFIG, ...userConfig };
  const { position, isDragging, handleMouseDown, isHovering, setIsHovering } = useDraggable();

  const sortedPanelTypes = useMemo(() => {
    return Object.keys(PANEL_CONFIGS).sort((a, b) => {
      const priorityA = getSmartPriority(a as PanelType);
      const priorityB = getSmartPriority(b as PanelType);
      return priorityB - priorityA;
    }) as PanelType[];
  }, [getSmartPriority]);

  const isCollapsed = position.isCollapsed && position.dockedSide && !isHovering && !isDragging;
  const toolbarWidth = isCollapsed ? 60 : config.width;
  
  // 计算实际位置（收起时需要调整）
  const actualX = position.dockedSide === 'right' && isCollapsed 
    ? window.innerWidth - 60 
    : position.x;

  return (
    <>
      {/* 悬停触发区域 - 仅在收起时显示 */}
      {position.isCollapsed && position.dockedSide && (
        <div
          className="fixed z-40"
          style={{
            left: position.dockedSide === 'left' ? 0 : undefined,
            right: position.dockedSide === 'right' ? 0 : undefined,
            top: position.y,
            width: '20px',
            height: '400px'
          }}
          onMouseEnter={() => setIsHovering(true)}
        />
      )}
      
      <div
        className={`fixed z-50 transition-all duration-300 ${isDragging ? 'shadow-2xl' : 'shadow-lg'} ${className}`}
        style={{ 
          left: actualX,
          top: position.y,
          width: toolbarWidth,
          cursor: isDragging ? 'grabbing' : 'auto',
          maxHeight: 'calc(100vh - 20px)',
          transform: isCollapsed && position.dockedSide === 'left' ? 'translateX(-10px)' : 
                    isCollapsed && position.dockedSide === 'right' ? 'translateX(10px)' : 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={`bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg p-2 transition-all duration-300`}>
          {/* 拖拽手柄 */}
          <div className="drag-handle cursor-grab p-3 flex items-center justify-center hover:bg-gray-800 rounded-lg transition-colors" title="拖拽移动工具栏">
            {isCollapsed ? (
              position.dockedSide === 'left' ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronLeft className="w-5 h-5 text-gray-400" />
            ) : (
              <Move className="w-5 h-5 text-gray-400 hover:text-gray-200" />
            )}
          </div>
          
          <div className="w-full h-px bg-gray-700 my-1" />
          
          {/* 工具栏项目 */}
          <div className={`flex ${isCollapsed ? 'flex-col items-center' : 'flex-col'} gap-2`}>
            {sortedPanelTypes.map(panelType => {
              const panelConfig = PANEL_CONFIGS[panelType];
              const isActive = activePanelIds.includes(panelType);
              return (
                <ToolbarItem
                  key={panelType}
                  config={panelConfig}
                  isActive={isActive}
                  onClick={() => onPanelClick(panelType)}
                  isCollapsed={isCollapsed}
                />
              );
            })}
          </div>
          
          {/* 靠边指示器 */}
          {position.dockedSide && !isDragging && (
            <div className={`absolute top-1/2 -translate-y-1/2 transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`}>
              <div className={`w-1 h-20 bg-cyan-500/30 rounded-full ${
                position.dockedSide === 'left' ? '-left-1' : '-right-1'
              }`} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}