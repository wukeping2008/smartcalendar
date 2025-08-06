import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Event, EventCategory, Priority, EventStatus } from '../../types/event'
import { FlowPosition } from '../../types/timeflow'
import { storageService } from '../services/StorageService'

// 事件存储状态接口
interface EventStore {
  // 状态
  events: Event[]
  selectedEventIds: string[]
  draggedEventId: string | null
  hoveredEventId: string | null
  isLoaded: boolean
  
  // 过滤和搜索
  filters: {
    category: EventCategory | null
    priority: Priority | null
    status: EventStatus | null
    dateRange: { start: Date; end: Date } | null
    searchText: string
  }
  
  // 操作方法
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateEvent: (id: string, updates: Partial<Event>) => void
  deleteEvent: (id: string) => void
  duplicateEvent: (id: string) => void
  
  // 选择操作
  selectEvent: (id: string) => void
  selectMultipleEvents: (ids: string[]) => void
  clearSelection: () => void
  
  // 拖拽操作
  startDrag: (id: string) => void
  endDrag: () => void
  updateEventPosition: (id: string, position: FlowPosition) => void
  
  // 悬停操作
  setHoveredEvent: (id: string | null) => void
  
  // 过滤操作
  setFilter: <K extends keyof EventStore['filters']>(key: K, value: EventStore['filters'][K]) => void
  clearFilters: () => void
  
  // 查询方法
  getEvent: (id: string) => Event | undefined
  getEventsByCategory: (category: EventCategory) => Event[]
  getEventsByDateRange: (start: Date, end: Date) => Event[]
  getFilteredEvents: () => Event[]
  
  // 批量操作
  deleteSelectedEvents: () => void
  updateSelectedEvents: (updates: Partial<Event>) => void
  
  // 持久化方法
  loadEvents: () => Promise<void>
  clearAllEvents: () => Promise<void>
}

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 检查时间冲突
const hasTimeConflict = (event1: Event, event2: Event): boolean => {
  return event1.endTime > event2.startTime && event1.startTime < event2.endTime
}

