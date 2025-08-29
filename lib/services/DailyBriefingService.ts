/**
 * Daily Briefing Service
 * 每日简报生成和管理服务
 */

import {
  DailyBriefing,
  BriefingSummary,
  WeatherInfo,
  ScheduleSummary,
  TaskSummary,
  MarketSummary,
  AIInsights,
  Recommendation,
  BriefingPreferences,
  EventBrief,
  TaskBrief,
  TimePeriod,
  DailyQuote,
  MarketIndicator,
  ProductivityInsight,
  HealthInsight,
  BriefingSection
} from '../../types/briefing'
import { Event, EventCategory, Priority } from '../../types/event'
import { InboxItem } from '../../types/inbox'
import { TimeTracker, BudgetCategory } from '../../types/timebudget'
import { aiService } from './AIService'
import { marketService } from './RealTimeMarketService'
import InboxService from './InboxService'
import TimeBudgetService from './TimeBudgetService'
import { useEventStore } from '../stores/event-store'

class DailyBriefingService {
  private static instance: DailyBriefingService
  private briefings: Map<string, DailyBriefing> = new Map()
  private preferences: BriefingPreferences
  private generateTimer: NodeJS.Timeout | null = null
  
  private readonly QUOTES: DailyQuote[] = [
    { text: "成功不是终点，失败也不是终结：继续前进的勇气才是最重要的。", author: "温斯顿·丘吉尔", category: 'motivation' },
    { text: "时间就像海绵里的水，只要愿挤，总还是有的。", author: "鲁迅", category: 'wisdom' },
    { text: "最好的投资就是投资自己。", author: "沃伦·巴菲特", category: 'business' },
    { text: "专注是成功的关键。专注于你最擅长的事情。", author: "比尔·盖茨", category: 'business' },
    { text: "行动是治愈恐惧的良药，而犹豫拖延将不断滋养恐惧。", author: "戴尔·卡耐基", category: 'motivation' },
    { text: "复杂的事情简单做，简单的事情重复做，重复的事情用心做。", author: "张瑞敏", category: 'wisdom' },
    { text: "今天的努力，是为了明天的不努力。", author: "马云", category: 'motivation' },
    { text: "不要等待机会，而要创造机会。", author: "乔治·萧伯纳", category: 'life' }
  ]

  private constructor() {
    this.preferences = this.loadPreferences()
    this.initializeAutoGeneration()
    // Daily Briefing Service initialized
  }

  static getInstance(): DailyBriefingService {
    if (!DailyBriefingService.instance) {
      DailyBriefingService.instance = new DailyBriefingService()
    }
    return DailyBriefingService.instance
  }

  /**
   * 生成今日简报
   */
  async generateDailyBriefing(): Promise<DailyBriefing> {
    const today = new Date()
    const dateKey = this.getDateKey(today)
    
    // 检查是否已生成
    if (this.briefings.has(dateKey)) {
      const existing = this.briefings.get(dateKey)!
      if (this.isFresh(existing)) {
        return existing
      }
    }

    // 生成新简报
    const briefing: DailyBriefing = {
      id: `briefing_${Date.now()}`,
      date: today,
      generatedAt: new Date(),
      summary: await this.generateSummary(today),
      weather: await this.getWeatherInfo(),
      schedule: await this.generateScheduleSummary(today),
      tasks: await this.generateTaskSummary(today),
      market: await this.generateMarketSummary(),
      insights: await this.generateAIInsights(today),
      recommendations: await this.generateRecommendations(today),
      readStatus: 'unread',
      tags: this.generateTags(today)
    }

    // 缓存简报
    this.briefings.set(dateKey, briefing)
    this.saveBriefing(briefing)

    return briefing
  }

