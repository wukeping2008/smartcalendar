'use client'

import { Event, EventCategory, Priority, EnergyLevel } from '../../types/event'
import { Anthropic } from '@anthropic-ai/sdk'
import OpenAI from 'openai'

/**
 * AI服务 - 智能日程管理核心引擎 v2.5
 * 包含：Claude API集成、习惯学习、智能提醒、冲突解决、优化推荐
 * 新增：自然语言处理、智能任务分解、情境感知建议
 */

// AI学习的用户习惯数据
interface UserHabits {
  // 时间偏好
  preferredWorkingHours: { start: number; end: number }
  peakEnergyHours: number[]
  lowEnergyHours: number[]
  
  // 类别偏好
  categoryFrequency: Record<EventCategory, number>
  categoryDurations: Record<EventCategory, number>
  categoryPriorities: Record<EventCategory, Priority>
  
  // 行为模式
  averageEventDuration: number
  bufferTimePreference: number // 事件间隔偏好
  multitaskingCapability: number // 多任务处理能力评分
  
  // 灵活性
  reschedulingPatterns: {
    category: EventCategory
    flexibility: number
    frequentChanges: boolean
  }[]
}

// AI分析结果
interface AIAnalysis {
  habitScore: number // 习惯匹配度
  energyAlignment: number // 精力匹配度
  conflictRisk: number // 冲突风险
  optimizationScore: number // 优化得分
  recommendations: AIRecommendation[]
}

// AI推荐
interface AIRecommendation {
  type: 'time_adjustment' | 'energy_optimization' | 'conflict_resolution' | 'habit_improvement'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  action?: string
}

// 新增接口定义
interface ParsedCommand {
  intent: 'create_event' | 'modify_event' | 'query_schedule' | 'set_goal' | 'other'
  entities: {
    title?: string
    dateTime?: string
    duration?: number
    category?: EventCategory
    priority?: Priority
    location?: string
  }
  confidence: number
  suggestedAction: {
    type: string
    data: Record<string, unknown>
    alternatives?: Array<Record<string, unknown>>
  }
}

interface SubTask {
  title: string
  estimatedHours: number
  energyLevel: EnergyLevel
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening'
  dependencies: string[]
  category: EventCategory
}

