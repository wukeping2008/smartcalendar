import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  PanelType,
  PanelState,
  PanelPosition,
  PanelSize,
  PanelAction,
  PanelInstance,
  FloatingPanelState,
  UseFloatingPanelsReturn,
  PanelPriority
} from '../../types/floating-panel';
import { calculateFinalPriority } from '../utils/smartPriority';

// 默认面板位置和尺寸
const DEFAULT_PANEL_SIZE: PanelSize = { width: 400, height: 500 };
const DEFAULT_MIN_SIZE: PanelSize = { width: 300, height: 200 };
const PANEL_OFFSET_INCREMENT = 30; // 新面板位置偏移量

// 初始状态
const initialState: FloatingPanelState = {
  panels: new Map(),
  activePanelId: null,
  nextZIndex: 1000,
  smartPriorityEnabled: true,
  keyboardShortcutsEnabled: true
};

// 状态reducer
function panelReducer(state: FloatingPanelState, action: PanelAction): FloatingPanelState {
  const newState = { ...state };
  newState.panels = new Map(state.panels);

  switch (action.type) {
    case 'OPEN_PANEL': {
      const existingPanel = newState.panels.get(action.panelId);
      
      if (existingPanel && existingPanel.state !== PanelState.CLOSED) {
        // 如果面板已经打开，只是聚焦
        newState.panels.set(action.panelId, {
          ...existingPanel,
          state: PanelState.OPEN,
          zIndex: newState.nextZIndex,
          lastActiveTime: Date.now()
        });
        newState.activePanelId = action.panelId;
        newState.nextZIndex += 1;
      } else {
        // 创建新的面板实例
        const position = action.position || getNextPosition(newState.panels);
        newState.panels.set(action.panelId, {
          id: action.panelId,
          state: PanelState.OPEN,
          position,
          size: DEFAULT_PANEL_SIZE,
          zIndex: newState.nextZIndex,
          isPinned: false,
          isMinimized: false,
          lastActiveTime: Date.now(),
          createdAt: Date.now()
        });
        newState.activePanelId = action.panelId;
        newState.nextZIndex += 1;
      }
      break;
    }

    case 'CLOSE_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        if (panel.isPinned) {
          // 钉住的面板只能最小化，不能关闭
          newState.panels.set(action.panelId, {
            ...panel,
            state: PanelState.MINIMIZED,
            isMinimized: true
          });
        } else {
          newState.panels.delete(action.panelId);
        }
        
        if (newState.activePanelId === action.panelId) {
          newState.activePanelId = getNextActivePanel(newState.panels);
        }
      }
      break;
    }

    case 'MINIMIZE_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        newState.panels.set(action.panelId, {
          ...panel,
          state: PanelState.MINIMIZED,
          isMinimized: true
        });
        
        if (newState.activePanelId === action.panelId) {
          newState.activePanelId = getNextActivePanel(newState.panels);
        }
      }
      break;
    }

    case 'MAXIMIZE_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        newState.panels.set(action.panelId, {
          ...panel,
          state: PanelState.OPEN,
          isMinimized: false,
          zIndex: newState.nextZIndex,
          lastActiveTime: Date.now()
        });
        newState.activePanelId = action.panelId;
        newState.nextZIndex += 1;
      }
      break;
    }

    case 'PIN_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        newState.panels.set(action.panelId, {
          ...panel,
          isPinned: true
        });
      }
      break;
    }

    case 'UNPIN_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        newState.panels.set(action.panelId, {
          ...panel,
          isPinned: false
        });
      }
      break;
    }

    case 'MOVE_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        newState.panels.set(action.panelId, {
          ...panel,
          position: action.position
        });
      }
      break;
    }

    case 'RESIZE_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        // 确保尺寸不小于最小值
        const constrainedSize = {
          width: Math.max(action.size.width, DEFAULT_MIN_SIZE.width),
          height: Math.max(action.size.height, DEFAULT_MIN_SIZE.height)
        };
        
        newState.panels.set(action.panelId, {
          ...panel,
          size: constrainedSize
        });
      }
      break;
    }

    case 'FOCUS_PANEL': {
      const panel = newState.panels.get(action.panelId);
      if (panel) {
        newState.panels.set(action.panelId, {
          ...panel,
          zIndex: newState.nextZIndex,
          lastActiveTime: Date.now()
        });
        newState.activePanelId = action.panelId;
        newState.nextZIndex += 1;
      }
      break;
    }

    case 'CLOSE_ALL_PANELS': {
      // 只关闭未钉住的面板，钉住的面板最小化
      const pinnedPanels = new Map();
      for (const [id, panel] of newState.panels) {
        if (panel.isPinned) {
          pinnedPanels.set(id, {
            ...panel,
            state: PanelState.MINIMIZED,
            isMinimized: true
          });
        }
      }
      newState.panels = pinnedPanels;
      newState.activePanelId = null;
      break;
    }

    default:
      return state;
  }

  return newState;
}

// 获取下一个面板位置
function getNextPosition(panels: Map<PanelType, PanelInstance>): PanelPosition {
  const openPanels = Array.from(panels.values()).filter(
    panel => panel.state === PanelState.OPEN
  );
  
  const offset = openPanels.length * PANEL_OFFSET_INCREMENT;
  
  return {
    x: 100 + offset,
    y: 100 + offset
  };
}

