import type { Event } from '@/types'

const STORAGE_KEY = 'smart-calendar-events'
const DATA_FILE_PATH = '/src/data/events.json'

/**
 * 从localStorage和JSON文件加载事件数据
 */
export const loadEvents = async (): Promise<Event[]> => {
  try {
    // 首先尝试从localStorage加载
    const localData = localStorage.getItem(STORAGE_KEY)
    if (localData) {
      const events = JSON.parse(localData)
      return events.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      }))
    }

    // 如果localStorage为空，尝试加载默认数据
    return await loadDefaultEvents()
  } catch (error) {
    console.error('加载事件数据失败:', error)
    return []
  }
}

/**
 * 保存事件数据到localStorage
 */
export const saveEvents = async (events: Event[]): Promise<void> => {
  try {
    const serializedEvents = JSON.stringify(events)
    localStorage.setItem(STORAGE_KEY, serializedEvents)
    
    // 同时保存到JSON文件（用于数据持久化）
    await saveToJsonFile(events)
  } catch (error) {
    console.error('保存事件数据失败:', error)
    throw error
  }
}

/**
 * 加载默认示例数据
 */
const loadDefaultEvents = async (): Promise<Event[]> => {
  const defaultEvents: Event[] = [
    {
      id: 'default-1',
      title: '团队会议',
      description: '讨论项目进度和下周计划',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3小时后
      category: 'work' as any,
      priority: 'medium' as any,
      isCompleted: false,
      reminders: [],
      location: '会议室A',
      attendees: ['张三', '李四'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'default-2',
      title: '健身锻炼',
      description: '跑步30分钟',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明天
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 明天+30分钟
      category: 'health' as any,
      priority: 'high' as any,
      isCompleted: false,
      reminders: [
        {
          id: 'reminder-1',
          type: 'notification' as any,
          time: 15,
          isEnabled: true
        }
      ],
      location: '公园',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  // 保存默认数据到localStorage
  await saveEvents(defaultEvents)
  return defaultEvents
}

/**
 * 保存数据到JSON文件（模拟文件系统存储）
 */
const saveToJsonFile = async (events: Event[]): Promise<void> => {
  try {
    // 在实际应用中，这里可以调用后端API保存到文件
    // 现在只是在控制台输出，表示数据已保存
    console.log('数据已保存到JSON文件:', events.length, '个事件')
  } catch (error) {
    console.error('保存到JSON文件失败:', error)
  }
}

/**
 * 导出数据为JSON格式
 */
export const exportEventsAsJson = (events: Event[]): string => {
  return JSON.stringify(events, null, 2)
}

/**
 * 从JSON字符串导入数据
 */
export const importEventsFromJson = (jsonString: string): Event[] => {
  try {
    const events = JSON.parse(jsonString)
    return events.map((event: any) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt)
    }))
  } catch (error) {
    console.error('导入JSON数据失败:', error)
    throw new Error('无效的JSON格式')
  }
}

/**
 * 清空所有数据
 */
export const clearAllEvents = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY)
  console.log('所有事件数据已清空')
}