interface MarketStatus {
  isOpen: boolean
  volatility: 'low' | 'medium' | 'high' | 'extreme'
  alerts: Array<{
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

interface UserPreferences {
  workingHours: { start: number; end: number }
  energyPattern: Record<string, EnergyLevel>
  tradingFocus: boolean
  deepWorkPreference: 'morning' | 'afternoon' | 'evening'
  breakFrequency: number
}

interface ScheduleContext {
  currentTime: Date
  timezone: string
  recentEvents: Event[]
  upcomingEvents: Event[]
  userPreferences: UserPreferences
  marketStatus?: MarketStatus
}

interface WeeklyPlan {
  startDate: Date
  endDate: Date
  totalTasks: number
  totalHours: number
  deepWorkHours: number
  availableHours: number
  utilization: number
  days: Array<{
    date: string
    dayOfWeek: string
    events: Array<{
      time: string
      title: string
      priority: number
      duration: number
    }>
  }>
}

class AIService {
  private userHabits: UserHabits
  private learningData: Event[] = []
  private analysisCache: Map<string, AIAnalysis> = new Map()
  
  // Claude API 客户端（懒加载）
  private _claude?: Anthropic
  private _openai?: OpenAI

  constructor() {
    // 初始化默认用户习惯
    this.userHabits = {
      preferredWorkingHours: { start: 9, end: 17 },
      peakEnergyHours: [9, 10, 11, 14, 15],
      lowEnergyHours: [13, 16, 17, 18],
      categoryFrequency: {
        [EventCategory.WORK]: 5,
        [EventCategory.MEETING]: 3,
        [EventCategory.PERSONAL]: 2,
        [EventCategory.BREAK]: 4,
        [EventCategory.EXERCISE]: 1,
        [EventCategory.MEAL]: 3,
        [EventCategory.TRAVEL]: 1,
        [EventCategory.TRADING]: 8,
        [EventCategory.LIFE_ROUTINE]: 4,
        [EventCategory.PREPARATION]: 2,
        [EventCategory.OTHER]: 1
      },
      categoryDurations: {
        [EventCategory.WORK]: 120,
        [EventCategory.MEETING]: 60,
        [EventCategory.PERSONAL]: 90,
        [EventCategory.BREAK]: 15,
        [EventCategory.EXERCISE]: 45,
        [EventCategory.MEAL]: 45,
        [EventCategory.TRAVEL]: 30,
        [EventCategory.TRADING]: 5,
        [EventCategory.LIFE_ROUTINE]: 30,
        [EventCategory.PREPARATION]: 20,
        [EventCategory.OTHER]: 60
      },
      categoryPriorities: {
        [EventCategory.WORK]: Priority.HIGH,
        [EventCategory.MEETING]: Priority.HIGH,
        [EventCategory.PERSONAL]: Priority.MEDIUM,
        [EventCategory.BREAK]: Priority.LOW,
        [EventCategory.EXERCISE]: Priority.MEDIUM,
        [EventCategory.MEAL]: Priority.MEDIUM,
        [EventCategory.TRAVEL]: Priority.LOW,
        [EventCategory.TRADING]: Priority.URGENT,
        [EventCategory.LIFE_ROUTINE]: Priority.MEDIUM,
        [EventCategory.PREPARATION]: Priority.HIGH,
        [EventCategory.OTHER]: Priority.LOW
      },
      averageEventDuration: 60,
      bufferTimePreference: 15,
      multitaskingCapability: 0.7,
      reschedulingPatterns: [
        { category: EventCategory.TRADING, flexibility: 20, frequentChanges: false },
        { category: EventCategory.MEETING, flexibility: 30, frequentChanges: false },
        { category: EventCategory.PERSONAL, flexibility: 80, frequentChanges: true }
      ]
    }
  }

  /**
   * 学习用户习惯
   */
  learnFromEvents(events: Event[]): void {
    this.learningData = events
    this.updateHabitsFromData(events)
    // AI学习完成
  }

  private updateHabitsFromData(events: Event[]): void {
    if (events.length === 0) return

    // 分析工作时间偏好
    const workEvents = events.filter(e => 
      e.category === EventCategory.WORK || e.category === EventCategory.MEETING
    )
    
    if (workEvents.length > 0) {
      const workingHours = workEvents.map(e => e.startTime.getHours())
      const minHour = Math.min(...workingHours)
      const maxHour = Math.max(...workingHours)
      
      this.userHabits.preferredWorkingHours = {
        start: Math.max(6, minHour - 1),
        end: Math.min(22, maxHour + 2)
      }
    }

    // 分析类别频率
    const categoryCount: Partial<Record<EventCategory, number>> = {}
    events.forEach(event => {
      categoryCount[event.category] = (categoryCount[event.category] || 0) + 1
    })

    Object.entries(categoryCount).forEach(([category, count]) => {
      this.userHabits.categoryFrequency[category as EventCategory] = count || 0
    })

    // 分析平均事件时长
    const durations = events.map(e => e.estimatedDuration)
    this.userHabits.averageEventDuration = durations.reduce((a, b) => a + b, 0) / durations.length || 60
  }

  /**
   * 智能分析事件
   */
  analyzeEvent(event: Event, context: Event[]): AIAnalysis {
    const cacheKey = `${event.id}-${context.length}`
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!
    }

    const analysis: AIAnalysis = {
      habitScore: this.calculateHabitScore(event),
      energyAlignment: this.calculateEnergyAlignment(event),
      conflictRisk: this.calculateConflictRisk(event, context),
      optimizationScore: 0,
      recommendations: []
    }

    analysis.optimizationScore = (
      analysis.habitScore * 0.3 + 
      analysis.energyAlignment * 0.3 + 
      (1 - analysis.conflictRisk) * 0.4
    )

    analysis.recommendations = this.generateRecommendations(event, context, analysis)

    this.analysisCache.set(cacheKey, analysis)
    return analysis
  }

  private calculateHabitScore(event: Event): number {
    const hour = event.startTime.getHours()
    const { start, end } = this.userHabits.preferredWorkingHours
    
    // 时间匹配度
    let timeScore = 1.0
    if (event.category === EventCategory.WORK || event.category === EventCategory.MEETING) {
      timeScore = (hour >= start && hour <= end) ? 1.0 : 0.3
    }

    // 时长匹配度
    const expectedDuration = this.userHabits.categoryDurations[event.category]
    const durationScore = Math.max(0.1, 1 - Math.abs(event.estimatedDuration - expectedDuration) / expectedDuration)

    return (timeScore * 0.6 + durationScore * 0.4)
  }

  private calculateEnergyAlignment(event: Event): number {
    const hour = event.startTime.getHours()
    const isHighEnergyRequired = event.energyRequired === EnergyLevel.PEAK || event.energyRequired === EnergyLevel.HIGH
    const isPeakHour = this.userHabits.peakEnergyHours.includes(hour)
    const isLowHour = this.userHabits.lowEnergyHours.includes(hour)

    if (isHighEnergyRequired && isPeakHour) return 1.0
    if (isHighEnergyRequired && isLowHour) return 0.2
    if (!isHighEnergyRequired && isLowHour) return 0.8
    if (!isHighEnergyRequired && isPeakHour) return 0.6
    
    return 0.7 // 中性匹配
  }

  private calculateConflictRisk(event: Event, context: Event[]): number {
    const conflicts = context.filter(existing => 
      existing.id !== event.id &&
      this.eventsOverlap(event, existing)
    )

    if (conflicts.length === 0) return 0

    // 考虑冲突的严重程度
    const severeConflicts = conflicts.filter(c => 
      c.priority === Priority.URGENT || c.isMarketProtected
    )

    return Math.min(1, conflicts.length * 0.3 + severeConflicts.length * 0.4)
  }

  private eventsOverlap(event1: Event, event2: Event): boolean {
    return event1.startTime < event2.endTime && event2.startTime < event1.endTime
  }

  private generateRecommendations(event: Event, context: Event[], analysis: AIAnalysis): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    // 时间调整建议
    if (analysis.habitScore < 0.6) {
      recommendations.push({
        type: 'time_adjustment',
        title: '时间安排优化',
        description: `建议将"${event.title}"调整到${this.getSuggestedTimeSlot(event)}`,
        impact: 'medium',
        confidence: 0.8,
        action: 'reschedule'
      })
    }

    // 精力优化建议
    if (analysis.energyAlignment < 0.5) {
      const energyTip = event.energyRequired === EnergyLevel.PEAK 
        ? '建议安排在上午9-11点或下午2-3点的高精力时段'
        : '可以安排在下午1点或傍晚的低精力时段'
      
      recommendations.push({
        type: 'energy_optimization',
        title: '精力匹配优化',
        description: energyTip,
        impact: 'high',
        confidence: 0.9
      })
    }

    // 冲突解决建议
    if (analysis.conflictRisk > 0.3) {
      recommendations.push({
        type: 'conflict_resolution',
        title: '时间冲突处理',
        description: '检测到时间冲突，建议重新安排或缩短事件时长',
        impact: 'high',
        confidence: 0.95,
        action: 'resolve_conflict'
      })
    }

    // 习惯改进建议
    if (analysis.optimizationScore > 0.8) {
      recommendations.push({
        type: 'habit_improvement',
        title: '优秀安排',
        description: '这个时间安排很符合您的习惯，建议保持！',
        impact: 'low',
        confidence: 0.9
      })
    }

    return recommendations
  }

