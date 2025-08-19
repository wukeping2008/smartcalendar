/**
 * Inbox 收集箱系统类型定义
 * GTD (Getting Things Done) 任务管理
 * v4.0 核心功能
 */

// ============ 任务基础类型 ============

/**
 * 任务状态
 */
export enum TaskStatus {
  INBOX = 'inbox',           // 收集箱（未处理）
  PROCESSING = 'processing', // 处理中
  ACTIONABLE = 'actionable', // 可执行
  SCHEDULED = 'scheduled',   // 已安排
  DELEGATED = 'delegated',   // 已委派
  WAITING = 'waiting',       // 等待中
  SOMEDAY = 'someday',       // 将来某天
  REFERENCE = 'reference',   // 参考资料
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
  TRASH = 'trash'           // 垃圾箱
}

/**
 * 任务优先级
 */
export enum TaskPriority {
  URGENT = 'urgent',     // 紧急
  HIGH = 'high',        // 高
  MEDIUM = 'medium',    // 中
  LOW = 'low',         // 低
  NONE = 'none'        // 无
}

/**
 * 任务类型
 */
export enum TaskType {
  TASK = 'task',               // 任务
  PROJECT = 'project',         // 项目
  HABIT = 'habit',            // 习惯
  ROUTINE = 'routine',        // 例程
  APPOINTMENT = 'appointment', // 约会
  IDEA = 'idea',              // 想法
  NOTE = 'note',              // 笔记
  CHECKLIST = 'checklist'     // 清单
}

/**
 * 任务来源
 */
export enum TaskSource {
  MANUAL = 'manual',           // 手动输入
  VOICE = 'voice',            // 语音输入
  EMAIL = 'email',            // 邮件
  CALENDAR = 'calendar',      // 日历
  CHAT = 'chat',             // 聊天消息
  SCAN = 'scan',             // 扫描文档
  WEB = 'web',               // 网页剪藏
  API = 'api',               // API接口
  AUTO = 'auto'              // 自动生成
}

// ============ 收集箱项目 ============

/**
 * 收集箱项目
 */
export interface InboxItem {
  id: string
  title: string
  description?: string
  
  // 基础属性
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  source: TaskSource
  
  // 时间相关
  capturedAt: Date          // 捕获时间
  processedAt?: Date        // 处理时间
  scheduledFor?: Date       // 安排时间
  dueDate?: Date           // 截止时间
  completedAt?: Date       // 完成时间
  
  // 分类标签
  tags: string[]
  category?: string
  context?: string[]        // GTD上下文 (@home, @office, @computer, @phone)
  
  // 关联信息
  projectId?: string        // 所属项目
  parentId?: string         // 父任务
  relatedIds?: string[]     // 相关任务
  
  // 附件和资源
  attachments?: Attachment[]
  links?: string[]
  
  // 原始数据
  rawContent?: string       // 原始输入内容
  metadata?: Record<string, any>
  
  // 处理信息
  processingNotes?: string
  delegatedTo?: string      // 委派给谁
  waitingFor?: string       // 等待什么
  
  // 智能分析
  analysis?: TaskAnalysis
  suggestions?: TaskSuggestion[]
}

/**
 * 附件
 */
export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: Date
}

// ============ 智能分析 ============

/**
 * 任务分析结果
 */
export interface TaskAnalysis {
  // 时间估算
  estimatedDuration: number     // 预估时长（分钟）
  actualDuration?: number        // 实际时长（分钟）
  complexity: 'simple' | 'moderate' | 'complex'
  
  // 分类建议
  suggestedCategory: string
  suggestedTags: string[]
  suggestedContext: string[]
  suggestedPriority: TaskPriority
  
  // GTD判断
  is2MinuteTask: boolean        // 是否2分钟任务
  requiresOthers: boolean        // 是否需要他人
  hasDeadline: boolean          // 是否有截止日期
  isProject: boolean            // 是否是项目
  
  // 智能识别
  extractedDates: Date[]        // 提取的日期
  extractedPeople: string[]     // 提取的人名
  extractedLocations: string[]  // 提取的地点
  keywords: string[]            // 关键词
  
  // 情感分析
  sentiment?: 'positive' | 'neutral' | 'negative'
  urgency?: number              // 紧急度 0-100
  importance?: number           // 重要度 0-100
}

/**
 * 任务建议
 */
export interface TaskSuggestion {
  type: 'action' | 'schedule' | 'delegate' | 'defer' | 'delete'
  reason: string
  confidence: number // 0-1
  details?: any
}

// ============ 分流规则 ============

/**
 * 分流规则
 */
export interface TriageRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  priority: number
  
  // 匹配条件
  conditions: TriageCondition[]
  conditionLogic: 'AND' | 'OR' | 'CUSTOM'
  
  // 分流动作
  action: TriageAction
  
  // 统计
  stats: {
    matchCount: number
    successRate: number
    lastMatched?: Date
  }
}

/**
 * 分流条件
 */
export interface TriageCondition {
  field: keyof InboxItem | string // 支持嵌套路径
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'greaterThan' | 'lessThan'
  value: any
}

/**
 * 分流动作
 */
export interface TriageAction {
  type: 'categorize' | 'prioritize' | 'schedule' | 'delegate' | 'archive' | 'delete'
  params: Record<string, any>
}

/**
 * 分流结果
 */