  /**
   * 生成简报摘要
   */
  private async generateSummary(date: Date): Promise<BriefingSummary> {
    const hour = date.getHours()
    const dayOfWeek = date.toLocaleDateString('zh-CN', { weekday: 'long' })
    const dateStr = date.toLocaleDateString('zh-CN', { 
      month: 'long', 
      day: 'numeric' 
    })

    // 根据时间生成问候语
    let greeting = ''
    if (hour < 6) greeting = '早安！新的一天即将开始'
    else if (hour < 9) greeting = '早上好！美好的一天从现在开始'
    else if (hour < 12) greeting = '上午好！保持专注，高效工作'
    else if (hour < 14) greeting = '中午好！记得适当休息'
    else if (hour < 18) greeting = '下午好！继续保持动力'
    else if (hour < 22) greeting = '晚上好！回顾今天，规划明天'
    else greeting = '夜深了，注意休息'

    // 获取今日亮点
    const highlights = await this.generateHighlights(date)
    
    // 随机选择每日名言
    const quote = this.QUOTES[Math.floor(Math.random() * this.QUOTES.length)]

    return {
      greeting,
      dateInfo: `${dateStr} ${dayOfWeek}`,
      overview: await this.generateOverview(date),
      highlights,
      quote
    }
  }

  /**
   * 生成今日概览
   */
  private async generateOverview(date: Date): Promise<string> {
    const events = useEventStore.getState().events.filter(e => 
      this.isSameDay(new Date(e.startTime), date)
    )
    
    const tasks = await InboxService.getAllItems()
    const todayTasks = tasks.filter(t => 
      t.dueDate && this.isSameDay(new Date(t.dueDate), date)
    )

    const parts: string[] = []
    
    if (events.length > 0) {
      parts.push(`${events.length}个日程安排`)
    }
    
    if (todayTasks.length > 0) {
      parts.push(`${todayTasks.length}项待办任务`)
    }

    const highPriorityCount = events.filter(e => 
      e.priority === Priority.HIGH || e.priority === Priority.URGENT
    ).length

    if (highPriorityCount > 0) {
      parts.push(`${highPriorityCount}项重要事项`)
    }

    if (parts.length === 0) {
      return '今天日程相对轻松，是个充电学习的好机会。'
    }

    return `今天您有${parts.join('、')}需要处理。让我们合理安排，高效完成！`
  }

  /**
   * 生成今日亮点
   */
  private async generateHighlights(date: Date): Promise<string[]> {
    const highlights: string[] = []
    
    // 获取重要事件
    const events = useEventStore.getState().events.filter(e => 
      this.isSameDay(new Date(e.startTime), date)
    )
    
    const importantEvents = events.filter(e => 
      e.priority === Priority.HIGH || e.priority === Priority.URGENT
    )
    
    if (importantEvents.length > 0) {
      highlights.push(`⭐ ${importantEvents[0].title}`)
    }

    // 获取紧急任务统计
    const inboxStats = InboxService.getStats()
    const pendingUrgent = inboxStats.byPriority.urgent || 0
    
    if (pendingUrgent > 0) {
      highlights.push(`🚨 ${pendingUrgent}项紧急任务待处理`)
    }

    // 市场机会
    if (marketService.getMarketOverview().isMarketOpen) {
      highlights.push('📈 市场交易时段活跃')
    }

    // 时间管理提醒
    const activeTracker = TimeBudgetService.getActiveTracker()
    if (activeTracker) {
      highlights.push(`⏱️ 正在计时任务：${activeTracker.taskName}`)
    }

    // 如果没有亮点，添加励志信息
    if (highlights.length === 0) {
      highlights.push('💪 保持专注，今天会是充实的一天')
      highlights.push('🎯 设定目标，一步步实现')
    }

    return highlights.slice(0, 5) // 最多5个亮点
  }

  /**
   * 获取天气信息（模拟）
   */
  private async getWeatherInfo(): Promise<WeatherInfo> {
    // 这里应该调用真实的天气API
    // 目前返回模拟数据
    return {
      current: {
        temperature: 22,
        condition: '多云',
        humidity: 65,
        windSpeed: 10,
        icon: '⛅'
      },
      forecast: {
        high: 26,
        low: 18,
        condition: '多云转晴',
        precipitation: 20
      },
      suggestions: [
        '今天天气适宜外出',
        '紫外线较强，记得防晒',
        '早晚温差较大，注意增减衣物'
      ]
    }
  }

