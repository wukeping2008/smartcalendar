/**
 * Time Budget Service - 精确工时预算服务
 * v4.1 核心功能
 */

import {
  TimeBudget,
  TimeTracker,
  TimeBank,
  BudgetCategory,
  TrackerStatus,
  TimeBankTransactionType,
  TimeBankTransaction,
  TimeBudgetReport,
  BudgetAlert,
  TimeBudgetConfig,
  TimerState
} from '../../types/timebudget'
import { StorageService } from './SimpleStorageService'

/**
 * 时间预算服务
 */
export class TimeBudgetService {
  private static instance: TimeBudgetService
  
  private budgets: Map<string, TimeBudget> = new Map()
  private trackers: Map<string, TimeTracker> = new Map()
  private activeTracker: TimeTracker | null = null
  private timeBank: TimeBank | null = null
  private alerts: Map<string, BudgetAlert> = new Map()
  
  private storageService: StorageService
  private timerInterval: NodeJS.Timeout | null = null
  private timerState: TimerState = {
    isRunning: false,
    isPaused: false,
    elapsed: { total: 0, active: 0, paused: 0 },
    display: { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' },
    lastTick: new Date()
  }
  
  private config: TimeBudgetConfig = {
    defaultBudgets: {
      [BudgetCategory.WORK]: { daily: 8 * 3600, weekly: 40 * 3600, monthly: 160 * 3600 },
      [BudgetCategory.MEETING]: { daily: 2 * 3600, weekly: 10 * 3600, monthly: 40 * 3600 },
      [BudgetCategory.BREAK]: { daily: 1.5 * 3600, weekly: 7.5 * 3600, monthly: 30 * 3600 },
      [BudgetCategory.LEARNING]: { daily: 1 * 3600, weekly: 5 * 3600, monthly: 20 * 3600 },
      [BudgetCategory.PERSONAL]: { daily: 2 * 3600, weekly: 14 * 3600, monthly: 60 * 3600 },
      [BudgetCategory.EXERCISE]: { daily: 0.5 * 3600, weekly: 3.5 * 3600, monthly: 15 * 3600 },
      [BudgetCategory.COMMUTE]: { daily: 1 * 3600, weekly: 5 * 3600, monthly: 20 * 3600 },
      [BudgetCategory.OTHER]: { daily: 1 * 3600, weekly: 7 * 3600, monthly: 30 * 3600 }
    },
    alertSettings: {
      enabled: true,
      warningThreshold: 80,
      criticalThreshold: 95,
      notificationChannels: ['app']
    },
    timeBankSettings: {
      enabled: true,
      autoSave: true,
      borrowLimit: 7200, // 2小时
      interestRate: 0.05,
      bonusRules: [
        { condition: 'efficiency > 90', bonus: 600 },
        { condition: 'streak > 7', bonus: 1800 }
      ]
    },
    reportSettings: {
      autoGenerate: true,
      frequency: 'daily',
      emailReport: false
    },
    uiSettings: {
      showTimer: true,
      showProgressBar: true,
      compactMode: false,
      theme: 'auto'
    }
  }
  
  private constructor() {
    this.storageService = new StorageService()
    this.initialize()
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): TimeBudgetService {
    if (!TimeBudgetService.instance) {
      TimeBudgetService.instance = new TimeBudgetService()
    }
    return TimeBudgetService.instance
  }
  
  /**
   * 初始化
   */
  private async initialize() {
    await this.loadBudgets()
    await this.loadTimeBank()
    await this.restoreActiveTracker()
    this.setupDefaultBudgets()
    console.log('⏱️ Time Budget Service initialized')
  }
  
  /**
   * 设置默认预算
   */
  private setupDefaultBudgets() {
    Object.entries(this.config.defaultBudgets).forEach(([category, budgets]) => {
      const id = `budget_${category}`
      if (!this.budgets.has(id)) {
        const budget: TimeBudget = {
          id,
          category: category as BudgetCategory,
          name: this.getCategoryName(category as BudgetCategory),
          budgets,
          usage: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0,
            lastUpdated: new Date()
          },
          alerts: {
            warningThreshold: this.config.alertSettings.warningThreshold,
            criticalThreshold: this.config.alertSettings.criticalThreshold,
            enabled: true
          },
          stats: {
            averageDailyUsage: 0,
            efficiencyRate: 100,
            overrunDays: 0
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.budgets.set(id, budget)
      }
    })
  }
  
  /**
   * 开始追踪
   */
  public async startTracking(
    taskId: string,
    taskName: string,
    category: BudgetCategory,
    estimatedDuration?: number
  ): Promise<TimeTracker> {
    // 如果有正在运行的追踪器，先暂停
    if (this.activeTracker && this.activeTracker.status === TrackerStatus.RUNNING) {
      await this.pauseTracking(this.activeTracker.id)
    }
    
    const tracker: TimeTracker = {
      id: this.generateTrackerId(),
      taskId,
      taskName,
      category,
      startTime: new Date(),
      pauseHistory: [],
      status: TrackerStatus.RUNNING,
      totalDuration: 0,
      activeDuration: 0,
      pausedDuration: 0,
      estimatedDuration,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.trackers.set(tracker.id, tracker)
    this.activeTracker = tracker
    
    // 启动计时器
    this.startTimer(tracker)
    
    // 保存状态
    await this.saveTrackers()
    
    console.log(`⏱️ Started tracking: ${taskName} (${category})`)
    return tracker
  }
  
  /**
   * 暂停追踪
   */
  public async pauseTracking(trackerId: string): Promise<TimeTracker | null> {
    const tracker = this.trackers.get(trackerId)
    if (!tracker || tracker.status !== TrackerStatus.RUNNING) {
      return null
    }
    
    tracker.status = TrackerStatus.PAUSED
    tracker.pausedAt = new Date()
    tracker.updatedAt = new Date()
    
    // 停止计时器
    this.stopTimer()
    
    // 更新时长
    this.updateTrackerDuration(tracker)
    
    await this.saveTrackers()
    
    console.log(`⏸️ Paused tracking: ${tracker.taskName}`)
    return tracker
  }
  
  /**
   * 恢复追踪
   */
  public async resumeTracking(trackerId: string): Promise<TimeTracker | null> {
    const tracker = this.trackers.get(trackerId)
    if (!tracker || tracker.status !== TrackerStatus.PAUSED) {
      return null
    }
    
    // 记录暂停历史
    if (tracker.pausedAt) {
      const pauseDuration = Math.floor((new Date().getTime() - tracker.pausedAt.getTime()) / 1000)
      tracker.pauseHistory.push({
        pausedAt: tracker.pausedAt,
        resumedAt: new Date(),
        duration: pauseDuration
      })
      tracker.pausedDuration += pauseDuration
    }
    
    tracker.status = TrackerStatus.RUNNING
    tracker.resumedAt = new Date()
    tracker.pausedAt = undefined
    tracker.updatedAt = new Date()
    
    this.activeTracker = tracker
    
    // 重启计时器
    this.startTimer(tracker)
    
    await this.saveTrackers()
    
    console.log(`▶️ Resumed tracking: ${tracker.taskName}`)
    return tracker
  }
  
  /**
   * 停止追踪
   */
  public async stopTracking(trackerId: string): Promise<TimeTracker | null> {
    const tracker = this.trackers.get(trackerId)
    if (!tracker || tracker.status === TrackerStatus.COMPLETED) {
      return null
    }
    
    tracker.status = TrackerStatus.COMPLETED
    tracker.endTime = new Date()
    tracker.updatedAt = new Date()
    
    // 停止计时器
    this.stopTimer()
    
    // 最终更新时长
    this.updateTrackerDuration(tracker)
    
    // 计算效率评分
    if (tracker.estimatedDuration) {
      tracker.completionRate = Math.min(100, (tracker.estimatedDuration / tracker.activeDuration) * 100)
    }
    
    // 更新预算使用情况
    await this.updateBudgetUsage(tracker.category, tracker.activeDuration)
    
    // 更新时间银行
    if (this.config.timeBankSettings.enabled && tracker.estimatedDuration) {
      const savedTime = Math.max(0, tracker.estimatedDuration - tracker.activeDuration)
      if (savedTime > 0) {
        await this.addToTimeBank(savedTime, TimeBankTransactionType.SAVE, `节省时间 - ${tracker.taskName}`)
      }
    }
    
    // 清除活动追踪器
    if (this.activeTracker?.id === trackerId) {
      this.activeTracker = null
    }
    
    await this.saveTrackers()
    
    console.log(`⏹️ Stopped tracking: ${tracker.taskName} (Duration: ${this.formatDuration(tracker.activeDuration)})`)
    return tracker
  }
  
  /**
   * 取消追踪
   */
  public async cancelTracking(trackerId: string): Promise<boolean> {
    const tracker = this.trackers.get(trackerId)
    if (!tracker || tracker.status === TrackerStatus.COMPLETED) {
      return false
    }
    
    tracker.status = TrackerStatus.CANCELLED
    tracker.updatedAt = new Date()
    
    // 停止计时器
    if (this.activeTracker?.id === trackerId) {
      this.stopTimer()
      this.activeTracker = null
    }
    
    await this.saveTrackers()
    
    console.log(`❌ Cancelled tracking: ${tracker.taskName}`)
    return true
  }
  
  /**
   * 获取当前计时器状态
   */
  public getTimerState(): TimerState {
    return { ...this.timerState }
  }
  
  /**
   * 启动计时器
   */
  private startTimer(tracker: TimeTracker) {
    this.stopTimer() // 确保没有重复的计时器
    
    this.timerState = {
      trackerId: tracker.id,
      isRunning: true,
      isPaused: false,
      elapsed: {
        total: tracker.totalDuration,
        active: tracker.activeDuration,
        paused: tracker.pausedDuration
      },
      display: this.formatDurationDisplay(tracker.activeDuration),
      category: tracker.category,
      taskName: tracker.taskName,
      lastTick: new Date()
    }
    
    // 每秒更新一次
    this.timerInterval = setInterval(() => {
      if (this.timerState.isRunning && !this.timerState.isPaused) {
        this.timerState.elapsed.active++
        this.timerState.elapsed.total++
        this.timerState.display = this.formatDurationDisplay(this.timerState.elapsed.active)
        this.timerState.lastTick = new Date()
        
        // 检查预算告警
        if (this.timerState.elapsed.active % 60 === 0) { // 每分钟检查一次
          this.checkBudgetAlerts(tracker.category)
        }
      }
    }, 1000)
  }
  
  /**
   * 停止计时器
   */
  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
    
    this.timerState.isRunning = false
  }
  
  /**
   * 更新追踪器时长
   */
  private updateTrackerDuration(tracker: TimeTracker) {
    const now = new Date()
    const startTime = tracker.startTime.getTime()
    const endTime = (tracker.endTime || now).getTime()
    
    tracker.totalDuration = Math.floor((endTime - startTime) / 1000)
    tracker.activeDuration = tracker.totalDuration - tracker.pausedDuration
  }
  
  /**
   * 格式化时长显示
   */
  private formatDurationDisplay(seconds: number): {
    hours: number
    minutes: number
    seconds: number
    formatted: string
  } {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return {
      hours,
      minutes,
      seconds: secs,
      formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
  }
  
  /**
   * 格式化时长
   */
  private formatDuration(seconds: number): string {
    const display = this.formatDurationDisplay(seconds)
    return display.formatted
  }
  
  /**
   * 更新预算使用情况
   */
  private async updateBudgetUsage(category: BudgetCategory, duration: number) {
    const budgetId = `budget_${category}`
    const budget = this.budgets.get(budgetId)
    
    if (!budget) return
    
    // 更新使用量
    budget.usage.today += duration
    budget.usage.thisWeek += duration
    budget.usage.thisMonth += duration
    budget.usage.lastUpdated = new Date()
    
    // 更新统计
    budget.stats.averageDailyUsage = Math.round(budget.usage.thisMonth / 30)
    budget.stats.efficiencyRate = Math.min(100, Math.round((budget.budgets.daily / budget.usage.today) * 100))
    
    if (budget.usage.today > budget.budgets.daily) {
      budget.stats.overrunDays++
    }
    
    budget.updatedAt = new Date()
    
    await this.saveBudgets()
    
    // 检查告警
    this.checkBudgetAlerts(category)
  }
  
  /**
   * 检查预算告警
   */
  private async checkBudgetAlerts(category: BudgetCategory) {
    const budgetId = `budget_${category}`
    const budget = this.budgets.get(budgetId)
    
    if (!budget || !budget.alerts.enabled) return
    
    const usagePercent = (budget.usage.today / budget.budgets.daily) * 100
    
    if (usagePercent >= 100) {
      await this.createAlert(budget, 'overrun', usagePercent)
    } else if (usagePercent >= budget.alerts.criticalThreshold) {
      await this.createAlert(budget, 'critical', usagePercent)
    } else if (usagePercent >= budget.alerts.warningThreshold) {
      await this.createAlert(budget, 'warning', usagePercent)
    }
  }
  
  /**
   * 创建告警
   */
  private async createAlert(
    budget: TimeBudget,
    type: 'warning' | 'critical' | 'overrun',
    usagePercent: number
  ) {
    const alertId = `alert_${budget.id}_${type}_${new Date().toISOString()}`
    
    // 检查是否已有同类型未确认的告警
    const existingAlert = Array.from(this.alerts.values()).find(
      a => a.budgetId === budget.id && a.type === type && !a.acknowledged
    )
    
    if (existingAlert) return
    
    const alert: BudgetAlert = {
      id: alertId,
      budgetId: budget.id,
      category: budget.category,
      type,
      current: {
        usage: budget.usage.today,
        budget: budget.budgets.daily,
        percentage: usagePercent
      },
      message: this.getAlertMessage(type, budget.name, usagePercent),
      suggestion: this.getAlertSuggestion(type, budget.category),
      acknowledged: false,
      createdAt: new Date()
    }
    
    this.alerts.set(alertId, alert)
    
    console.log(`⚠️ Budget Alert [${type}]: ${alert.message}`)
    
    // TODO: 发送通知
  }
  
  /**
   * 获取告警消息
   */
  private getAlertMessage(type: string, categoryName: string, percent: number): string {
    switch (type) {
      case 'warning':
        return `${categoryName}时间使用已达${Math.round(percent)}%，请注意控制`
      case 'critical':
        return `${categoryName}时间即将用完！已使用${Math.round(percent)}%`
      case 'overrun':
        return `${categoryName}时间已超支${Math.round(percent - 100)}%！`
      default:
        return `${categoryName}时间使用${Math.round(percent)}%`
    }
  }
  
  /**
   * 获取告警建议
   */
  private getAlertSuggestion(type: string, category: BudgetCategory): string {
    switch (type) {
      case 'warning':
        return '建议合理安排剩余时间，避免超支'
      case 'critical':
        return '建议立即调整计划，推迟非紧急任务'
      case 'overrun':
        return '建议从时间银行借用时间，或调整明日计划'
      default:
        return '请关注时间使用情况'
    }
  }
  
  /**
   * 初始化时间银行
   */
  private async initializeTimeBank(): Promise<TimeBank> {
    const timeBank: TimeBank = {
      id: 'timebank_default',
      userId: 'current_user',
      balance: {
        saved: 0,
        borrowed: 0,
        available: 0
      },
      efficiency: {
        score: 0,
        level: 1,
        nextLevelScore: 100
      },
      stats: {
        totalSaved: 0,
        totalBorrowed: 0,
        totalEarned: 0,
        bestStreak: 0,
        currentStreak: 0
      },
      transactions: [],
      settings: {
        autoSave: this.config.timeBankSettings.autoSave,
        borrowLimit: this.config.timeBankSettings.borrowLimit,
        interestRate: this.config.timeBankSettings.interestRate
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.timeBank = timeBank
    await this.saveTimeBank()
    
    return timeBank
  }
  
  /**
   * 添加到时间银行
   */
  public async addToTimeBank(
    amount: number,
    type: TimeBankTransactionType,
    description: string,
    relatedTaskId?: string
  ): Promise<TimeBankTransaction> {
    if (!this.timeBank) {
      await this.initializeTimeBank()
    }
    
    const transaction: TimeBankTransaction = {
      id: this.generateTransactionId(),
      type,
      amount,
      balance: 0,
      description,
      relatedTaskId,
      createdAt: new Date()
    }
    
    // 更新余额
    switch (type) {
      case TimeBankTransactionType.SAVE:
      case TimeBankTransactionType.EARN:
      case TimeBankTransactionType.BONUS:
        this.timeBank!.balance.saved += amount
        this.timeBank!.stats.totalSaved += amount
        break
      case TimeBankTransactionType.BORROW:
      case TimeBankTransactionType.SPEND:
        this.timeBank!.balance.borrowed += amount
        this.timeBank!.stats.totalBorrowed += amount
        break
      case TimeBankTransactionType.PENALTY:
        this.timeBank!.balance.saved = Math.max(0, this.timeBank!.balance.saved - amount)
        break
    }
    
    this.timeBank!.balance.available = this.timeBank!.balance.saved - this.timeBank!.balance.borrowed
    transaction.balance = this.timeBank!.balance.available
    
    // 更新效率积分
    if (type === TimeBankTransactionType.SAVE || type === TimeBankTransactionType.EARN) {
      this.timeBank!.efficiency.score += Math.floor(amount / 60) // 每分钟1分
      
      // 检查升级
      while (this.timeBank!.efficiency.score >= this.timeBank!.efficiency.nextLevelScore) {
        this.timeBank!.efficiency.level++
        this.timeBank!.efficiency.nextLevelScore = this.timeBank!.efficiency.level * 100
      }
    }
    
    // 添加交易记录
    this.timeBank!.transactions.unshift(transaction)
    if (this.timeBank!.transactions.length > 100) {
      this.timeBank!.transactions = this.timeBank!.transactions.slice(0, 100)
    }
    
    this.timeBank!.updatedAt = new Date()
    
    await this.saveTimeBank()
    
    console.log(`💰 Time Bank: ${type} ${this.formatDuration(amount)} - ${description}`)
    
    return transaction
  }
  
  /**
   * 获取时间银行
   */
  public getTimeBank(): TimeBank | null {
    return this.timeBank
  }
  
  /**
   * 获取所有预算
   */
  public getAllBudgets(): TimeBudget[] {
    return Array.from(this.budgets.values())
  }
  
  /**
   * 获取预算状态
   */
  public getBudgetStatus(category: BudgetCategory): {
    budget: TimeBudget | null
    usagePercent: number
    remaining: number
    status: 'normal' | 'warning' | 'critical' | 'overrun'
  } {
    const budgetId = `budget_${category}`
    const budget = this.budgets.get(budgetId)
    
    if (!budget) {
      return {
        budget: null,
        usagePercent: 0,
        remaining: 0,
        status: 'normal'
      }
    }
    
    const usagePercent = (budget.usage.today / budget.budgets.daily) * 100
    const remaining = Math.max(0, budget.budgets.daily - budget.usage.today)
    
    let status: 'normal' | 'warning' | 'critical' | 'overrun' = 'normal'
    if (usagePercent >= 100) {
      status = 'overrun'
    } else if (usagePercent >= budget.alerts.criticalThreshold) {
      status = 'critical'
    } else if (usagePercent >= budget.alerts.warningThreshold) {
      status = 'warning'
    }
    
    return {
      budget,
      usagePercent,
      remaining,
      status
    }
  }
  
  /**
   * 获取活动追踪器
   */
  public getActiveTracker(): TimeTracker | null {
    return this.activeTracker
  }
  
  /**
   * 获取所有追踪器
   */
  public getAllTrackers(): TimeTracker[] {
    return Array.from(this.trackers.values())
  }
  
  /**
   * 获取今日追踪器
   */
  public getTodayTrackers(): TimeTracker[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return Array.from(this.trackers.values()).filter(
      tracker => tracker.startTime >= today
    )
  }
  
  /**
   * 从时间银行借用时间
   */
  public async borrowFromTimeBank(
    amount: number,
    description: string,
    category: BudgetCategory
  ): Promise<boolean> {
    if (!this.timeBank) {
      await this.initializeTimeBank()
    }
    
    if (amount > this.timeBank!.settings.borrowLimit) {
      console.warn('借用时间超过限制')
      return false
    }
    
    if (this.timeBank!.balance.borrowed + amount > this.timeBank!.settings.borrowLimit) {
      console.warn('总借用时间将超过限制')
      return false
    }
    
    await this.addToTimeBank(amount, TimeBankTransactionType.BORROW, description)
    
    // 将借用的时间添加到对应类别的预算中
    const budgetId = `budget_${category}`
    const budget = this.budgets.get(budgetId)
    if (budget) {
      budget.budgets.daily += amount
      budget.updatedAt = new Date()
      await this.saveBudgets()
    }
    
    console.log(`💰 从时间银行借用 ${this.formatDuration(amount)} 用于 ${description}`)
    return true
  }

  /**
   * 手动存入时间银行
   */
  public async saveToTimeBank(
    amount: number, 
    description: string
  ): Promise<boolean> {
    if (amount <= 0) return false
    
    await this.addToTimeBank(amount, TimeBankTransactionType.SAVE, description)
    console.log(`💰 手动存入时间银行 ${this.formatDuration(amount)}`)
    return true
  }

  /**
   * 获取未确认的告警
   */
  public getUnacknowledgedAlerts(): BudgetAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged)
  }

  /**
   * 确认告警
   */
  public async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId)
    if (!alert) return false
    
    alert.acknowledged = true
    alert.acknowledgedAt = new Date()
    
    console.log(`✅ 已确认告警: ${alert.message}`)
    return true
  }

  /**
   * 生成报告
   */
  public async generateReport(
    type: 'daily' | 'weekly' | 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeBudgetReport> {
    const now = new Date()
    const start = startDate || this.getReportStartDate(type, now)
    const end = endDate || now
    
    // 计算分类统计
    const categories: TimeBudgetReport['categories'] = []
    let totalBudgeted = 0
    let totalActual = 0
    
    for (const budget of this.budgets.values()) {
      const budgetAmount = this.getBudgetAmountForPeriod(budget, type)
      const actualAmount = this.getActualUsageForPeriod(budget, type, start, end)
      const variance = actualAmount - budgetAmount
      const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0
      
      categories.push({
        category: budget.category,
        budgeted: budgetAmount,
        actual: actualAmount,
        variance,
        variancePercent
      })
      
      totalBudgeted += budgetAmount
      totalActual += actualAmount
    }
    
    const totalVariance = totalActual - totalBudgeted
    const efficiencyScore = totalBudgeted > 0 ? Math.round((totalBudgeted / totalActual) * 100) : 0
    
    // 分析超支和低利用类别
    const overrunCategories = categories
      .filter(c => c.variance > 0)
      .map(c => this.getCategoryName(c.category))
    
    const underutilizedCategories = categories
      .filter(c => c.variancePercent < -20) // 少用20%以上
      .map(c => this.getCategoryName(c.category))
    
    // 生成洞察建议
    const insights = this.generateInsights(categories, efficiencyScore)
    
    // 生成趋势数据
    const trends = this.generateTrends(start, end)
    
    const report: TimeBudgetReport = {
      id: this.generateReportId(),
      period: { type, startDate: start, endDate: end },
      categories,
      summary: {
        totalBudgeted,
        totalActual,
        totalVariance,
        efficiencyScore,
        overrunCategories,
        underutilizedCategories
      },
      insights,
      trends,
      generatedAt: new Date()
    }
    
    return report
  }

  /**
   * 获取报告开始日期
   */
  private getReportStartDate(type: 'daily' | 'weekly' | 'monthly', referenceDate: Date): Date {
    const date = new Date(referenceDate)
    
    switch (type) {
      case 'daily':
        date.setHours(0, 0, 0, 0)
        return date
      case 'weekly':
        const dayOfWeek = date.getDay()
        date.setDate(date.getDate() - dayOfWeek)
        date.setHours(0, 0, 0, 0)
        return date
      case 'monthly':
        date.setDate(1)
        date.setHours(0, 0, 0, 0)
        return date
    }
  }

  /**
   * 获取特定周期的预算金额
   */
  private getBudgetAmountForPeriod(budget: TimeBudget, type: 'daily' | 'weekly' | 'monthly'): number {
    switch (type) {
      case 'daily':
        return budget.budgets.daily
      case 'weekly':
        return budget.budgets.weekly
      case 'monthly':
        return budget.budgets.monthly
    }
  }

  /**
   * 获取特定周期的实际使用量
   */
  private getActualUsageForPeriod(
    budget: TimeBudget, 
    type: 'daily' | 'weekly' | 'monthly', 
    start: Date, 
    end: Date
  ): number {
    // 筛选指定时间范围内的追踪器
    const relevantTrackers = Array.from(this.trackers.values()).filter(tracker => 
      tracker.category === budget.category &&
      tracker.startTime >= start &&
      tracker.startTime <= end &&
      tracker.status === TrackerStatus.COMPLETED
    )
    
    return relevantTrackers.reduce((sum, tracker) => sum + tracker.activeDuration, 0)
  }

  /**
   * 生成洞察建议
   */
  private generateInsights(
    categories: TimeBudgetReport['categories'],
    efficiencyScore: number
  ): TimeBudgetReport['insights'] {
    const insights: TimeBudgetReport['insights'] = []
    
    // 效率评估
    if (efficiencyScore > 90) {
      insights.push({
        type: 'achievement',
        message: '🎉 效率极佳！时间利用非常合理'
      })
    } else if (efficiencyScore < 70) {
      insights.push({
        type: 'warning',
        message: '⚠️ 时间利用效率较低，建议优化时间分配'
      })
    }
    
    // 分析各类别
    categories.forEach(category => {
      if (category.variancePercent > 50) {
        insights.push({
          type: 'warning',
          message: `${this.getCategoryName(category.category)}时间严重超支，建议调整预算或优化工作流程`,
          category: category.category,
          actionable: {
            action: 'adjustBudget',
            params: { category: category.category, suggestedIncrease: category.variance }
          }
        })
      } else if (category.variancePercent < -30) {
        insights.push({
          type: 'suggestion',
          message: `${this.getCategoryName(category.category)}时间利用不足，可以考虑增加相关活动`,
          category: category.category
        })
      }
    })
    
    return insights
  }

  /**
   * 生成趋势数据
   */
  private generateTrends(start: Date, end: Date): TimeBudgetReport['trends'] {
    // 生成每日使用量趋势
    const dailyUsage: Array<{ date: Date; usage: number }> = []
    const current = new Date(start)
    
    while (current <= end) {
      const dayStart = new Date(current)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(current)
      dayEnd.setHours(23, 59, 59, 999)
      
      const dayTrackers = Array.from(this.trackers.values()).filter(tracker => 
        tracker.startTime >= dayStart && 
        tracker.startTime <= dayEnd &&
        tracker.status === TrackerStatus.COMPLETED
      )
      
      const dayUsage = dayTrackers.reduce((sum, tracker) => sum + tracker.activeDuration, 0)
      
      dailyUsage.push({
        date: new Date(current),
        usage: dayUsage
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    // 生成分类分布
    const categoryUsage = new Map<BudgetCategory, number>()
    Array.from(this.trackers.values())
      .filter(tracker => 
        tracker.startTime >= start && 
        tracker.startTime <= end &&
        tracker.status === TrackerStatus.COMPLETED
      )
      .forEach(tracker => {
        const current = categoryUsage.get(tracker.category) || 0
        categoryUsage.set(tracker.category, current + tracker.activeDuration)
      })
    
    const totalUsage = Array.from(categoryUsage.values()).reduce((sum, usage) => sum + usage, 0)
    const categoryDistribution = Array.from(categoryUsage.entries()).map(([category, usage]) => ({
      category,
      percentage: totalUsage > 0 ? (usage / totalUsage) * 100 : 0
    }))
    
    return {
      dailyUsage,
      categoryDistribution
    }
  }
  
  /**
   * 获取类别名称
   */
  private getCategoryName(category: BudgetCategory): string {
    const names: Record<BudgetCategory, string> = {
      [BudgetCategory.WORK]: '工作',
      [BudgetCategory.MEETING]: '会议',
      [BudgetCategory.BREAK]: '休息',
      [BudgetCategory.LEARNING]: '学习',
      [BudgetCategory.PERSONAL]: '个人',
      [BudgetCategory.EXERCISE]: '运动',
      [BudgetCategory.COMMUTE]: '通勤',
      [BudgetCategory.OTHER]: '其他'
    }
    return names[category] || category
  }
  
  /**
   * 加载预算
   */
  private async loadBudgets() {
    const saved = await this.storageService.getItem('timeBudgets')
    if (saved) {
      saved.forEach((budget: TimeBudget) => {
        this.budgets.set(budget.id, budget)
      })
    }
  }
  
  /**
   * 保存预算
   */
  private async saveBudgets() {
    const budgetsArray = Array.from(this.budgets.values())
    await this.storageService.setItem('timeBudgets', budgetsArray)
  }
  
  /**
   * 加载追踪器
   */
  private async loadTrackers() {
    const saved = await this.storageService.getItem('timeTrackers')
    if (saved) {
      saved.forEach((tracker: TimeTracker) => {
        this.trackers.set(tracker.id, tracker)
      })
    }
  }
  
  /**
   * 保存追踪器
   */
  private async saveTrackers() {
    const trackersArray = Array.from(this.trackers.values())
    await this.storageService.setItem('timeTrackers', trackersArray)
  }
  
  /**
   * 恢复活动追踪器
   */
  private async restoreActiveTracker() {
    const activeTrackerId = await this.storageService.getItem('activeTrackerId')
    if (activeTrackerId) {
      const tracker = this.trackers.get(activeTrackerId)
      if (tracker && tracker.status === TrackerStatus.RUNNING) {
        this.activeTracker = tracker
        this.startTimer(tracker)
      }
    }
  }
  
  /**
   * 加载时间银行
   */
  private async loadTimeBank() {
    const saved = await this.storageService.getItem('timeBank')
    if (saved) {
      this.timeBank = saved
    } else {
      await this.initializeTimeBank()
    }
  }
  
  /**
   * 保存时间银行
   */
  private async saveTimeBank() {
    if (this.timeBank) {
      await this.storageService.setItem('timeBank', this.timeBank)
    }
  }
  
  /**
   * 生成ID
   */
  private generateTrackerId(): string {
    return `tracker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateTransactionId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 清理资源
   */
  public dispose() {
    this.stopTimer()
    this.budgets.clear()
    this.trackers.clear()
    this.alerts.clear()
    this.activeTracker = null
    this.timeBank = null
  }
}

// 导出单例
export default TimeBudgetService.getInstance()