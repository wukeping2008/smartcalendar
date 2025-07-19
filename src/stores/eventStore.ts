import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Event, EventCategory, Priority } from '@/types'
import { loadEvents, saveEvents } from '@/utils/storage'

export const useEventStore = defineStore('events', () => {
  // 状态
  const events = ref<Event[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const todayEvents = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return events.value.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate >= today && eventDate < tomorrow
    })
  })

  const upcomingEvents = computed(() => {
    const now = new Date()
    return events.value
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5)
  })

  const eventsByCategory = computed(() => {
    return events.value.reduce((acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = []
      }
      acc[event.category].push(event)
      return acc
    }, {} as Record<EventCategory, Event[]>)
  })

  // 方法
  const loadEventsFromStorage = async () => {
    try {
      loading.value = true
      error.value = null
      const loadedEvents = await loadEvents()
      events.value = loadedEvents
    } catch (err) {
      error.value = '加载事件失败'
      console.error('加载事件失败:', err)
    } finally {
      loading.value = false
    }
  }

  const saveEventsToStorage = async () => {
    try {
      await saveEvents(events.value)
    } catch (err) {
      error.value = '保存事件失败'
      console.error('保存事件失败:', err)
    }
  }

  const addEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: Event = {
      ...eventData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    events.value.push(newEvent)
    await saveEventsToStorage()
    return newEvent
  }

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const index = events.value.findIndex(event => event.id === id)
    if (index !== -1) {
      events.value[index] = {
        ...events.value[index],
        ...updates,
        updatedAt: new Date()
      }
      await saveEventsToStorage()
      return events.value[index]
    }
    throw new Error('事件未找到')
  }

  const deleteEvent = async (id: string) => {
    const index = events.value.findIndex(event => event.id === id)
    if (index !== -1) {
      events.value.splice(index, 1)
      await saveEventsToStorage()
    }
  }

  const getEventsByDateRange = (startDate: Date, endDate: Date) => {
    return events.value.filter(event => {
      const eventStart = new Date(event.startTime)
      return eventStart >= startDate && eventStart <= endDate
    })
  }

  const getEventsByDate = (date: Date) => {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    return events.value.filter(event => {
      const eventStart = new Date(event.startTime)
      return eventStart >= startOfDay && eventStart <= endOfDay
    })
  }

  const getAllEvents = () => {
    return events.value
  }

  // 辅助函数
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  return {
    // 状态
    events,
    loading,
    error,
    // 计算属性
    todayEvents,
    upcomingEvents,
    eventsByCategory,
    // 方法
    loadEventsFromStorage,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsByDateRange,
    getEventsByDate,
    getAllEvents
  }
})
