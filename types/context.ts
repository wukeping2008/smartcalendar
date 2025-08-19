/**
 * Context-SOP 情境感知系统类型定义
 * v4.0 核心功能
 */

// ============ 情境维度定义 ============

/**
 * 时间情境
 */
export interface TimeContext {
  currentTime: Date
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'dawn'
  dayOfWeek: number // 0-6, 0为周日
  isWeekend: boolean
  isHoliday: boolean
  isWorkingHour: boolean
  nearEvents: Array<{
    eventId: string
    eventTitle: string
    minutesUntil: number
    type: 'before' | 'after'
  }>
}

/**
 * 地点情境
 */
export interface LocationContext {
  isLocationEnabled: boolean
  currentLocation?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  currentPlace?: {
    type: 'home' | 'office' | 'transit' | 'hotel' | 'airport' | 'gym' | 'restaurant' | 'other'
    name: string
    address?: string
  }
  geofences: Array<{
    id: string
    name: string
    isInside: boolean
    distance: number // 米
  }>
}

/**
 * 人物情境
 */
export interface PersonContext {
  nearbyPeople: string[] // 人物ID列表
  scheduledMeetings: Array<{
    personId: string
    personName: string
    meetingTime: Date
    meetingType: 'physical' | 'virtual'
  }>
  recentInteractions: Array<{
    personId: string
    lastInteraction: Date
    interactionType: 'meeting' | 'call' | 'message' | 'email'
  }>
}

/**
 * 事件情境
 */
export interface EventContext {
  currentActivity?: {
    eventId: string
    type: string
    startTime: Date
    progress: number // 0-100
  }
  upcomingEvents: Array<{
    eventId: string
    title: string
    startTime: Date
    priority: string
  }>
  completedToday: number
  pendingTasks: number
}

/**
 * 设备状态
 */
export interface DeviceContext {
  platform: 'web' | 'mobile' | 'desktop'
  batteryLevel?: number
  isCharging?: boolean
  networkType: 'wifi' | 'cellular' | 'offline'
  screenTime: number // 今日屏幕时间（分钟）
  activeApps?: string[]
}

/**
 * 生理状态
 */
export interface PhysiologyContext {
  energyLevel: 'peak' | 'high' | 'medium' | 'low' | 'exhausted'
  lastMealTime?: Date
  sleepQuality?: 'good' | 'fair' | 'poor'
  sleepDuration?: number // 小时
  stressLevel?: 'low' | 'medium' | 'high'
  heartRate?: number
  steps?: number
}

/**
 * 心理状态
 */
export interface PsychologyContext {
  mood?: 'happy' | 'neutral' | 'stressed' | 'tired' | 'focused' | 'anxious'
  focusLevel: 'deep' | 'normal' | 'distracted'
  motivationLevel: 'high' | 'medium' | 'low'
  cognitiveLoad: 'light' | 'moderate' | 'heavy'
}

/**
 * 任务队列情境
 */
export interface TaskQueueContext {
  totalTasks: number
  urgentTasks: number
  overdueTasks: number
  estimatedWorkload: number // 预计工作量（分钟）
  completionRate: number // 今日完成率 0-100
  taskCategories: Record<string, number>
}

/**
 * 外部数据情境
 */
export interface ExternalDataContext {
  weather?: {
    condition: string
    temperature: number
    humidity: number
    willRain: boolean
  }
  marketStatus?: {
    isMarketOpen: boolean
    volatilityIndex: number
    tradingVolume: 'high' | 'normal' | 'low'
  }
  traffic?: {
    congestionLevel: 'smooth' | 'moderate' | 'heavy'
    estimatedCommute: number // 分钟
  }
}

/**
 * 完整情境定义
 */
export interface Context {
  id: string
  timestamp: Date
  time: TimeContext
  location: LocationContext
  person: PersonContext
  event: EventContext
  device: DeviceContext
  physiology: PhysiologyContext
  psychology: PsychologyContext
  taskQueue: TaskQueueContext
  externalData: ExternalDataContext
  
  // 情境评分
  score: {
    productivity: number // 0-100
    energy: number // 0-100
    focus: number // 0-100
    stress: number // 0-100
  }
  
  // 情境标签
  tags: string[]
  
  // 自定义属性
  custom?: Record<string, any>
}

// ============ 情境规则定义 ============

/**
 * 情境条件
 */
export interface ContextCondition {
  field: string // 使用点号路径，如 "time.timeOfDay"
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'regex'
  value: any
  weight?: number // 权重，用于多条件匹配
}

/**
 * 情境规则
 */
export interface ContextRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  priority: number // 优先级，数字越大优先级越高
  
  // 触发条件
  conditions: ContextCondition[]
  conditionLogic: 'AND' | 'OR' | 'CUSTOM'
  customLogic?: string // 自定义逻辑表达式
  
  // 触发动作
  actions: ContextAction[]
  
  // 限制条件
  constraints?: {
    maxTriggersPerDay?: number
    cooldownMinutes?: number
    allowedDays?: number[] // 0-6
    allowedHours?: Array<{ start: number; end: number }>
    requiredConfirmation?: boolean
  }
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  lastTriggered?: Date
  triggerCount: number
}

/**
 * 情境动作
 */
export interface ContextAction {
  type: 'trigger_sop' | 'send_notification' | 'adjust_schedule' | 'suggest_task' | 'change_mode' | 'custom'
  payload: any
  delay?: number // 延迟执行（秒）
}

/**
 * 情境匹配结果
 */
export interface ContextMatch {
  rule: ContextRule
  matchScore: number // 0-1
  matchedConditions: string[]
  suggestedActions: ContextAction[]
  confidence: number // 0-1
  explanation?: string
}

/**
 * 情境历史记录
 */
export interface ContextHistory {
  id: string
  context: Context
  matchedRules: ContextMatch[]
  executedActions: ContextAction[]
  timestamp: Date
  feedback?: {
    helpful: boolean
    rating?: number
    comment?: string
  }
}

/**
 * 情境预测
 */
export interface ContextPrediction {
  futureContext: Partial<Context>
  predictedTime: Date
  confidence: number
  basedOn: string[] // 基于哪些因素预测
  suggestedPreparations: string[]
}

// ============ 情境服务接口 ============

/**
 * 情境监听器
 */
export interface ContextListener {
  id: string
  name: string
  filter?: Partial<Context>
  callback: (context: Context, matches: ContextMatch[]) => void
}

/**
 * 情境提供者
 */
export interface ContextProvider {
  name: string
  type: keyof Context
  getData: () => Promise<any>
  refreshInterval?: number // 毫秒
}

/**
 * 情境配置
 */
export interface ContextConfig {
  enabledProviders: string[]
  updateInterval: number // 情境更新间隔（毫秒）
  storageLimit: number // 历史记录保存数量
  enablePrediction: boolean
  enableLearning: boolean
  privacyMode: boolean // 隐私模式，限制某些数据收集
}