// 创建事件存储
export const useEventStore = create<EventStore>()(
  immer((set, get) => ({
    // 初始状态
    events: [],
    selectedEventIds: [],
    draggedEventId: null,
    hoveredEventId: null,
    isLoaded: false,
    
    filters: {
      category: null,
      priority: null,
      status: null,
      dateRange: null,
      searchText: ''
    },
    
    // 添加事件
    addEvent: (eventData) => set((state) => {
      const now = new Date()
      const newEvent: Event = {
        ...eventData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        // 默认时间流属性
        position: eventData.position || { x: 0, y: 0, z: 0 },
        size: eventData.size || { width: 200, height: 80, depth: 20 },
        color: eventData.color || '#6366f1',
        opacity: eventData.opacity || 0.8,
        // 默认交互状态
        isSelected: false,
        isDragging: false,
        isHovered: false,
        isConflicted: false,
        // 工时预算和精力管理默认值
        energyRequired: eventData.energyRequired,
        estimatedDuration: eventData.estimatedDuration,
        isMarketProtected: eventData.isMarketProtected || false,
        flexibilityScore: eventData.flexibilityScore || 50,
        // 默认数组
        tags: eventData.tags || [],
        reminders: eventData.reminders || []
      }
      
      // 检查冲突
      const conflictingEvents = state.events.filter(event => 
        hasTimeConflict(newEvent, event)
      )
      
      if (conflictingEvents.length > 0) {
        newEvent.isConflicted = true
        // 标记冲突的事件
        conflictingEvents.forEach(event => {
          event.isConflicted = true
        })
      }
      
      state.events.push(newEvent)
      
      // 异步保存到StorageService
      storageService.saveEvent(newEvent).catch((error) => {
        console.error('Failed to save event to storage:', error)
      })
    }),
    
    // 更新事件
    updateEvent: (id, updates) => set((state) => {
      const eventIndex = state.events.findIndex(e => e.id === id)
      if (eventIndex !== -1) {
        const updatedEvent = {
          ...state.events[eventIndex],
          ...updates,
          updatedAt: new Date()
        }
        state.events[eventIndex] = updatedEvent
        
        // 重新检查所有冲突
        state.events.forEach(event => {
          event.isConflicted = state.events.some(otherEvent => 
            otherEvent.id !== event.id && hasTimeConflict(event, otherEvent)
          )
        })
        
        // 异步更新到StorageService
        storageService.saveEvent(updatedEvent).catch((error) => {
          console.error('Failed to update event in storage:', error)
        })
      }
    }),
    
    // 删除事件
    deleteEvent: (id) => set((state) => {
      state.events = state.events.filter(e => e.id !== id)
      state.selectedEventIds = state.selectedEventIds.filter(selectedId => selectedId !== id)
      
      if (state.draggedEventId === id) {
        state.draggedEventId = null
      }
      
      if (state.hoveredEventId === id) {
        state.hoveredEventId = null
      }
      
      // 重新检查剩余事件的冲突
      state.events.forEach(event => {
        event.isConflicted = state.events.some(otherEvent => 
          otherEvent.id !== event.id && hasTimeConflict(event, otherEvent)
        )
      })
      
      // 异步从StorageService删除
      storageService.deleteEvent(id).catch((error) => {
        console.error('Failed to delete event from storage:', error)
      })
    }),
    
    // 复制事件
    duplicateEvent: (id) => set((state) => {
      const originalEvent = state.events.find(e => e.id === id)
      if (originalEvent) {
        const now = new Date()
        const duplicatedEvent: Event = {
          ...originalEvent,
          id: generateId(),
          title: `${originalEvent.title} (副本)`,
          startTime: new Date(originalEvent.startTime.getTime() + 60 * 60 * 1000),
          endTime: new Date(originalEvent.endTime.getTime() + 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now,
          isSelected: false,
          isDragging: false,
          isHovered: false,
          isConflicted: false
        }
        
        state.events.push(duplicatedEvent)
      }
    }),
    
    // 选择事件
    selectEvent: (id) => set((state) => {
      state.events.forEach(event => {
        event.isSelected = event.id === id
      })
      state.selectedEventIds = [id]
    }),
    
    // 多选事件
    selectMultipleEvents: (ids) => set((state) => {
      state.events.forEach(event => {
        event.isSelected = ids.includes(event.id)
      })
      state.selectedEventIds = ids
    }),
    
    // 清除选择
    clearSelection: () => set((state) => {
      state.events.forEach(event => {
        event.isSelected = false
      })
      state.selectedEventIds = []
    }),
    
    // 开始拖拽
    startDrag: (id) => set((state) => {
      state.draggedEventId = id
      const event = state.events.find(e => e.id === id)
      if (event) {
        event.isDragging = true
      }
    }),
    
    // 结束拖拽
    endDrag: () => set((state) => {
      if (state.draggedEventId) {
        const event = state.events.find(e => e.id === state.draggedEventId)
        if (event) {
          event.isDragging = false
        }
        state.draggedEventId = null
      }
    }),
    
    // 更新事件位置
    updateEventPosition: (id, position) => set((state) => {
      const event = state.events.find(e => e.id === id)
      if (event) {
        event.position = { ...position }
      }
    }),
    
    // 设置悬停事件
    setHoveredEvent: (id) => set((state) => {
      // 清除之前的悬停状态
      state.events.forEach(event => {
        event.isHovered = false
      })
      
      // 设置新的悬停状态
      if (id) {
        const event = state.events.find(e => e.id === id)
        if (event) {
          event.isHovered = true
        }
      }
      
      state.hoveredEventId = id
    }),
    
    // 设置过滤器
    setFilter: (key, value) => set((state) => {
      state.filters[key] = value
    }),
    
    // 清除过滤器
    clearFilters: () => set((state) => {
      state.filters = {
        category: null,
        priority: null,
        status: null,
        dateRange: null,
        searchText: ''
      }
    }),
    
    // 删除选中的事件
    deleteSelectedEvents: () => set((state) => {
      state.events = state.events.filter(e => !state.selectedEventIds.includes(e.id))
      state.selectedEventIds = []
    }),
    
    // 更新选中的事件
    updateSelectedEvents: (updates) => set((state) => {
      state.selectedEventIds.forEach(id => {
        const eventIndex = state.events.findIndex(e => e.id === id)
        if (eventIndex !== -1) {
          state.events[eventIndex] = {
            ...state.events[eventIndex],
            ...updates,
            updatedAt: new Date()
          }
        }
      })
    }),
    
    // 获取单个事件
    getEvent: (id) => {
      return get().events.find(e => e.id === id)
    },
    
    // 按类别获取事件
    getEventsByCategory: (category) => {
      return get().events.filter(e => e.category === category)
    },
    
    // 按日期范围获取事件
    getEventsByDateRange: (start, end) => {
      return get().events.filter(e => 
        e.startTime >= start && e.endTime <= end
      )
    },
    
    // 获取过滤后的事件
    getFilteredEvents: () => {
      const { events, filters } = get()
      let filteredEvents = [...events]
      
      // 按类别过滤
      if (filters.category) {
        filteredEvents = filteredEvents.filter(e => e.category === filters.category)
      }
      
      // 按优先级过滤
      if (filters.priority) {
        filteredEvents = filteredEvents.filter(e => e.priority === filters.priority)
      }
      
      // 按状态过滤
      if (filters.status) {
        filteredEvents = filteredEvents.filter(e => e.status === filters.status)
      }
      
      // 按日期范围过滤
      if (filters.dateRange) {
        filteredEvents = filteredEvents.filter(e => 
          e.startTime >= filters.dateRange!.start && 
          e.endTime <= filters.dateRange!.end
        )
      }
      
      // 按搜索文本过滤
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase()
        filteredEvents = filteredEvents.filter(e => 
          e.title.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower) ||
          e.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      }
      
      return filteredEvents
    },
    
    // 从StorageService加载所有事件
    loadEvents: async () => {
      try {
        console.log('📥 Loading events from storage...')
        const storedEvents = await storageService.getAllEvents()
        console.log(`✅ Loaded ${storedEvents.length} events from storage`)
        
        set((state) => {
          state.events = storedEvents
          state.isLoaded = true
          
          // 重新检查所有冲突
          state.events.forEach(event => {
            event.isConflicted = state.events.some(otherEvent => 
              otherEvent.id !== event.id && hasTimeConflict(event, otherEvent)
            )
          })
        })
      } catch (error) {
        console.error('❌ Failed to load events from storage:', error)
        set((state) => {
          state.isLoaded = true
        })
      }
    },
    
    // 清除所有事件
    clearAllEvents: async () => {
      try {
        set((state) => {
          state.events = []
          state.selectedEventIds = []
          state.draggedEventId = null
          state.hoveredEventId = null
        })
        
        console.log('🗑️ All events cleared from memory')
      } catch (error) {
        console.error('❌ Failed to clear events:', error)
      }
    }
  }))
)
