// 日程事件类型
export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  category: EventCategory
  priority: Priority
  isCompleted: boolean
  reminders: Reminder[]
  location?: string
  attendees?: string[]
  createdAt: Date
  updatedAt: Date
}

// 事件分类
export enum EventCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  HEALTH = 'health',
  EDUCATION = 'education',
  SOCIAL = 'social',
  OTHER = 'other'
}

// 优先级
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 提醒设置
export interface Reminder {
  id: string
  type: ReminderType
  time: number // 提前多少分钟
  isEnabled: boolean
}

export enum ReminderType {
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  SMS = 'sms'
}

// AI建议
export interface AISuggestion {
  id: string
  type: SuggestionType
  title: string
  description: string
  confidence: number // 0-1之间的置信度
  createdAt: Date
}

export enum SuggestionType {
  TIME_OPTIMIZATION = 'time_optimization',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  BREAK_REMINDER = 'break_reminder',
  TASK_PRIORITY = 'task_priority'
}

// 日历视图类型
export enum CalendarView {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}
