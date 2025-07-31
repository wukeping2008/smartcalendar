// 事件系统类型定义
export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  category: EventCategory
  priority: Priority
  status: EventStatus
  
  // 时间流特有属性
  position: FlowPosition
  size: FlowSize
  color: string
  opacity: number
  
  // 交互状态
  isSelected: boolean
  isDragging: boolean
  isHovered: boolean
  isConflicted: boolean
  
  // 工时预算和精力管理
  energyRequired: EnergyLevel
  estimatedDuration: number  // 预估时长（分钟）
  actualDuration?: number    // 实际时长（分钟）
  isMarketProtected: boolean // 是否受市场时段保护
  flexibilityScore: number   // 灵活度评分 0-100
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  tags: string[]
  reminders: Reminder[]
}

export interface FlowPosition {
  x: number
  y: number
  z: number
}

export interface FlowSize {
  width: number
  height: number
  depth: number
}

export enum EventCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  MEETING = 'meeting',
  BREAK = 'break',
  EXERCISE = 'exercise',
  MEAL = 'meal',
  TRAVEL = 'travel',
  OTHER = 'other',
  // Trading专业类别
  TRADING = 'trading',
  LIFE_ROUTINE = 'life',
  PREPARATION = 'preparation'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum EventStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

// 精力等级
export enum EnergyLevel {
  LOW = 'low',      // 低精力任务（例行事务）
  MEDIUM = 'medium', // 中等精力任务（一般工作）
  HIGH = 'high',    // 高精力任务（创造性工作）
  PEAK = 'peak'     // 巅峰精力任务（核心交易）
}

// 工时预算相关类型
export interface WorkHoursBudget {
  weeklyTotal: number        // 每周总工时
  dailyAllocations: {        // 每日分配
    [key: string]: number    // 日期 -> 分配工时
  }
  categoryBudgets: {         // 类别预算
    [category in EventCategory]: number
  }
  consumed: number           // 已消耗工时
  remaining: number          // 剩余工时
  overloadWarning: boolean   // 超载预警
}

// 用户状态
export interface UserState {
  energy: number     // 当前精力 0-100
  stress: number     // 压力水平 0-100
  focus: number      // 专注度 0-100
  mood: MoodType     // 心情状态
  lastUpdate: Date   // 最后更新时间
}

export enum MoodType {
  ENERGETIC = 'energetic',
  FOCUSED = 'focused',
  RELAXED = 'relaxed',
  STRESSED = 'stressed',
  TIRED = 'tired'
}

// 市场状态
export interface MarketStatus {
  isOpen: boolean           // 市场是否开放
  currentSession: string    // 当前交易时段
  nextImportantTime: Date   // 下一个重要时间点
  volatility: 'low' | 'medium' | 'high'  // 波动性
}

// What If 模拟结果
export interface SimulationResult {
  feasible: boolean
  conflicts: Conflict[]
  suggestions: Suggestion[]
  impactScore: number  // 影响评分 0-100
  alternativeSlots: TimeSlot[]
}

export interface TimeSlot {
  startTime: Date
  endTime: Date
  availability: number  // 可用度 0-100
  energyMatch: number   // 精力匹配度 0-100
}

export interface Suggestion {
  type: 'reschedule' | 'shorten' | 'split' | 'postpone'
  message: string
  confidence: number    // 信心度 0-100
  action?: () => void
}

export interface Reminder {
  id: string
  eventId: string
  type: ReminderType
  time: Date
  message: string
  isTriggered: boolean
}

export enum ReminderType {
  NOTIFICATION = 'notification',
  EMAIL = 'email',
  VOICE = 'voice'
}

// 事件冲突相关
export interface Conflict {
  id: string
  eventIds: string[]
  type: ConflictType
  severity: ConflictSeverity
  description: string
  suggestedResolutions: Resolution[]
}

export enum ConflictType {
  TIME_OVERLAP = 'time_overlap',
  LOCATION_CONFLICT = 'location_conflict',
  RESOURCE_CONFLICT = 'resource_conflict',
  ENERGY_CONFLICT = 'energy_conflict'
}

export enum ConflictSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Resolution {
  id: string
  type: ResolutionType
  description: string
  confidence: number
  impact: string[]
  action: () => void
}

export enum ResolutionType {
  RESCHEDULE = 'reschedule',
  SHORTEN = 'shorten',
  MOVE_LOCATION = 'move_location',
  CANCEL = 'cancel',
  SPLIT = 'split'
}