  /**
   * 生成日程摘要
   */
  private async generateScheduleSummary(date: Date): Promise<ScheduleSummary> {
    const events = useEventStore.getState().events
      .filter(e => this.isSameDay(new Date(e.startTime), date))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    const eventBriefs: EventBrief[] = events.map(e => ({
      id: e.id,
      title: e.title,
      time: new Date(e.startTime).toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      duration: Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000),
      category: e.category,
      priority: this.mapPriority(e.priority),
      location: e.location,
      preparation: e.tags
    }))

    // 计算忙碌时段和空闲时段
    const busyPeriods = this.calculateBusyPeriods(events)
    const freeSlots = this.calculateFreeSlots(busyPeriods, date)

    // 检测冲突
    const conflicts = this.detectConflicts(events)

    return {
      totalEvents: events.length,
      importantEvents: eventBriefs.filter(e => e.priority === 'high'),
      firstEvent: eventBriefs[0],
      lastEvent: eventBriefs[eventBriefs.length - 1],
      busyPeriods,
      freeSlots,
      conflictWarnings: conflicts
    }
  }

  /**
   * 生成任务摘要
   */
  private async generateTaskSummary(date: Date): Promise<TaskSummary> {
    const allTasks = await InboxService.getAllItems()
    const todayTasks = allTasks.filter(t => 
      t.dueDate && this.isSameDay(new Date(t.dueDate), date)
    )
    
    const overdueTasks = allTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < date && t.status !== 'completed'
    )

    const completedYesterday = allTasks.filter(t => {
      if (t.status !== 'completed' || !t.completedAt) return false
      const yesterday = new Date(date)
      yesterday.setDate(yesterday.getDate() - 1)
      return this.isSameDay(new Date(t.completedAt), yesterday)
    }).length

    // 转换为TaskBrief
    const taskBriefs: TaskBrief[] = todayTasks.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category || 'general',
      priority: t.priority as 'urgent' | 'high' | 'medium' | 'low',
      dueTime: t.dueDate ? new Date(t.dueDate) : undefined,
      estimatedDuration: t.estimatedMinutes || 30,
      progress: 0,
      context: t.context
    }))

    // 优先级任务
    const priorityTasks = taskBriefs
      .filter(t => t.priority === 'urgent' || t.priority === 'high')
      .slice(0, 5)

    // 即将到期的任务
    const upcomingDeadlines = taskBriefs
      .filter(t => t.dueTime)
      .sort((a, b) => a.dueTime!.getTime() - b.dueTime!.getTime())
      .slice(0, 5)

    // AI建议的焦点任务
    const suggestedFocus = await this.suggestFocusTasks(taskBriefs)

    // 计算预计工作量
    const estimatedWorkload = taskBriefs.reduce((total, task) => 
      total + task.estimatedDuration, 0
    ) / 60 // 转换为小时

    // 生成推荐日程
    const recommendedSchedule = await this.generateTaskSchedule(taskBriefs, date)

    return {
      totalTasks: allTasks.filter(t => t.status !== 'completed').length,
      completedYesterday,
      dueToday: todayTasks.length,
      overdue: overdueTasks.length,
      priorityTasks,
      upcomingDeadlines,
      suggestedFocus,
      estimatedWorkload,
      recommendedSchedule
    }
  }

  /**
   * 生成市场摘要
   */
  private async generateMarketSummary(): Promise<MarketSummary> {
    const overview = marketService.getMarketOverview()
    
    // 关键指标（模拟数据）
    const keyIndicators: MarketIndicator[] = [
      { symbol: 'SPX', name: 'S&P 500', value: 4450.5, change: 15.2, changePercent: 0.34, trend: 'up' },
      { symbol: 'DJI', name: '道琼斯', value: 34567.8, change: -123.4, changePercent: -0.36, trend: 'down' },
      { symbol: 'IXIC', name: '纳斯达克', value: 13678.9, change: 45.6, changePercent: 0.33, trend: 'up' }
    ]

    return {
      marketStatus: overview.isMarketOpen ? 'open' : 'closed',
      keyIndicators,
      watchlist: [],
      economicEvents: [],
      tradingOpportunities: [],
      riskAlerts: overview.alerts.map(a => a.message)
    }
  }

  /**
   * 生成AI洞察
   */
  private async generateAIInsights(date: Date): Promise<AIInsights> {
    const productivity = await this.analyzeProductivity(date)
    const health = await this.analyzeHealth(date)
    const financial = await this.analyzeFinancial()
    const learning = await this.analyzeLearning()
    const social = await this.analyzeSocial()

    return {
      productivity,
      health,
      financial,
      learning,
      social
    }
  }

  /**
   * 分析生产力
   */
  private async analyzeProductivity(date: Date): Promise<ProductivityInsight> {
    const todayTrackers = TimeBudgetService.getTodayTrackers()
    const totalMinutes = todayTrackers.reduce((sum, tracker) => sum + Math.floor(tracker.activeDuration / 60), 0)
    
    const tasks = await InboxService.getAllItems()
    const completedToday = tasks.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      this.isSameDay(new Date(t.completedAt), date)
    ).length

    // 计算生产力分数
    let score = 50 // 基础分
    if (completedToday > 5) score += 20
    else if (completedToday > 3) score += 10
    
    if (totalMinutes > 360) score += 20 // 工作超过6小时
    else if (totalMinutes > 240) score += 10 // 工作超过4小时

    // 判断趋势
    const trend = score > 70 ? 'improving' : score > 50 ? 'stable' : 'declining'

    // 生成分析
    const analysis = `今天的生产力${
      score > 70 ? '表现出色' : score > 50 ? '保持稳定' : '有待提升'
    }。已完成${completedToday}项任务，工作时长${Math.round(totalMinutes / 60)}小时。`

    // 建议
    const suggestions: string[] = []
    if (score < 70) {
      suggestions.push('尝试使用番茄工作法提高专注度')
      suggestions.push('优先处理高价值任务')
    }
    if (totalMinutes < 240) {
      suggestions.push('增加深度工作时间')
    }

    // 推荐专注时段
    const focusTime: TimePeriod[] = [
      { 
        start: new Date(date.setHours(9, 0, 0, 0)), 
        end: new Date(date.setHours(11, 0, 0, 0)),
        duration: 120,
        label: '上午深度工作时段'
      },
      {
        start: new Date(date.setHours(14, 0, 0, 0)),
        end: new Date(date.setHours(16, 0, 0, 0)),
        duration: 120,
        label: '下午专注时段'
      }
    ]

    return {
      score,
      trend,
      analysis,
      suggestions,
      focusTime
    }
  }

  /**
   * 分析健康状态
   */
  private async analyzeHealth(date: Date): Promise<HealthInsight> {
    const hour = date.getHours()
    
    // 根据时间判断能量水平
    let energyLevel: 'high' | 'medium' | 'low'
    if (hour >= 9 && hour <= 11) energyLevel = 'high'
    else if (hour >= 14 && hour <= 16) energyLevel = 'medium'
    else if (hour >= 21 || hour <= 6) energyLevel = 'low'
    else energyLevel = 'medium'

    // 压力水平（基于任务量）
    const tasks = await InboxService.getAllItems()
    const urgentTasks = tasks.filter(t => t.priority === 'urgent').length
    const stressLevel: 'high' | 'medium' | 'low' = 
      urgentTasks > 5 ? 'high' : urgentTasks > 2 ? 'medium' : 'low'

    // 健康建议
    const suggestions: string[] = []
    if (stressLevel === 'high') {
      suggestions.push('进行5分钟深呼吸放松')
      suggestions.push('适当委派或延后非紧急任务')
    }
    if (energyLevel === 'low') {
      suggestions.push('小憩15-20分钟恢复精力')
      suggestions.push('避免安排重要决策')
    }
    suggestions.push('记得每小时站起来活动3-5分钟')
    suggestions.push('保持充足的水分摄入')

    // 建议休息时间
    const breaks: TimePeriod[] = [
      {
        start: new Date(date.setHours(10, 30, 0, 0)),
        end: new Date(date.setHours(10, 45, 0, 0)),
        duration: 15,
        label: '上午茶歇'
      },
      {
        start: new Date(date.setHours(12, 0, 0, 0)),
        end: new Date(date.setHours(13, 0, 0, 0)),
        duration: 60,
        label: '午餐休息'
      },
      {
        start: new Date(date.setHours(15, 30, 0, 0)),
        end: new Date(date.setHours(15, 45, 0, 0)),
        duration: 15,
        label: '下午休息'
      }
    ]

    return {
      energyLevel,
      stressLevel,
      suggestions,
      breaks
    }
  }

  /**
   * 分析财务状态
   */
  private async analyzeFinancial(): Promise<FinancialInsight> {
    return {
      portfolioStatus: '稳健增长',
      dailyTarget: 1000,
      riskLevel: 'medium',
      suggestions: [
        '关注科技板块机会',
        '保持20%现金仓位',
        '定期审查止损位'
      ]
    }
  }

  /**
   * 分析学习进度
   */
  private async analyzeLearning(): Promise<LearningInsight> {
    return {
      learningGoals: [
        '完成React高级课程第3章',
        '阅读《深度工作》第二部分',
        '练习算法题30分钟'
      ],
      suggestedContent: [
        {
          title: 'TypeScript最佳实践',
          type: 'article',
          duration: 15,
          relevance: 0.9
        },
        {
          title: 'AI驱动的产品设计',
          type: 'video',
          duration: 45,
          relevance: 0.85
        }
      ],
      skillProgress: [
        {
          skill: 'TypeScript',
          level: 75,
          progress: 5,
          nextMilestone: '掌握高级类型'
        },
        {
          skill: '产品设计',
          level: 60,
          progress: 10,
          nextMilestone: '完成用户研究模块'
        }
      ]
    }
  }

  /**
   * 分析社交关系
   */
  private async analyzeSocial(): Promise<SocialInsight> {
    return {
      importantContacts: [
        {
          name: '张经理',
          reason: '项目进度汇报',
          lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          suggestedAction: '发送周报邮件'
        }
      ],
      networkingOpportunities: [
        '下周二行业交流会',
        '本月底技术分享会'
      ],
      relationshipHealth: 75
    }
  }

  /**
   * 生成智能推荐
   */
  private async generateRecommendations(date: Date): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    // 基于当前时间的推荐
    const hour = date.getHours()
    
    if (hour >= 6 && hour <= 9) {
      recommendations.push({
        id: 'morning_routine',
        type: 'health',
        priority: 'medium',
        title: '开始晨间例程',
        description: '完成晨间冥想和计划回顾，为高效的一天做准备',
        timeframe: '15分钟',
        impact: '提升全天专注力30%'
      })
    }

    if (hour >= 9 && hour <= 11) {
      recommendations.push({
        id: 'deep_work',
        type: 'task',
        priority: 'high',
        title: '进入深度工作模式',
        description: '现在是认知能力最佳时段，适合处理复杂任务',
        action: {
          label: '开始专注模式',
          handler: 'startFocusMode',
          params: { duration: 90 }
        },
        timeframe: '90分钟',
        impact: '完成最重要的任务'
      })
    }

    // 基于任务的推荐
    const tasks = await InboxService.getAllItems()
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed')
    
    if (urgentTasks.length > 0) {
      recommendations.push({
        id: 'urgent_tasks',
        type: 'task',
        priority: 'high',
        title: `处理${urgentTasks.length}项紧急任务`,
        description: '有紧急任务需要立即处理，建议优先完成',
        action: {
          label: '查看紧急任务',
          handler: 'showUrgentTasks'
        },
        timeframe: '立即',
        impact: '避免延误和潜在损失'
      })
    }

    // 基于健康的推荐
    const lastBreak = this.getLastBreakTime()
    if (lastBreak && (Date.now() - lastBreak.getTime()) > 2 * 60 * 60 * 1000) {
      recommendations.push({
        id: 'take_break',
        type: 'health',
        priority: 'medium',
        title: '该休息一下了',
        description: '您已经连续工作超过2小时，建议休息10-15分钟',
        action: {
          label: '开始休息',
          handler: 'startBreak',
          params: { duration: 15 }
        },
        timeframe: '现在',
        impact: '恢复精力，提高后续效率'
      })
    }

    // 学习推荐
    if (hour >= 20 && hour <= 22) {
      recommendations.push({
        id: 'evening_learning',
        type: 'learning',
        priority: 'low',
        title: '晚间学习时间',
        description: '适合阅读和知识输入，推荐学习新技能或复习',
        timeframe: '30-60分钟',
        impact: '持续提升专业能力'
      })
    }

    return recommendations.slice(0, 5) // 最多返回5个推荐
  }

  /**
   * 建议焦点任务
   */
  private async suggestFocusTasks(tasks: TaskBrief[]): Promise<TaskBrief[]> {
    // 根据优先级、截止时间和当前时间段推荐任务
    const now = new Date()
    const hour = now.getHours()
    
    // 根据时间段调整权重
    const timeWeight = hour >= 9 && hour <= 11 ? 1.5 : // 上午黄金时段
                       hour >= 14 && hour <= 16 ? 1.2 : // 下午专注时段
                       1.0
    
    // 计算任务分数
    const scoredTasks = tasks.map(task => {
      let score = 0
      
      // 优先级权重
      switch (task.priority) {
        case 'urgent': score += 100; break
        case 'high': score += 75; break
        case 'medium': score += 50; break
        case 'low': score += 25; break
      }
      
      // 截止时间权重
      if (task.dueTime) {
        const hoursUntilDue = (task.dueTime.getTime() - now.getTime()) / (1000 * 60 * 60)
        if (hoursUntilDue < 2) score += 50
        else if (hoursUntilDue < 6) score += 30
        else if (hoursUntilDue < 24) score += 10
      }
      
      // 时间段权重
      score *= timeWeight
      
      // 任务时长权重（优先短任务）
      if (task.estimatedDuration <= 30) score += 20
      else if (task.estimatedDuration <= 60) score += 10
      
      return { task, score }
    })
    
    // 按分数排序并返回前5个
    return scoredTasks
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.task)
  }

  /**
   * 生成任务日程建议
   */
  private async generateTaskSchedule(tasks: TaskBrief[], date: Date): Promise<any[]> {
    // 获取已有日程
    const events = useEventStore.getState().events
      .filter(e => this.isSameDay(new Date(e.startTime), date))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    
    // 找出空闲时段
    const freeSlots = this.calculateFreeSlots(
      this.calculateBusyPeriods(events),
      date
    )
    
    const schedule: any[] = []
    const priorityTasks = tasks
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
    
    // 为每个任务分配时间段
    for (const task of priorityTasks.slice(0, 5)) {
      const suitableSlot = freeSlots.find(slot => 
        slot.duration >= task.estimatedDuration
      )
      
      if (suitableSlot) {
        schedule.push({
          task,
          suggestedTime: {
            start: suitableSlot.start,
            end: new Date(suitableSlot.start.getTime() + task.estimatedDuration * 60000),
            duration: task.estimatedDuration,
            label: `建议时间`
          },
          reason: this.getScheduleReason(task, suitableSlot)
        })
        
        // 更新空闲时段
        suitableSlot.start = new Date(
          suitableSlot.start.getTime() + task.estimatedDuration * 60000
        )
        suitableSlot.duration -= task.estimatedDuration
      }
    }
    
    return schedule
  }

  /**
   * 获取日程安排理由
   */
  private getScheduleReason(task: TaskBrief, slot: TimePeriod): string {
    const hour = slot.start.getHours()
    
    if (task.priority === 'urgent') {
      return '紧急任务，需要立即处理'
    }
    
    if (hour >= 9 && hour <= 11) {
      return '上午精力充沛，适合处理重要任务'
    }
    
    if (hour >= 14 && hour <= 16) {
      return '下午专注时段，适合深度工作'
    }
    
    if (task.estimatedDuration <= 30) {
      return '任务时间较短，可以快速完成'
    }
    
    return '合理利用空闲时间，保持工作节奏'
  }

  /**
   * 计算忙碌时段
   */
  private calculateBusyPeriods(events: Event[]): TimePeriod[] {
    return events.map(event => ({
      start: new Date(event.startTime),
      end: new Date(event.endTime),
      duration: Math.round(
        (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000
      ),
      label: event.title
    }))
  }

  /**
   * 计算空闲时段
   */
  private calculateFreeSlots(busyPeriods: TimePeriod[], date: Date): TimePeriod[] {
    const slots: TimePeriod[] = []
    const workStart = new Date(date)
    workStart.setHours(9, 0, 0, 0)
    const workEnd = new Date(date)
    workEnd.setHours(18, 0, 0, 0)
    
    if (busyPeriods.length === 0) {
      slots.push({
        start: workStart,
        end: workEnd,
        duration: 540, // 9小时
        label: '全天空闲'
      })
      return slots
    }
    
    // 检查第一个事件前的空闲
    if (busyPeriods[0].start > workStart) {
      slots.push({
        start: workStart,
        end: busyPeriods[0].start,
        duration: Math.round(
          (busyPeriods[0].start.getTime() - workStart.getTime()) / 60000
        ),
        label: '早间空闲'
      })
    }
    
    // 检查事件之间的空闲
    for (let i = 0; i < busyPeriods.length - 1; i++) {
      const gap = busyPeriods[i + 1].start.getTime() - busyPeriods[i].end.getTime()
      if (gap > 30 * 60000) { // 至少30分钟
        slots.push({
          start: busyPeriods[i].end,
          end: busyPeriods[i + 1].start,
          duration: Math.round(gap / 60000),
          label: '间隙时间'
        })
      }
    }
    
    // 检查最后一个事件后的空闲
    const lastEvent = busyPeriods[busyPeriods.length - 1]
    if (lastEvent.end < workEnd) {
      slots.push({
        start: lastEvent.end,
        end: workEnd,
        duration: Math.round(
          (workEnd.getTime() - lastEvent.end.getTime()) / 60000
        ),
        label: '晚间空闲'
      })
    }
    
    return slots.filter(slot => slot.duration >= 30) // 至少30分钟
  }

  /**
   * 检测日程冲突
   */
  private detectConflicts(events: Event[]): string[] {
    const conflicts: string[] = []
    
    for (let i = 0; i < events.length - 1; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i]
        const event2 = events[j]
        
        if (this.hasOverlap(event1, event2)) {
          conflicts.push(
            `"${event1.title}" 与 "${event2.title}" 时间冲突`
          )
        }
      }
    }
    
    return conflicts
  }

  /**
   * 检查事件是否重叠
   */
  private hasOverlap(event1: Event, event2: Event): boolean {
    const start1 = new Date(event1.startTime).getTime()
    const end1 = new Date(event1.endTime).getTime()
    const start2 = new Date(event2.startTime).getTime()
    const end2 = new Date(event2.endTime).getTime()
    
    return (start1 < end2 && end1 > start2)
  }

  /**
   * 映射优先级
   */
  private mapPriority(priority: Priority): 'high' | 'medium' | 'low' {
    switch (priority) {
      case Priority.URGENT:
      case Priority.HIGH:
        return 'high'
      case Priority.MEDIUM:
        return 'medium'
      case Priority.LOW:
      default:
        return 'low'
    }
  }

  /**
   * 生成标签
   */
  private generateTags(date: Date): string[] {
    const tags: string[] = []
    const dayOfWeek = date.getDay()
    
    if (dayOfWeek === 1) tags.push('周一')
    else if (dayOfWeek === 5) tags.push('周五')
    
    const dayOfMonth = date.getDate()
    if (dayOfMonth === 1) tags.push('月初')
    else if (dayOfMonth >= 28) tags.push('月末')
    
    return tags
  }

  /**
   * 获取最后休息时间（模拟）
   */
  private getLastBreakTime(): Date | null {
    // 这里应该从实际的时间追踪数据中获取
    // 目前返回2小时前
    return new Date(Date.now() - 2.5 * 60 * 60 * 1000)
  }

  /**
   * 检查是否同一天
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  /**
   * 获取日期键
   */
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * 检查简报是否新鲜（6小时内）
   */
  private isFresh(briefing: DailyBriefing): boolean {
    const sixHours = 6 * 60 * 60 * 1000
    return (Date.now() - briefing.generatedAt.getTime()) < sixHours
  }

  /**
   * 获取默认偏好设置
   */
  private getDefaultPreferences(): BriefingPreferences {
    return {
      generateTime: '06:00',
      autoGenerate: true,
      sections: {
        weather: true,
        schedule: true,
        tasks: true,
        market: true,
        insights: true,
        quote: true
      },
      tone: 'motivational',
      length: 'standard',
      language: 'zh',
      delivery: {
        push: true,
        email: false,
        voice: false
      },
      focus: {
        productivity: true,
        health: true,
        financial: true,
        learning: true,
        social: false
      }
    }
  }

  /**
   * 加载偏好设置
   */
  private loadPreferences(): BriefingPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences()
    }
    const stored = localStorage.getItem('briefing_preferences')
    if (stored) {
      return JSON.parse(stored)
    }
    
    return this.getDefaultPreferences()
  }

  /**
   * 保存偏好设置
   */
  savePreferences(preferences: BriefingPreferences): void {
    this.preferences = preferences
    if (typeof window !== 'undefined') {
      localStorage.setItem('briefing_preferences', JSON.stringify(preferences))
    }
    this.initializeAutoGeneration()
  }

  /**
   * 初始化自动生成
   */
  private initializeAutoGeneration(): void {
    if (this.generateTimer) {
      clearInterval(this.generateTimer)
    }
    
    if (!this.preferences.autoGenerate) return
    
    // 每小时检查一次是否需要生成
    this.generateTimer = setInterval(() => {
      const now = new Date()
      const [hours, minutes] = this.preferences.generateTime.split(':').map(Number)
      
      if (now.getHours() === hours && now.getMinutes() < 10) {
        this.generateDailyBriefing()
      }
    }, 60000) // 每分钟检查
  }

  /**
   * 保存简报
   */
  private saveBriefing(briefing: DailyBriefing): void {
    const briefings = this.loadAllBriefings()
    briefings.push(briefing)
    
    // 只保留最近30天的简报
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const filtered = briefings.filter(b => 
      new Date(b.date) > thirtyDaysAgo
    )
    
    localStorage.setItem('daily_briefings', JSON.stringify(filtered))
  }

  /**
   * 加载所有简报
   */
  private loadAllBriefings(): DailyBriefing[] {
    const stored = localStorage.getItem('daily_briefings')
    return stored ? JSON.parse(stored) : []
  }

  /**
   * 标记为已读
   */
  markAsRead(briefingId: string): void {
    const briefing = this.briefings.get(briefingId)
    if (briefing) {
      briefing.readStatus = 'read'
      briefing.readAt = new Date()
      this.saveBriefing(briefing)
    }
  }

  /**
   * 获取历史简报
   */
  getHistoryBriefings(days: number = 7): DailyBriefing[] {
    const briefings = this.loadAllBriefings()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return briefings
      .filter(b => new Date(b.date) > cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * 清理实例
   */
  cleanup(): void {
    if (this.generateTimer) {
      clearInterval(this.generateTimer)
    }
  }
}

// 导出单例
export const dailyBriefingService = DailyBriefingService.getInstance()
export default DailyBriefingService