  private getSuggestedTimeSlot(event: Event): string {
    const { start, end } = this.userHabits.preferredWorkingHours
    
    if (event.category === EventCategory.TRADING) {
      return '整点时间（如9:00, 10:00, 11:00）'
    }
    
    if (event.energyRequired === EnergyLevel.PEAK) {
      return `上午${Math.max(9, start)}:00-11:00 或下午14:00-15:00`
    }
    
    return `工作时间内 ${start}:00-${end}:00`
  }

  /**
   * 智能提醒系统
   */
  generateSmartReminders(event: Event): Array<{
    time: Date
    message: string
    type: 'preparation' | 'energy' | 'conflict' | 'habit'
  }> {
    const reminders: Array<{
      time: Date
      message: string
      type: 'preparation' | 'energy' | 'conflict' | 'habit'
    }> = []
    const now = new Date()
    const eventTime = event.startTime

    // 准备提醒
    if (event.category === EventCategory.MEETING || event.category === EventCategory.WORK) {
      const prepTime = new Date(eventTime.getTime() - 30 * 60 * 1000) // 30分钟前
      if (prepTime > now) {
        reminders.push({
          time: prepTime,
          message: `30分钟后开始"${event.title}"，建议准备相关材料`,
          type: 'preparation'
        })
      }
    }

    // 精力管理提醒
    if (event.energyRequired === EnergyLevel.PEAK) {
      const energyTime = new Date(eventTime.getTime() - 60 * 60 * 1000) // 1小时前
      if (energyTime > now) {
        reminders.push({
          time: energyTime,
          message: `1小时后的"${event.title}"需要高精力，建议先休息或补充能量`,
          type: 'energy'
        })
      }
    }

    // Trading特殊提醒
    if (event.category === EventCategory.TRADING) {
      const tradingTime = new Date(eventTime.getTime() - 5 * 60 * 1000) // 5分钟前
      if (tradingTime > now) {
        reminders.push({
          time: tradingTime,
          message: `5分钟后执行"${event.title}"，请准备好交易界面`,
          type: 'preparation'
        })
      }
    }

    return reminders
  }

