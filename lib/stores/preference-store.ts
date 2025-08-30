import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferences {
  // 主题设置
  theme: 'dark' | 'light' | 'auto'
  accentColor: string
  
  // 语言设置
  language: 'zh' | 'en'
  
  // 视图偏好
  defaultView: 'calendar' | 'flow'
  calendarStartDay: 0 | 1 // 0=周日, 1=周一
  timeFormat: '12h' | '24h'
  
  // 工作时间
  workHours: {
    start: string // "09:00"
    end: string   // "18:00"
    workDays: number[] // [1,2,3,4,5] 周一到周五
  }
  
  // 能量曲线
  energyCurve: {
    morning: 'low' | 'medium' | 'high' | 'peak'    // 6-12
    afternoon: 'low' | 'medium' | 'high' | 'peak'  // 12-18
    evening: 'low' | 'medium' | 'high' | 'peak'    // 18-24
    night: 'low' | 'medium' | 'high' | 'peak'      // 0-6
  }
  
  // 通知设置
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
    advanceTime: number // 提前多少分钟提醒
    types: {
      events: boolean
      tasks: boolean
      reminders: boolean
      conflicts: boolean
    }
  }
  
  // AI设置
  aiSettings: {
    enabled: boolean
    autoSuggestions: boolean
    marketProtection: boolean
    conflictResolution: boolean
    voiceEnabled: boolean
    llmProvider: 'claude' | 'openai' | 'local'
  }
  
  // 隐私设置
  privacy: {
    shareAnalytics: boolean
    saveToCloud: boolean
    localStorageOnly: boolean
  }
  
  // 快捷键
  shortcuts: {
    newEvent: string
    search: string
    toggleView: string
    quickAdd: string
  }
}

interface PreferenceStore extends UserPreferences {
  // 操作方法
  updateTheme: (theme: UserPreferences['theme']) => void
  updateLanguage: (language: UserPreferences['language']) => void
  updateWorkHours: (hours: UserPreferences['workHours']) => void
  updateEnergyCurve: (curve: UserPreferences['energyCurve']) => void
  updateNotifications: (settings: Partial<UserPreferences['notifications']>) => void
  updateAISettings: (settings: Partial<UserPreferences['aiSettings']>) => void
  updatePrivacy: (settings: Partial<UserPreferences['privacy']>) => void
  updateShortcuts: (shortcuts: Partial<UserPreferences['shortcuts']>) => void
  
  // 预设配置
  applyPreset: (preset: 'productive' | 'balanced' | 'relaxed') => void
  resetToDefaults: () => void
  
  // 导出/导入配置
  exportSettings: () => string
  importSettings: (json: string) => boolean
}

// 默认偏好设置
const defaultPreferences: UserPreferences = {
  theme: 'dark',
  accentColor: '#06b6d4', // cyan-500
  language: 'zh',
  defaultView: 'calendar',
  calendarStartDay: 1,
  timeFormat: '24h',
  
  workHours: {
    start: '09:00',
    end: '18:00',
    workDays: [1, 2, 3, 4, 5]
  },
  
  energyCurve: {
    morning: 'medium',
    afternoon: 'high',
    evening: 'medium',
    night: 'low'
  },
  
  notifications: {
    enabled: true,
    sound: false,
    desktop: true,
    advanceTime: 15,
    types: {
      events: true,
      tasks: true,
      reminders: true,
      conflicts: true
    }
  },
  
  aiSettings: {
    enabled: true,
    autoSuggestions: true,
    marketProtection: true,
    conflictResolution: true,
    voiceEnabled: true,
    llmProvider: 'claude'
  },
  
  privacy: {
    shareAnalytics: false,
    saveToCloud: false,
    localStorageOnly: true
  },
  
  shortcuts: {
    newEvent: 'ctrl+n',
    search: 'ctrl+k',
    toggleView: 'ctrl+shift+v',
    quickAdd: 'ctrl+q'
  }
}

// 预设配置
const presets = {
  productive: {
    energyCurve: {
      morning: 'high',
      afternoon: 'peak',
      evening: 'medium',
      night: 'low'
    },
    workHours: {
      start: '08:00',
      end: '20:00',
      workDays: [1, 2, 3, 4, 5, 6]
    },
    aiSettings: {
      enabled: true,
      autoSuggestions: true,
      marketProtection: true,
      conflictResolution: true,
      voiceEnabled: true,
      llmProvider: 'claude' as const
    }
  },
  balanced: {
    energyCurve: {
      morning: 'medium',
      afternoon: 'high',
      evening: 'medium',
      night: 'low'
    },
    workHours: {
      start: '09:00',
      end: '18:00',
      workDays: [1, 2, 3, 4, 5]
    },
    aiSettings: {
      enabled: true,
      autoSuggestions: true,
      marketProtection: false,
      conflictResolution: true,
      voiceEnabled: true,
      llmProvider: 'claude' as const
    }
  },
  relaxed: {
    energyCurve: {
      morning: 'low',
      afternoon: 'medium',
      evening: 'high',
      night: 'medium'
    },
    workHours: {
      start: '10:00',
      end: '17:00',
      workDays: [1, 2, 3, 4, 5]
    },
    aiSettings: {
      enabled: false,
      autoSuggestions: false,
      marketProtection: false,
      conflictResolution: false,
      voiceEnabled: false,
      llmProvider: 'local' as const
    }
  }
}

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set, get) => ({
      ...defaultPreferences,
      
      updateTheme: (theme) => set({ theme }),
      updateLanguage: (language) => set({ language }),
      updateWorkHours: (workHours) => set({ workHours }),
      updateEnergyCurve: (energyCurve) => set({ energyCurve }),
      
      updateNotifications: (settings) => set((state) => ({
        notifications: { ...state.notifications, ...settings }
      })),
      
      updateAISettings: (settings) => set((state) => ({
        aiSettings: { ...state.aiSettings, ...settings }
      })),
      
      updatePrivacy: (settings) => set((state) => ({
        privacy: { ...state.privacy, ...settings }
      })),
      
      updateShortcuts: (shortcuts) => set((state) => ({
        shortcuts: { ...state.shortcuts, ...shortcuts }
      })),
      
      applyPreset: (preset) => set((state) => ({
        ...state,
        ...(presets[preset] as any)
      })),
      
      resetToDefaults: () => set(defaultPreferences),
      
      exportSettings: () => {
        const state = get()
        const exportData = {
          theme: state.theme,
          accentColor: state.accentColor,
          language: state.language,
          defaultView: state.defaultView,
          calendarStartDay: state.calendarStartDay,
          timeFormat: state.timeFormat,
          workHours: state.workHours,
          energyCurve: state.energyCurve,
          notifications: state.notifications,
          aiSettings: state.aiSettings,
          privacy: state.privacy,
          shortcuts: state.shortcuts
        }
        return JSON.stringify(exportData, null, 2)
      },
      
      importSettings: (json) => {
        try {
          const settings = JSON.parse(json)
          set(settings)
          return true
        } catch (error) {
          // Failed to import settings
          return false
        }
      }
    }),
    {
      name: 'user-preferences',
      version: 1
    }
  )
)