// 获取下一个活跃面板
function getNextActivePanel(panels: Map<PanelType, PanelInstance>): PanelType | null {
  const openPanels = Array.from(panels.values())
    .filter(panel => panel.state === PanelState.OPEN && !panel.isMinimized)
    .sort((a, b) => b.lastActiveTime - a.lastActiveTime);
  
  return openPanels.length > 0 ? openPanels[0].id : null;
}

// 主Hook
export function useFloatingPanels(): UseFloatingPanelsReturn {
  const [state, dispatch] = useReducer(panelReducer, initialState);
  const keyboardHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // 动作函数
  const openPanel = useCallback((panelId: PanelType, position?: PanelPosition) => {
    dispatch({ type: 'OPEN_PANEL', panelId, position });
  }, []);

  const closePanel = useCallback((panelId: PanelType) => {
    dispatch({ type: 'CLOSE_PANEL', panelId });
  }, []);

  const minimizePanel = useCallback((panelId: PanelType) => {
    dispatch({ type: 'MINIMIZE_PANEL', panelId });
  }, []);

  const maximizePanel = useCallback((panelId: PanelType) => {
    dispatch({ type: 'MAXIMIZE_PANEL', panelId });
  }, []);

  const pinPanel = useCallback((panelId: PanelType) => {
    dispatch({ type: 'PIN_PANEL', panelId });
  }, []);

  const unpinPanel = useCallback((panelId: PanelType) => {
    dispatch({ type: 'UNPIN_PANEL', panelId });
  }, []);

  const movePanel = useCallback((panelId: PanelType, position: PanelPosition) => {
    dispatch({ type: 'MOVE_PANEL', panelId, position });
  }, []);

  const resizePanel = useCallback((panelId: PanelType, size: PanelSize) => {
    dispatch({ type: 'RESIZE_PANEL', panelId, size });
  }, []);

  const focusPanel = useCallback((panelId: PanelType) => {
    dispatch({ type: 'FOCUS_PANEL', panelId });
  }, []);

  const closeAllPanels = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL_PANELS' });
  }, []);

  const togglePanel = useCallback((panelId: PanelType) => {
    const panel = state.panels.get(panelId);
    if (panel && panel.state !== PanelState.CLOSED) {
      if (panel.isMinimized) {
        maximizePanel(panelId);
      } else {
        closePanel(panelId);
      }
    } else {
      openPanel(panelId);
    }
  }, [state.panels, openPanel, closePanel, maximizePanel]);

  // 工具函数
  const getPanelInstance = useCallback((panelId: PanelType) => {
    return state.panels.get(panelId);
  }, [state.panels]);

  const getActivePanels = useCallback(() => {
    return Array.from(state.panels.values()).filter(
      panel => panel.state === PanelState.OPEN && !panel.isMinimized
    );
  }, [state.panels]);

  const getSmartPriority = useCallback((panelId: PanelType) => {
    return calculateFinalPriority(panelId, {
      enableSmartPriority: state.smartPriorityEnabled
    });
  }, [state.smartPriorityEnabled]);

  const isAnyPanelOpen = useCallback(() => {
    return Array.from(state.panels.values()).some(
      panel => panel.state === PanelState.OPEN && !panel.isMinimized
    );
  }, [state.panels]);

  const getNextPanelPosition = useCallback(() => {
    return getNextPosition(state.panels);
  }, [state.panels]);

  // 键盘快捷键处理
  useEffect(() => {
    if (!state.keyboardShortcutsEnabled) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (!e.altKey) return;

      const keyMappings: Record<string, PanelType> = {
        '1': PanelType.AI_ASSISTANT,
        '2': PanelType.CALENDAR,
        '3': PanelType.MARKET_STATUS,
        '4': PanelType.TIME_FLOW,
        '5': PanelType.VOICE_INPUT,
        '6': PanelType.INBOX,
        '7': PanelType.TIME_BUDGET,
        '8': PanelType.PERSON_CARD // 已合并关系管理到人脉CRM
      };

      const panelId = keyMappings[e.key];
      if (panelId) {
        e.preventDefault();
        togglePanel(panelId);
      }

      // ESC 关闭所有面板
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAllPanels();
      }
    };

    keyboardHandlerRef.current = handleKeydown;
    window.addEventListener('keydown', handleKeydown);

    return () => {
      if (keyboardHandlerRef.current) {
        window.removeEventListener('keydown', keyboardHandlerRef.current);
      }
    };
  }, [state.keyboardShortcutsEnabled, togglePanel, closeAllPanels]);

  // 清理无效面板实例
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const maxInactiveTime = 30 * 60 * 1000; // 30分钟

      for (const [id, panel] of state.panels) {
        if (
          panel.state === PanelState.CLOSED &&
          !panel.isPinned &&
          now - panel.lastActiveTime > maxInactiveTime
        ) {
          state.panels.delete(id);
        }
      }
    };

    const interval = setInterval(cleanup, 5 * 60 * 1000); // 每5分钟清理一次
    return () => clearInterval(interval);
  }, [state.panels]);

  return {
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
    closeAllPanels,
    togglePanel,
    getPanelInstance,
    getActivePanels,
    getSmartPriority,
    isAnyPanelOpen,
    getNextPosition: getNextPanelPosition
  };
}