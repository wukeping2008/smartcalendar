import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TimeCategory {
  id: string
  name: string
  color: string
  budgetHours: number
  actualHours: number
  icon: string
}

interface TimeEntry {
  id: string
  categoryId: string
  startTime: Date
  endTime: Date
  description?: string
  tags?: string[]
}

interface TimeBudgetStore {
  // 状态
  categories: TimeCategory[]
  entries: TimeEntry[]
  activeTimer: {
    categoryId: string
    startTime: Date
  } | null
  
  // 分类操作
  addCategory: (category: Omit<TimeCategory, 'id' | 'actualHours'>) => void
  updateCategory: (id: string, updates: Partial<TimeCategory>) => void
  deleteCategory: (id: string) => void
  
  // 时间记录操作
  startTimer: (categoryId: string) => void
  stopTimer: () => TimeEntry | null
  addEntry: (entry: Omit<TimeEntry, 'id'>) => void
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void
  deleteEntry: (id: string) => void
  
  // 统计查询
  getCategoryStats: (categoryId: string, startDate: Date, endDate: Date) => {
    totalHours: number
    entries: TimeEntry[]
    dailyAverage: number
  }
  getWeeklyReport: () => {
    categories: Array<{
      category: TimeCategory
      hours: number
      percentage: number
    }>
    totalHours: number
  }
  
  // 重置
  resetWeeklyData: () => void
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 默认时间分类
const defaultCategories: Omit<TimeCategory, 'id' | 'actualHours'>[] = [
  { name: '深度工作', color: '#3b82f6', budgetHours: 20, icon: '🧠' },
  { name: '会议沟通', color: '#f59e0b', budgetHours: 10, icon: '💬' },
  { name: '学习成长', color: '#10b981', budgetHours: 8, icon: '📚' },
  { name: '运动健康', color: '#ef4444', budgetHours: 5, icon: '💪' },
  { name: '休息娱乐', color: '#8b5cf6', budgetHours: 10, icon: '😊' },
  { name: '日常事务', color: '#6b7280', budgetHours: 7, icon: '📋' }
]

export const useTimeBudgetStore = create<TimeBudgetStore>()(
  persist(
    (set, get) => ({
      categories: defaultCategories.map(cat => ({
        ...cat,
        id: generateId(),
        actualHours: 0
      })),
      entries: [],
      activeTimer: null,
      
      addCategory: (categoryData) => set((state) => {
        const newCategory: TimeCategory = {
          ...categoryData,
          id: generateId(),
          actualHours: 0
        }
        return { categories: [...state.categories, newCategory] }
      }),
      
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(cat =>
          cat.id === id ? { ...cat, ...updates } : cat
        )
      })),
      
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(cat => cat.id !== id),
        entries: state.entries.filter(entry => entry.categoryId !== id)
      })),
      
      startTimer: (categoryId) => set({
        activeTimer: {
          categoryId,
          startTime: new Date()
        }
      }),
      
      stopTimer: () => {
        const state = get()
        if (!state.activeTimer) return null
        
        const entry: TimeEntry = {
          id: generateId(),
          categoryId: state.activeTimer.categoryId,
          startTime: state.activeTimer.startTime,
          endTime: new Date()
        }
        
        // 计算时长并更新分类的实际时间
        const hours = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60)
        
        set((state) => ({
          entries: [...state.entries, entry],
          activeTimer: null,
          categories: state.categories.map(cat =>
            cat.id === entry.categoryId
              ? { ...cat, actualHours: cat.actualHours + hours }
              : cat
          )
        }))
        
        return entry
      },
      
      addEntry: (entryData) => set((state) => {
        const newEntry: TimeEntry = {
          ...entryData,
          id: generateId()
        }
        
        // 计算时长并更新分类
        const hours = (newEntry.endTime.getTime() - newEntry.startTime.getTime()) / (1000 * 60 * 60)
        
        return {
          entries: [...state.entries, newEntry],
          categories: state.categories.map(cat =>
            cat.id === newEntry.categoryId
              ? { ...cat, actualHours: cat.actualHours + hours }
              : cat
          )
        }
      }),
      
      updateEntry: (id, updates) => set((state) => {
        const oldEntry = state.entries.find(e => e.id === id)
        if (!oldEntry) return state
        
        const newEntry = { ...oldEntry, ...updates }
        const oldHours = (oldEntry.endTime.getTime() - oldEntry.startTime.getTime()) / (1000 * 60 * 60)
        const newHours = (newEntry.endTime.getTime() - newEntry.startTime.getTime()) / (1000 * 60 * 60)
        const hoursDiff = newHours - oldHours
        
        return {
          entries: state.entries.map(e => e.id === id ? newEntry : e),
          categories: state.categories.map(cat =>
            cat.id === newEntry.categoryId
              ? { ...cat, actualHours: cat.actualHours + hoursDiff }
              : cat
          )
        }
      }),
      
      deleteEntry: (id) => set((state) => {
        const entry = state.entries.find(e => e.id === id)
        if (!entry) return state
        
        const hours = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60)
        
        return {
          entries: state.entries.filter(e => e.id !== id),
          categories: state.categories.map(cat =>
            cat.id === entry.categoryId
              ? { ...cat, actualHours: Math.max(0, cat.actualHours - hours) }
              : cat
          )
        }
      }),
      
      getCategoryStats: (categoryId, startDate, endDate) => {
        const state = get()
        const categoryEntries = state.entries.filter(entry =>
          entry.categoryId === categoryId &&
          entry.startTime >= startDate &&
          entry.endTime <= endDate
        )
        
        const totalHours = categoryEntries.reduce((sum, entry) =>
          sum + (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60), 0
        )
        
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          totalHours,
          entries: categoryEntries,
          dailyAverage: totalHours / days
        }
      },
      
      getWeeklyReport: () => {
        const state = get()
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        
        const weekEntries = state.entries.filter(entry =>
          entry.startTime >= weekStart && entry.endTime <= weekEnd
        )
        
        const categoryHours = new Map<string, number>()
        let totalHours = 0
        
        weekEntries.forEach(entry => {
          const hours = (entry.endTime.getTime() - entry.startTime.getTime()) / (1000 * 60 * 60)
          categoryHours.set(
            entry.categoryId,
            (categoryHours.get(entry.categoryId) || 0) + hours
          )
          totalHours += hours
        })
        
        const categories = state.categories.map(cat => ({
          category: cat,
          hours: categoryHours.get(cat.id) || 0,
          percentage: totalHours > 0 ? ((categoryHours.get(cat.id) || 0) / totalHours) * 100 : 0
        }))
        
        return { categories, totalHours }
      },
      
      resetWeeklyData: () => set((state) => ({
        categories: state.categories.map(cat => ({ ...cat, actualHours: 0 })),
        entries: []
      }))
    }),
    {
      name: 'time-budget-storage',
      version: 1,
      partialize: (state) => ({
        categories: state.categories,
        entries: state.entries
      })
    }
  )
)