export interface TriageResult {
  itemId: string
  originalStatus: TaskStatus
  newStatus: TaskStatus
  category: TriageCategory
  action: RecommendedAction
  confidence: number
  reasoning: string
  appliedRules: string[]
}

/**
 * 分流分类
 */
export enum TriageCategory {
  DO_NOW = 'do_now',           // 立即执行（2分钟内）
  SCHEDULE = 'schedule',        // 安排时间
  DELEGATE = 'delegate',        // 委派他人
  DEFER = 'defer',             // 推迟处理
  PROJECT = 'project',         // 项目分解
  WAITING = 'waiting',         // 等待
  SOMEDAY = 'someday',         // 将来某天
  REFERENCE = 'reference',     // 参考资料
  TRASH = 'trash'             // 垃圾
}

/**
 * 推荐动作
 */
export interface RecommendedAction {
  type: string
  label: string
  description?: string
  params?: Record<string, any>
  autoExecute?: boolean
}

// ============ 见缝插针调度 ============

/**
 * 时间空隙
 */
export interface TimeGap {
  id: string
  start: Date
  end: Date
  duration: number // 分钟
  
  // 空隙属性
  type: 'between_events' | 'buffer' | 'break' | 'commute' | 'waiting'
  quality: 'high' | 'medium' | 'low' // 质量（能否专注工作）
  
  // 上下文
  location?: string
  beforeEvent?: string
  afterEvent?: string
  
  // 适合的任务类型
  suitableFor: TaskType[]
  maxComplexity: 'simple' | 'moderate' | 'complex'
}

/**
 * 见缝插针分配
 */
export interface OpportunisticAssignment {
  gapId: string
  taskId: string
  
  // 匹配信息
  fitScore: number // 0-100 适配度
  estimatedCompletion: number // 预计完成百分比
  
  // 执行建议
  suggestion: string
  preparationTime?: number // 需要的准备时间
  cleanupTime?: number // 需要的收尾时间
  
  // 风险评估
  riskLevel: 'low' | 'medium' | 'high'
  riskFactors?: string[]
}

// ============ GTD 系统 ============

/**
 * GTD 清单
 */
export interface GTDList {
  id: string
  name: string
  type: 'next_actions' | 'projects' | 'waiting_for' | 'someday_maybe' | 'reference'
  items: string[] // 任务ID列表
  
  // 配置
  settings: {
    autoArchive?: boolean
    reviewFrequency?: 'daily' | 'weekly' | 'monthly'
    sortOrder?: 'priority' | 'date' | 'manual'
  }
  
  // 统计
  stats: {
    totalItems: number
    completedToday: number
    completedThisWeek: number
    averageCompletionTime?: number
  }
}

/**
 * 周回顾
 */
export interface WeeklyReview {
  id: string
  weekNumber: number
  year: number
  reviewDate: Date
  
  // 收集
  captured: {
    totalItems: number
    sources: Record<TaskSource, number>
  }
  
  // 处理
  processed: {
    totalItems: number
    categories: Record<TriageCategory, number>
  }
  
  // 完成
  completed: {
    tasks: number
    projects: number
    totalTime: number // 分钟
  }
  
  // 待处理
  pending: {
    inbox: number
    nextActions: number
    waitingFor: number
    projects: number
  }
  
  // 反思
  reflection?: {
    wins: string[]
    challenges: string[]
    improvements: string[]
    nextWeekFocus: string[]
  }
  
  // 评分
  score?: {
    productivity: number // 0-100
    organization: number // 0-100
    satisfaction: number // 0-100
  }
}

// ============ 服务接口 ============

/**
 * 收集箱服务配置
 */
export interface InboxConfig {
  // 自动处理
  autoTriage: boolean
  autoSchedule: boolean
  autoDelegate: boolean
  
  // 分流规则
  triageRules: TriageRule[]
  customCategories: string[]
  
  // 时间设置
  twoMinuteThreshold: number // 秒
  reviewReminder: 'daily' | 'weekly' | 'never'
  
  // 见缝插针
  opportunistic: {
    enabled: boolean
    minGapDuration: number // 最小空隙时长（分钟）
    maxTaskComplexity: 'simple' | 'moderate' | 'complex'
    preferredContexts: string[]
  }
  
  // 智能功能
  ai: {
    enableAnalysis: boolean
    enableSuggestions: boolean
    enableAutoTagging: boolean
    enableNLP: boolean
  }
}

/**
 * 批量操作
 */
export interface BulkOperation {
  type: 'move' | 'tag' | 'prioritize' | 'schedule' | 'delete'
  itemIds: string[]
  params: Record<string, any>
  
  // 执行结果
  result?: {
    successful: string[]
    failed: Array<{ id: string; error: string }>
    totalTime: number
  }
}

/**
 * 收集箱统计
 */
export interface InboxStats {
  // 数量统计
  total: number
  byStatus: Record<TaskStatus, number>
  byPriority: Record<TaskPriority, number>
  byType: Record<TaskType, number>
  bySource: Record<TaskSource, number>
  
  // 时间统计
  oldestItem?: Date
  averageProcessingTime: number // 平均处理时间（小时）
  
  // 效率指标
  captureRate: number // 每日捕获数量
  processingRate: number // 每日处理数量
  completionRate: number // 完成率
  
  // 趋势
  trend: {
    daily: Array<{ date: Date; captured: number; processed: number; completed: number }>
    weekly: Array<{ week: number; captured: number; processed: number; completed: number }>
  }
}