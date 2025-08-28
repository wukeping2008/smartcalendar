import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PanelType, PanelState } from '../../types/floating-panel'

interface PanelPosition {
  x: number
  y: number
}

interface PanelSize {
  width: number
  height: number
}

interface PanelStore {
  // 面板状态
  panels: Record<PanelType, {
    state: PanelState
    position: PanelPosition
    size: PanelSize
    minimized: boolean
    zIndex: number
  }>
  
  // 工具栏位置
  toolbarPosition: PanelPosition
  
  // 操作
  togglePanel: (type: PanelType) => void
  closePanel: (type: PanelType) => void
  openPanel: (type: PanelType) => void
  minimizePanel: (type: PanelType) => void
  restorePanel: (type: PanelType) => void
  
  updatePanelPosition: (type: PanelType, position: PanelPosition) => void
  updatePanelSize: (type: PanelType, size: PanelSize) => void
  bringToFront: (type: PanelType) => void
  
  updateToolbarPosition: (position: PanelPosition) => void
  
  // 批量操作
  closeAllPanels: () => void
  minimizeAllPanels: () => void
  restoreLayout: () => void
}

// 默认面板配置
const defaultPanelConfig = {
  state: PanelState.CLOSED,
  position: { x: 100, y: 100 },
  size: { width: 400, height: 600 },
  minimized: false,
  zIndex: 1000
}

// 初始化所有面板的默认状态
const initializePanels = () => {
  const panels: Record<string, typeof defaultPanelConfig> = {}
  Object.values(PanelType).forEach(type => {
    panels[type] = { ...defaultPanelConfig }
  })
  return panels as Record<PanelType, typeof defaultPanelConfig>
}

export const usePanelStore = create<PanelStore>()(
  persist(
    (set, get) => ({
      panels: initializePanels(),
      toolbarPosition: { x: window.innerWidth - 140, y: window.innerHeight / 2 - 250 },
      
      togglePanel: (type) => set((state) => {
        const panel = state.panels[type]
        const newState = panel.state === PanelState.OPEN ? PanelState.CLOSED : PanelState.OPEN
        
        // 如果打开面板，将其置于最前
        let newZIndex = panel.zIndex
        if (newState === PanelState.OPEN) {
          const maxZIndex = Math.max(...Object.values(state.panels).map(p => p.zIndex))
          newZIndex = maxZIndex + 1
        }
        
        return {
          panels: {
            ...state.panels,
            [type]: {
              ...panel,
              state: newState,
              zIndex: newZIndex,
              minimized: false
            }
          }
        }
      }),
      
      closePanel: (type) => set((state) => ({
        panels: {
          ...state.panels,
          [type]: {
            ...state.panels[type],
            state: PanelState.CLOSED
          }
        }
      })),
      
      openPanel: (type) => set((state) => {
        const maxZIndex = Math.max(...Object.values(state.panels).map(p => p.zIndex))
        return {
          panels: {
            ...state.panels,
            [type]: {
              ...state.panels[type],
              state: PanelState.OPEN,
              zIndex: maxZIndex + 1,
              minimized: false
            }
          }
        }
      }),
      
      minimizePanel: (type) => set((state) => ({
        panels: {
          ...state.panels,
          [type]: {
            ...state.panels[type],
            minimized: true
          }
        }
      })),
      
      restorePanel: (type) => set((state) => {
        const maxZIndex = Math.max(...Object.values(state.panels).map(p => p.zIndex))
        return {
          panels: {
            ...state.panels,
            [type]: {
              ...state.panels[type],
              minimized: false,
              zIndex: maxZIndex + 1
            }
          }
        }
      }),
      
      updatePanelPosition: (type, position) => set((state) => ({
        panels: {
          ...state.panels,
          [type]: {
            ...state.panels[type],
            position
          }
        }
      })),
      
      updatePanelSize: (type, size) => set((state) => ({
        panels: {
          ...state.panels,
          [type]: {
            ...state.panels[type],
            size
          }
        }
      })),
      
      bringToFront: (type) => set((state) => {
        const maxZIndex = Math.max(...Object.values(state.panels).map(p => p.zIndex))
        return {
          panels: {
            ...state.panels,
            [type]: {
              ...state.panels[type],
              zIndex: maxZIndex + 1
            }
          }
        }
      }),
      
      updateToolbarPosition: (position) => set({ toolbarPosition: position }),
      
      closeAllPanels: () => set((state) => {
        const newPanels = { ...state.panels }
        Object.keys(newPanels).forEach(type => {
          newPanels[type as PanelType] = {
            ...newPanels[type as PanelType],
            state: PanelState.CLOSED
          }
        })
        return { panels: newPanels }
      }),
      
      minimizeAllPanels: () => set((state) => {
        const newPanels = { ...state.panels }
        Object.keys(newPanels).forEach(type => {
          if (newPanels[type as PanelType].state === PanelState.OPEN) {
            newPanels[type as PanelType] = {
              ...newPanels[type as PanelType],
              minimized: true
            }
          }
        })
        return { panels: newPanels }
      }),
      
      restoreLayout: () => set({
        panels: initializePanels(),
        toolbarPosition: { x: window.innerWidth - 140, y: window.innerHeight / 2 - 250 }
      })
    }),
    {
      name: 'panel-layout',
      version: 1,
      partialize: (state) => ({
        panels: state.panels,
        toolbarPosition: state.toolbarPosition
      })
    }
  )
)