  /**
   * 智能冲突解决
   */
  resolveConflicts(events: Event[]): Array<{
    conflictId: string
    events: Event[]
    solutions: Array<{
      type: 'reschedule' | 'shorten' | 'merge' | 'prioritize'
      description: string
      confidence: number
      impact: string
    }>
  }> {
    const conflicts = []
    const processedPairs = new Set<string>()

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i]
        const event2 = events[j]
        const pairKey = `${Math.min(i, j)}-${Math.max(i, j)}`
        
        if (processedPairs.has(pairKey)) continue
        processedPairs.add(pairKey)

        if (this.eventsOverlap(event1, event2)) {
          conflicts.push({
            conflictId: `conflict-${i}-${j}`,
            events: [event1, event2],
            solutions: this.generateConflictSolutions(event1, event2)
          })
        }
      }
    }

    return conflicts
  }

  private generateConflictSolutions(event1: Event, event2: Event): Array<{
    type: 'reschedule' | 'shorten' | 'merge' | 'prioritize'
    description: string
    confidence: number
    impact: string
  }> {
    const solutions: Array<{
      type: 'reschedule' | 'shorten' | 'merge' | 'prioritize'
      description: string
      confidence: number
      impact: string
    }> = []

    // 重新安排方案
    const flexibleEvent = event1.flexibilityScore > event2.flexibilityScore ? event1 : event2
    
    solutions.push({
      type: 'reschedule',
      description: `将更灵活的"${flexibleEvent.title}"重新安排到其他时间`,
      confidence: 0.8,
      impact: `影响程度: ${flexibleEvent.flexibilityScore > 70 ? '低' : '中'}`
    })

    // 缩短方案
    if (event1.estimatedDuration > 30 || event2.estimatedDuration > 30) {
      const longerEvent = event1.estimatedDuration > event2.estimatedDuration ? event1 : event2
      solutions.push({
        type: 'shorten',
        description: `缩短"${longerEvent.title}"的时长，为另一个事件让出空间`,
        confidence: 0.6,
        impact: '影响程度: 中'
      })
    }

    // 优先级方案
    const urgentEvent = event1.priority === Priority.URGENT ? event1 : 
                       event2.priority === Priority.URGENT ? event2 : null
    
    if (urgentEvent) {
      const otherEvent = urgentEvent === event1 ? event2 : event1
      solutions.push({
        type: 'prioritize',
        description: `保留紧急事件"${urgentEvent.title}"，推迟"${otherEvent.title}"`,
        confidence: 0.9,
        impact: '影响程度: 高'
      })
    }

    return solutions
  }

  /**
   * 获取AI洞察报告
   */
  getInsights(events: Event[]): {
    habitAnalysis: string
    productivityTips: string[]
    energyOptimization: string
    weeklyPattern: string
  } {
    const workEvents = events.filter(e => 
      e.category === EventCategory.WORK || e.category === EventCategory.MEETING
    )
    
    const tradingEvents = events.filter(e => e.category === EventCategory.TRADING)
    
    return {
      habitAnalysis: `基于${events.length}个事件的分析：您偏好在${this.userHabits.preferredWorkingHours.start}:00-${this.userHabits.preferredWorkingHours.end}:00工作，交易任务占${Math.round(tradingEvents.length / events.length * 100)}%`,
      
      productivityTips: [
        '建议将重要工作安排在上午9-11点的高精力时段',
        'Trading任务保持整点执行的好习惯',
        '会议间隙安排5-15分钟的缓冲时间',
        '下午1-2点适合安排轻松的个人事务'
      ],
      
      energyOptimization: `您的精力模式显示上午${this.userHabits.peakEnergyHours.join(',')}点为高峰期，建议将需要高精力的任务安排在这些时段`,
      
      weeklyPattern: '每周模式：工作日以Trading和工作任务为主，适当穿插休息和锻炼，保持规律的作息习惯'
    }
  }

  // ===== 新增 Claude API 集成方法 =====

  /**
   * 懒加载Claude客户端
   */
  private get claude(): Anthropic | null {
    if (!this._claude) {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
        // Anthropic API key not configured
        return null
      }
      this._claude = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true
      })
    }
    return this._claude
  }

  /**
   * 懒加载OpenAI客户端
   */
  private get openai(): OpenAI | null {
    if (!this._openai) {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        // OpenAI API key not configured
        return null
      }
      this._openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      })
    }
    return this._openai
  }

  /**
   * Claude AI自然语言对话
   */
  async chatWithClaude(message: string): Promise<string> {
    try {
      const claude = this.claude
      if (!claude) {
        // 如果Claude不可用，尝试使用OpenAI
        return this.chatWithOpenAI(message)
      }

      const response = await claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ 
          role: 'user', 
          content: message 
        }],
        system: `你是一个智能日历助手，专门为量化交易者提供时间管理服务。你的任务是：
        1. 理解用户的日程安排需求
        2. 提供智能建议和优化方案
        3. 帮助用户提高工作效率
        4. 特别注意交易时段的保护
        
        请用简洁、专业的中文回答，重点关注实用性。`
      })

      const content = response.content[0]
      if (content.type === 'text') {
        return content.text
      }
      return '抱歉，我无法理解您的请求。'
    } catch (error) {
      // Claude API调用失败
      // 尝试使用备用的OpenAI
      return this.chatWithOpenAI(message)
    }
  }

  /**
   * OpenAI GPT自然语言对话
   */
  async chatWithOpenAI(message: string): Promise<string> {
    try {
      const openai = this.openai
      if (!openai) {
        // 如果OpenAI也不可用，返回本地模拟响应
        return this.generateLocalResponse(message)
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `你是一个智能日历助手，专门为量化交易者提供时间管理服务。你的任务是：
            1. 理解用户的日程安排需求
            2. 提供智能建议和优化方案
            3. 帮助用户提高工作效率
            4. 特别注意交易时段的保护
            
            请用简洁、专业的中文回答，重点关注实用性。`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || '抱歉，我无法理解您的请求。'
    } catch (error) {
      // OpenAI API调用失败
      return this.generateLocalResponse(message)
    }
  }

  /**
   * 本地响应生成（当API不可用时的备用方案）
   */
  private generateLocalResponse(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    // 基本的关键词匹配响应
    if (lowerMessage.includes('创建') || lowerMessage.includes('添加') || lowerMessage.includes('新建')) {
      return '我可以帮您创建新的日程事件。请使用智能事件创建功能，输入事件的详细信息，比如："明天下午2点开会"。'
    }
    
    if (lowerMessage.includes('今天') || lowerMessage.includes('今日')) {
      return '您可以在右侧的今日事件列表中查看今天的所有安排。如需了解详细信息，请点击具体事件。'
    }
    
    if (lowerMessage.includes('建议') || lowerMessage.includes('优化')) {
      return '基于您的日程模式，建议：\n1. 将重要工作安排在上午9-11点的高精力时段\n2. Trading任务保持整点执行\n3. 会议间隙安排5-15分钟的缓冲时间\n4. 下午1-2点适合安排轻松的个人事务'
    }
    
    if (lowerMessage.includes('冲突')) {
      return '系统会自动检测时间冲突。如果存在冲突，会在事件上显示警告标记，您可以通过AI冲突解决功能获取智能建议。'
    }
    
    if (lowerMessage.includes('精力') || lowerMessage.includes('能量')) {
      return '精力管理建议：\n• 上午9-11点：高精力时段，适合处理重要工作\n• 下午1-2点：低精力时段，适合休息或轻松任务\n• 下午3-5点：中等精力，适合常规工作\n• 晚上6-11点：交易时段，需要保持专注'
    }
    
    return '我是您的AI时间管理助手。我可以帮您：\n• 创建和管理日程事件\n• 分析时间使用习惯\n• 提供效率优化建议\n• 解决时间冲突\n\n请告诉我您需要什么帮助？'
  }

  /**
   * 自然语言解析命令
   */
  async parseNaturalLanguage(input: string): Promise<ParsedCommand> {
    try {
      const claude = this.claude
      if (!claude) {
        // 使用本地解析或OpenAI
        const openai = this.openai
        if (!openai) {
          return this.parseLocalNaturalLanguage(input)
        }
        // 使用OpenAI解析
        return this.parseWithOpenAI(input)
      }

      const systemPrompt = `你是一个日程解析专家。请解析用户的自然语言输入，并返回JSON格式的结构化数据。

输入示例："明天下午2点开会，提前1小时提醒发材料"
输出格式：
{
  "intent": "create_event",
  "entities": {
    "title": "开会",
    "dateTime": "明天14:00",
    "duration": 60,
    "category": "meeting",
    "priority": "high"
  },
  "confidence": 0.9,
  "suggestedAction": {
    "type": "create_event_with_reminder",
    "data": {
      "mainEvent": {...},
      "preparationTask": {...},
      "reminders": [...]
    }
  }
}

请解析以下输入：`

      const response = await claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [{ 
          role: 'user', 
          content: `${systemPrompt}\n\n用户输入: "${input}"` 
        }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text)
          return {
            intent: parsed.intent || 'other',
            entities: parsed.entities || {},
            confidence: parsed.confidence || 0.5,
            suggestedAction: parsed.suggestedAction || { type: 'unknown', data: {} }
          }
        } catch (parseError) {
          // JSON解析失败
        }
      }
    } catch (error) {
      // 自然语言解析失败
    }

    // 返回默认值
    return {
      intent: 'other',
      entities: { title: input },
      confidence: 0.3,
      suggestedAction: { type: 'create_simple_event', data: { title: input } }
    }
  }

  /**
   * 使用OpenAI解析自然语言
   */
  private async parseWithOpenAI(input: string): Promise<ParsedCommand> {
    try {
      const openai = this.openai
      if (!openai) {
        return this.parseLocalNaturalLanguage(input)
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `你是一个日程解析专家。请解析用户的自然语言输入，返回JSON格式。
            格式：{"intent": "create_event", "entities": {"title": "...", "dateTime": "...", "duration": 60}, "confidence": 0.9}`
          },
          {
            role: 'user',
            content: `解析: "${input}"`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        return {
          intent: parsed.intent || 'other',
          entities: parsed.entities || {},
          confidence: parsed.confidence || 0.5,
          suggestedAction: parsed.suggestedAction || { type: 'unknown', data: {} }
        }
      }
    } catch (error) {
      // OpenAI解析失败
    }
    return this.parseLocalNaturalLanguage(input)
  }

  /**
   * 本地自然语言解析
   */
  private parseLocalNaturalLanguage(input: string): ParsedCommand {
    const lowerInput = input.toLowerCase()
    const entities: ParsedCommand['entities'] = {}
    let intent: 'create_event' | 'modify_event' | 'query_schedule' | 'set_goal' | 'other' = 'other'
    let confidence = 0.3

    // 时间解析
    const timePatterns = [
      { pattern: /明天/g, value: () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      }},
      { pattern: /今天/g, value: () => new Date().toISOString().split('T')[0] },
      { pattern: /后天/g, value: () => {
        const dayAfter = new Date()
        dayAfter.setDate(dayAfter.getDate() + 2)
        return dayAfter.toISOString().split('T')[0]
      }},
      { pattern: /(\d+)点/g, value: (match: RegExpMatchArray) => `${match[1]}:00` },
      { pattern: /下午(\d+)点/g, value: (match: RegExpMatchArray) => `${parseInt(match[1]) + 12}:00` },
      { pattern: /上午(\d+)点/g, value: (match: RegExpMatchArray) => `${match[1]}:00` }
    ]

    // 检测创建事件意图
    if (lowerInput.includes('创建') || lowerInput.includes('添加') || lowerInput.includes('新建') || lowerInput.includes('安排')) {
      intent = 'create_event'
      confidence = 0.7
    }

    // 提取标题
    const titleMatch = input.match(/["「](.*?)["」]/)
    if (titleMatch) {
      entities.title = titleMatch[1]
    } else {
      // 尝试提取动词后的内容作为标题
      const verbPattern = /(创建|添加|新建|安排|开会|会议|任务|工作|学习|运动|吃饭|休息)/
      const verbMatch = input.match(new RegExp(verbPattern.source + '(.+)'))
      if (verbMatch) {
        entities.title = verbMatch[2].trim()
      }
    }

    // 提取时间
    for (const { pattern, value } of timePatterns) {
      const matches = [...input.matchAll(pattern)]
      if (matches.length > 0) {
        const dateStr = value(matches[0])
        entities.dateTime = dateStr
        confidence = Math.min(confidence + 0.1, 0.9)
      }
    }

    // 提取时长
    const durationMatch = input.match(/(\d+)(小时|分钟)/)
    if (durationMatch) {
      entities.duration = durationMatch[2] === '小时' 
        ? parseInt(durationMatch[1]) * 60 
        : parseInt(durationMatch[1])
      confidence = Math.min(confidence + 0.1, 0.9)
    }

    // 分类检测
    if (lowerInput.includes('会议') || lowerInput.includes('开会')) {
      entities.category = EventCategory.MEETING
      entities.priority = Priority.HIGH
    } else if (lowerInput.includes('工作') || lowerInput.includes('任务')) {
      entities.category = EventCategory.WORK
      entities.priority = Priority.HIGH
    } else if (lowerInput.includes('交易') || lowerInput.includes('trading')) {
      entities.category = EventCategory.TRADING
      entities.priority = Priority.URGENT
    }

    return {
      intent,
      entities,
      confidence,
      suggestedAction: {
        type: intent === 'create_event' ? 'create_event' : 'unknown',
        data: entities
      }
    }
  }

  /**
   * 智能任务分解
   */
  async breakdownTask(task: string, totalHours: number): Promise<SubTask[]> {
    try {
      const claude = this.claude
      const openai = this.openai
      
      if (!claude && !openai) {
        // 使用本地简单分解
        return this.breakdownTaskLocal(task, totalHours)
      }

      const prompt = `作为项目管理专家，请将以下任务分解为可执行的子任务：

任务: "${task}"
总预估时间: ${totalHours}小时

请考虑：
1. 任务的逻辑顺序和依赖关系
2. 不同子任务的精力需求（peak/high/medium/low）
3. 适合的执行时间（morning/afternoon/evening）
4. Trading工作者的作息特点（下午6-11点为交易时间）

返回JSON格式：
[
  {
    "title": "子任务名称",
    "estimatedHours": 2,
    "energyLevel": "high",
    "preferredTimeOfDay": "morning",
    "dependencies": [],
    "category": "work"
  }
]`

      if (claude) {
        const response = await claude.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }]
        })

        const content = response.content[0]
        if (content.type === 'text') {
          try {
            const subtasks = JSON.parse(content.text)
            return subtasks.map((task: Record<string, unknown>) => ({
              title: task.title,
              estimatedHours: task.estimatedHours || 1,
              energyLevel: this.mapEnergyLevel((task.energyLevel as string) || 'medium'),
              preferredTimeOfDay: (task.preferredTimeOfDay as 'morning' | 'afternoon' | 'evening') || 'afternoon',
              dependencies: task.dependencies || [],
              category: this.mapCategoryString((task.category as string) || 'work')
            }))
          } catch (parseError) {
            // 任务分解JSON解析失败
          }
        }
      } else if (openai) {
        // 使用OpenAI分解任务
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '你是项目管理专家，请将任务分解为子任务，返回JSON数组。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5
        })

        const content = response.choices[0]?.message?.content
        if (content) {
          const parsed = JSON.parse(content)
          const subtasks = parsed.subtasks || parsed.tasks || []
          return subtasks.map((task: unknown) => {
            const taskObj = task as Record<string, unknown>
            return {
              title: (taskObj.title as string) || (taskObj.name as string) || '子任务',
              estimatedHours: (taskObj.estimatedHours as number) || (taskObj.hours as number) || 1,
              energyLevel: this.mapEnergyLevel((taskObj.energyLevel as string) || 'medium'),
              preferredTimeOfDay: (taskObj.preferredTimeOfDay as 'morning' | 'afternoon' | 'evening') || 'afternoon',
              dependencies: (taskObj.dependencies as string[]) || [],
              category: this.mapCategoryString((taskObj.category as string) || 'work')
            }
          })
        }
      }
    } catch (error) {
      // 任务分解失败
    }

    // 返回本地分解
    return this.breakdownTaskLocal(task, totalHours)
  }

  /**
   * 生成智能周计划
   */
  async generateSmartPlan(goals: string[]): Promise<WeeklyPlan> {
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    // 简化版本，实际应该使用Claude API生成
    return {
      startDate,
      endDate,
      totalTasks: goals.length * 3, // 每个目标预估3个任务
      totalHours: goals.length * 8, // 每个目标预估8小时
      deepWorkHours: goals.length * 4, // 深度工作占一半
      availableHours: 56, // 一周8小时/天 * 7天
      utilization: Math.min((goals.length * 8) / 56 * 100, 100),
      days: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN'),
        dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).getDay()],
        events: goals.slice(0, 2).map((goal, idx) => ({
          time: `${9 + idx * 2}:00`,
          title: `${goal} - 执行`,
          priority: 2,
          duration: 120
        }))
      }))
    }
  }

  // 辅助方法
  private mapEnergyLevel(level: string): EnergyLevel {
    switch (level?.toLowerCase()) {
      case 'peak': return EnergyLevel.PEAK
      case 'high': return EnergyLevel.HIGH
      case 'medium': return EnergyLevel.MEDIUM
      case 'low': return EnergyLevel.LOW
      default: return EnergyLevel.MEDIUM
    }
  }

  private mapCategoryString(category: string): EventCategory {
    switch (category?.toLowerCase()) {
      case 'work': return EventCategory.WORK
      case 'meeting': return EventCategory.MEETING
      case 'personal': return EventCategory.PERSONAL
      case 'trading': return EventCategory.TRADING
      case 'exercise': return EventCategory.EXERCISE
      case 'meal': return EventCategory.MEAL
      default: return EventCategory.OTHER
    }
  }

  /**
   * 本地任务分解（当API不可用时）
   */
  private breakdownTaskLocal(task: string, totalHours: number): SubTask[] {
    const subtasks: SubTask[] = []
    const lowerTask = task.toLowerCase()
    
    // 基于任务类型的简单分解
    if (lowerTask.includes('开发') || lowerTask.includes('编程') || lowerTask.includes('代码')) {
      const phases = [
        { title: '需求分析和设计', hours: totalHours * 0.2, energy: EnergyLevel.HIGH },
        { title: '核心功能开发', hours: totalHours * 0.4, energy: EnergyLevel.PEAK },
        { title: '测试和调试', hours: totalHours * 0.25, energy: EnergyLevel.MEDIUM },
        { title: '优化和文档', hours: totalHours * 0.15, energy: EnergyLevel.LOW }
      ]
      
      phases.forEach((phase, index) => {
        subtasks.push({
          title: `${task} - ${phase.title}`,
          estimatedHours: Math.max(0.5, phase.hours),
          energyLevel: phase.energy,
          preferredTimeOfDay: index < 2 ? 'morning' : 'afternoon',
          dependencies: index > 0 ? [`${task} - ${phases[index - 1].title}`] : [],
          category: EventCategory.WORK
        })
      })
    } else if (lowerTask.includes('会议') || lowerTask.includes('讨论')) {
      subtasks.push(
        {
          title: `${task} - 准备材料`,
          estimatedHours: totalHours * 0.3,
          energyLevel: EnergyLevel.MEDIUM,
          preferredTimeOfDay: 'morning',
          dependencies: [],
          category: EventCategory.PREPARATION
        },
        {
          title: task,
          estimatedHours: totalHours * 0.5,
          energyLevel: EnergyLevel.HIGH,
          preferredTimeOfDay: 'afternoon',
          dependencies: [`${task} - 准备材料`],
          category: EventCategory.MEETING
        },
        {
          title: `${task} - 后续跟进`,
          estimatedHours: totalHours * 0.2,
          energyLevel: EnergyLevel.LOW,
          preferredTimeOfDay: 'afternoon',
          dependencies: [task],
          category: EventCategory.WORK
        }
      )
    } else if (lowerTask.includes('学习') || lowerTask.includes('研究')) {
      const studyPhases = Math.ceil(totalHours / 2)
      for (let i = 0; i < studyPhases; i++) {
        subtasks.push({
          title: `${task} - 第${i + 1}部分`,
          estimatedHours: Math.min(2, totalHours - i * 2),
          energyLevel: i === 0 ? EnergyLevel.HIGH : EnergyLevel.MEDIUM,
          preferredTimeOfDay: i < studyPhases / 2 ? 'morning' : 'afternoon',
          dependencies: i > 0 ? [`${task} - 第${i}部分`] : [],
          category: EventCategory.PERSONAL
        })
      }
    } else {
      // 默认简单分解
      if (totalHours <= 2) {
        subtasks.push({
          title: task,
          estimatedHours: totalHours,
          energyLevel: EnergyLevel.MEDIUM,
          preferredTimeOfDay: 'afternoon',
          dependencies: [],
          category: EventCategory.WORK
        })
      } else {
        const chunks = Math.ceil(totalHours / 2)
        for (let i = 0; i < chunks; i++) {
          subtasks.push({
            title: `${task} - 阶段${i + 1}`,
            estimatedHours: Math.min(2, totalHours - i * 2),
            energyLevel: i === 0 ? EnergyLevel.HIGH : EnergyLevel.MEDIUM,
            preferredTimeOfDay: i < chunks / 2 ? 'morning' : 'afternoon',
            dependencies: i > 0 ? [`${task} - 阶段${i}`] : [],
            category: EventCategory.WORK
          })
        }
      }
    }
    
    return subtasks
  }
}

// 导出单例实例
export const aiService = new AIService()
export default AIService
