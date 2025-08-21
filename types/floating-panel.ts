import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// 面板状态枚举
export enum PanelState {
  CLOSED = 'closed',
  OPEN = 'open',
  MINIMIZED = 'minimized',
  PINNED = 'pinned'
}

// 面板优先级枚举
export enum PanelPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  CRITICAL = 3
}

// 面板类型枚举
export enum PanelType {
  AI_ASSISTANT = 'ai-assistant',
  CALENDAR = 'calendar',
  MARKET_STATUS = 'market-status',
  TIME_FLOW = 'time-flow',
  VOICE_INPUT = 'voice-input',
  INBOX = 'inbox',
  TIME_BUDGET = 'time-budget',
  RELATIONSHIPS = 'relationships',
  DAILY_BRIEFING = 'daily-briefing'
}

// 面板位置类型
export interface PanelPosition {
  x: number;
  y: number;
}

// 面板尺寸类型
export interface PanelSize {
  width: number;
  height: number;
}

// 面板配置接口
export interface PanelConfig {
  id: PanelType;
  title: string;
  icon: LucideIcon;
  shortcut: string; // 键盘快捷键，如 'Alt+1'
  defaultSize: PanelSize;
  minSize: PanelSize;
  maxSize?: PanelSize;
  resizable: boolean;
  draggable: boolean;
  canPin: boolean;
  canMinimize: boolean;
  component: ReactNode;
  priority: PanelPriority;
  timeSlots?: number[]; // 优先显示的时间段（24小时制）
  description: string;
}

// 面板实例状态接口
export interface PanelInstance {
  id: PanelType;
  state: PanelState;
  position: PanelPosition;
  size: PanelSize;
  zIndex: number;
  isPinned: boolean;
  isMinimized: boolean;
  lastActiveTime: number;
  createdAt: number;
}

// 面板操作类型
export type PanelAction = 
  | { type: 'OPEN_PANEL'; panelId: PanelType; position?: PanelPosition }
  | { type: 'CLOSE_PANEL'; panelId: PanelType }
  | { type: 'MINIMIZE_PANEL'; panelId: PanelType }
  | { type: 'MAXIMIZE_PANEL'; panelId: PanelType }
  | { type: 'PIN_PANEL'; panelId: PanelType }
  | { type: 'UNPIN_PANEL'; panelId: PanelType }
  | { type: 'MOVE_PANEL'; panelId: PanelType; position: PanelPosition }
  | { type: 'RESIZE_PANEL'; panelId: PanelType; size: PanelSize }
  | { type: 'FOCUS_PANEL'; panelId: PanelType }
  | { type: 'CLOSE_ALL_PANELS' }
  | { type: 'UPDATE_PRIORITY'; panelId: PanelType; priority: PanelPriority };

// 面板管理器状态接口
export interface FloatingPanelState {
  panels: Map<PanelType, PanelInstance>;
  activePanelId: PanelType | null;
  nextZIndex: number;
  smartPriorityEnabled: boolean;
  keyboardShortcutsEnabled: boolean;
}

// 智能优先级配置接口
export interface SmartPriorityConfig {
  morningPanels: PanelType[];     // 9:00-12:00
  afternoonPanels: PanelType[];   // 12:00-18:00
  eveningPanels: PanelType[];     // 18:00-22:00
  nightPanels: PanelType[];       // 22:00-9:00
}

// 拖拽状态接口
export interface DragState {
  isDragging: boolean;
  startPosition: PanelPosition;
  currentPosition: PanelPosition;
  offset: PanelPosition;
}

// 调整大小状态接口
export interface ResizeState {
  isResizing: boolean;
  startPosition: PanelPosition;
  startSize: PanelSize;
  resizeDirection: ResizeDirection;
}

// 调整大小方向枚举
export enum ResizeDirection {
  NONE = 'none',
  N = 'n',
  S = 's',
  E = 'e',
  W = 'w',
  NE = 'ne',
  NW = 'nw',
  SE = 'se',
  SW = 'sw'
}

// 面板事件接口
export interface PanelEvent {
  type: 'open' | 'close' | 'minimize' | 'maximize' | 'pin' | 'unpin' | 'move' | 'resize' | 'focus';
  panelId: PanelType;
  timestamp: number;
  data?: any;
}

// Hook 返回值接口
export interface UseFloatingPanelsReturn {
  state: FloatingPanelState;
  openPanel: (panelId: PanelType, position?: PanelPosition) => void;
  closePanel: (panelId: PanelType) => void;
  minimizePanel: (panelId: PanelType) => void;
  maximizePanel: (panelId: PanelType) => void;
  pinPanel: (panelId: PanelType) => void;
  unpinPanel: (panelId: PanelType) => void;
  movePanel: (panelId: PanelType, position: PanelPosition) => void;
  resizePanel: (panelId: PanelType, size: PanelSize) => void;
  focusPanel: (panelId: PanelType) => void;
  closeAllPanels: () => void;
  togglePanel: (panelId: PanelType) => void;
  getPanelInstance: (panelId: PanelType) => PanelInstance | undefined;
  getActivePanels: () => PanelInstance[];
  getSmartPriority: (panelId: PanelType) => PanelPriority;
  isAnyPanelOpen: () => boolean;
  getNextPosition: () => PanelPosition;
}

// 图标工具条配置接口
export interface IconToolbarConfig {
  width: number;
  iconSize: number;
  spacing: number;
  position: 'left' | 'right';
  showLabels: boolean;
  showShortcuts: boolean;
  highlightActive: boolean;
}

// 面板动画配置接口
export interface PanelAnimationConfig {
  duration: number;
  easing: string;
  enableAnimations: boolean;
  openAnimation: 'slide' | 'fade' | 'scale';
  closeAnimation: 'slide' | 'fade' | 'scale';
}