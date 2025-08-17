'use client'

import { Event, EventCategory, Priority, EnergyLevel } from '../../types/event'

/**
 * AI服务 - 智能日程管理核心引擎
 * 包含：习惯学习、智能提醒、冲突解决、优化推荐
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

class AIService {
  private userHabits: UserHabits
  private learningData: Event[] = []
  private analysisCache: Map<string, AIAnalysis> = new Map()

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
}

// 导出单例实例
export const aiService = new AIService()
export default AIService
