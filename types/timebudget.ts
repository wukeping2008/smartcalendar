/**
 * Time Budget System Types
 * 精确工时预算系统类型定义
 * v4.1 核心功能
 */

/**
 * 时间预算类别
 */
export enum BudgetCategory {
  WORK = 'work',           // 工作
  MEETING = 'meeting',     // 会议
  BREAK = 'break',         // 休息
  LEARNING = 'learning',   // 学习
  PERSONAL = 'personal',   // 个人
  EXERCISE = 'exercise',   // 运动
  COMMUTE = 'commute',    // 通勤
  OTHER = 'other'         // 其他
}

/**
 * 时间预算
 */
export interface TimeBudget {
  id: string
  category: BudgetCategory
  name: string
  description?: string
  
  // 预算设置（秒为单位）
  budgets: {
    daily: number      // 每日预算
    weekly: number     // 每周预算
    monthly: number    // 每月预算
  }
  
  // 当前使用情况（秒为单位）
  usage: {
    today: number
    thisWeek: number
    thisMonth: number
    lastUpdated: Date
  }
  
  // 告警阈值（百分比）
  alerts: {
    warningThreshold: number  // 警告阈值（默认80%）
    criticalThreshold: number // 危急阈值（默认95%）
    enabled: boolean
  }
  
  // 统计数据
  stats: {
    averageDailyUsage: number
    efficiencyRate: number    // 效率评分 0-100
    overrunDays: number        // 超支天数
  }
  
  createdAt: Date
  updatedAt: Date
}

/**
 * 时间追踪器状态
 */
export enum TrackerStatus {
  IDLE = 'idle',           // 空闲
  RUNNING = 'running',     // 运行中
  PAUSED = 'paused',      // 暂停
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled'  // 已取消
}

/**
 * 时间追踪器
 */
export interface TimeTracker {
  id: string
  taskId: string
  taskName: string
  category: BudgetCategory
  
  // 时间记录
  startTime: Date
  endTime?: Date
  pausedAt?: Date
  resumedAt?: Date
  
  // 暂停记录
  pauseHistory: Array<{
    pausedAt: Date
    resumedAt?: Date
    duration: number  // 暂停时长（秒）
  }>
  
  // 状态
  status: TrackerStatus
  
  // 时长统计（秒）
  totalDuration: number      // 总时长
  activeDuration: number     // 活动时长（不含暂停）
  pausedDuration: number     // 暂停时长
  estimatedDuration?: number // 预估时长
  
  // 效率指标
  focusScore?: number        // 专注度评分 0-100
  completionRate?: number    // 完成度 0-100
  
  // 元数据
  tags?: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 时间银行交易类型
 */
export enum TimeBankTransactionType {
  SAVE = 'save',       // 存入
  BORROW = 'borrow',   // 借出
  EARN = 'earn',       // 赚取（通过高效率）
  SPEND = 'spend',     // 支出
  BONUS = 'bonus',     // 奖励
  PENALTY = 'penalty'  // 惩罚
}

/**
 * 时间银行交易
 */
export interface TimeBankTransaction {
  id: string
  type: TimeBankTransactionType
  amount: number        // 时间量（秒）
  balance: number       // 交易后余额
  description: string
  relatedTaskId?: string
  createdAt: Date
}

/**
 * 时间银行
 */
export interface TimeBank {
  id: string
  userId: string
  
  // 账户余额（秒）
  balance: {
    saved: number        // 节省的时间
    borrowed: number     // 借用的时间
    available: number    // 可用时间
  }
  
  // 效率积分
  efficiency: {
    score: number        // 当前积分
    level: number        // 等级
    nextLevelScore: number // 下一级所需积分
  }
  
  // 统计
  stats: {
    totalSaved: number   // 累计节省
    totalBorrowed: number // 累计借用
    totalEarned: number  // 累计赚取
    bestStreak: number   // 最佳连续天数
    currentStreak: number // 当前连续天数
  }
  
  // 交易历史
  transactions: TimeBankTransaction[]
  
  // 配置
  settings: {
    autoSave: boolean    // 自动存入节省的时间
    borrowLimit: number  // 借用上限
    interestRate: number // 利率（用于计算奖励）
  }
  
  createdAt: Date
  updatedAt: Date
}

/**
 * 时间预算报告
 */
export interface TimeBudgetReport {
  id: string
  period: {
    type: 'daily' | 'weekly' | 'monthly'
    startDate: Date
    endDate: Date
  }
  
  // 分类统计
  categories: Array<{
    category: BudgetCategory
    budgeted: number
    actual: number
    variance: number      // 差异
    variancePercent: number
  }>
  
  // 总体统计
  summary: {
    totalBudgeted: number
    totalActual: number
    totalVariance: number
    efficiencyScore: number
    overrunCategories: string[]
    underutilizedCategories: string[]
  }
  
  // 洞察建议
  insights: Array<{
    type: 'warning' | 'suggestion' | 'achievement'
    message: string
    category?: BudgetCategory
    actionable?: {
      action: string
      params?: any
    }
  }>
  
  // 趋势数据
  trends: {
    dailyUsage: Array<{
      date: Date
      usage: number
    }>
    categoryDistribution: Array<{
      category: BudgetCategory
      percentage: number
    }>
  }
  
  generatedAt: Date
}

/**
 * 预算告警
 */
export interface BudgetAlert {
  id: string
  budgetId: string
  category: BudgetCategory
  type: 'warning' | 'critical' | 'overrun'
  
  current: {
    usage: number
    budget: number
    percentage: number
  }
  
  message: string
  suggestion?: string
  
  acknowledged: boolean
  acknowledgedAt?: Date
  
  createdAt: Date
}

/**
 * 时间预算配置
 */
export interface TimeBudgetConfig {
  // 默认预算（秒）
  defaultBudgets: Record<BudgetCategory, {
    daily: number
    weekly: number
    monthly: number
  }>
  
  // 告警设置
  alertSettings: {
    enabled: boolean
    warningThreshold: number
    criticalThreshold: number
    notificationChannels: ('app' | 'email' | 'sms')[]
  }
  
  // 时间银行设置
  timeBankSettings: {
    enabled: boolean
    autoSave: boolean
    borrowLimit: number
    interestRate: number
    bonusRules: Array<{
      condition: string
      bonus: number
    }>
  }
  
  // 报告设置
  reportSettings: {
    autoGenerate: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    emailReport: boolean
  }
  
  // UI设置
  uiSettings: {
    showTimer: boolean
    showProgressBar: boolean
    compactMode: boolean
    theme: 'light' | 'dark' | 'auto'
  }
}

/**
 * 实时计时器状态
 */
export interface TimerState {
  trackerId?: string
  isRunning: boolean
  isPaused: boolean
  
  elapsed: {
    total: number      // 总经过时间
    active: number     // 活动时间
    paused: number     // 暂停时间
  }
  
  display: {
    hours: number
    minutes: number
    seconds: number
    formatted: string  // HH:MM:SS
  }
  
  category?: BudgetCategory
  taskName?: string
  
  lastTick: Date
}