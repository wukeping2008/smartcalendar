/**
 * 秉笔太监时间分析引擎
 * 
 * 核心功能：
 * 1. 用户习惯模式分析
 * 2. 时间使用效率评估
 * 3. 生产力趋势预测
 * 4. 个性化优化建议
 */

import { Event, EventCategory, Priority, EnergyLevel, EventStatus } from '../../types/event'

export interface TimePattern {
  category: EventCategory
  preferredHours: number[]
  averageDuration: number
  frequency: number // 每天平均次数
  energyCorrelation: number // 与精力水平的相关性 -1 到 1
}

export interface ProductivityMetrics {
  focusTime: number // 专注时间（分钟）
  fragmentationScore: number // 碎片化程度 0-1，越低越好
  energyAlignment: number // 精力与任务的匹配度 0-1
  completionRate: number // 任务完成率 0-1
  overallEfficiency: number // 总体效率 0-1
}

export interface TimeInsight {
  type: 'pattern' | 'efficiency' | 'energy' | 'scheduling' | 'habit'
  title: string
  description: string
  confidence: number // 0-1
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  recommendation?: string
}

export interface PeriodAnalysis {
  period: 'hour' | 'morning' | 'afternoon' | 'evening'
  startHour: number
  endHour: number
  events: Event[]
  productivity: number // 0-1
  energyUtilization: number // 0-1
  conflictCount: number
  optimalCategories: EventCategory[]
}

export interface HabitStrength {
  category: EventCategory
  consistency: number // 0-1，一致性
  timing: number // 0-1，时间规律性
  duration: number // 0-1，时长稳定性
  overall: number // 0-1，总体习惯强度
}

export class TimeAnalyzer {
  private events: Event[]
  private analysisDate: Date
  
  constructor(events: Event[], analysisDate: Date = new Date()) {
    this.events = events.filter(event => this.isRelevantEvent(event, analysisDate))
    this.analysisDate = analysisDate
  }

  /**
   * 分析用户时间使用模式
   */
  analyzeTimePatterns(): TimePattern[] {
    const patterns: Map<EventCategory, TimePattern> = new Map()
    
    // 按类别分组事件
    const eventsByCategory = this.groupEventsByCategory()
    
    for (const [category, events] of eventsByCategory) {
      const pattern = this.calculateCategoryPattern(category, events)
      patterns.set(category, pattern)
    }
    
    return Array.from(patterns.values()).sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * 计算生产力指标
   */
  calculateProductivityMetrics(): ProductivityMetrics {
    const completedEvents = this.events.filter(e => e.status === EventStatus.COMPLETED)
    const workEvents = this.events.filter(e => 
      e.category === EventCategory.WORK || 
      e.category === EventCategory.MEETING ||
      e.category === EventCategory.TRADING
    )
    
    return {
      focusTime: this.calculateFocusTime(workEvents),
      fragmentationScore: this.calculateFragmentation(),
      energyAlignment: this.calculateEnergyAlignment(),
      completionRate: this.events.length > 0 ? completedEvents.length / this.events.length : 0,
      overallEfficiency: this.calculateOverallEfficiency()
    }
  }

  /**
   * 生成时间洞察
   */
  generateInsights(): TimeInsight[] {
    const insights: TimeInsight[] = []
    const patterns = this.analyzeTimePatterns()
    const metrics = this.calculateProductivityMetrics()
    const periodAnalysis = this.analyzePeriods()
    
    // 模式洞察
    insights.push(...this.generatePatternInsights(patterns))
    
    // 效率洞察
    insights.push(...this.generateEfficiencyInsights(metrics))
    
    // 精力洞察
    insights.push(...this.generateEnergyInsights(periodAnalysis))
    
    // 习惯洞察
    insights.push(...this.generateHabitInsights())
    
    return insights.sort((a, b) => b.confidence * this.getImpactScore(b.impact) - a.confidence * this.getImpactScore(a.impact))
  }

  /**
   * 分析不同时段的表现
   */
  analyzePeriods(): PeriodAnalysis[] {
    const periods: PeriodAnalysis[] = [
      { period: 'morning', startHour: 6, endHour: 12, events: [], productivity: 0, energyUtilization: 0, conflictCount: 0, optimalCategories: [] },
      { period: 'afternoon', startHour: 12, endHour: 18, events: [], productivity: 0, energyUtilization: 0, conflictCount: 0, optimalCategories: [] },
      { period: 'evening', startHour: 18, endHour: 24, events: [], productivity: 0, energyUtilization: 0, conflictCount: 0, optimalCategories: [] }
    ]
    
    // 分配事件到时段
    for (const event of this.events) {
      const hour = event.startTime.getHours()
      const period = periods.find(p => hour >= p.startHour && hour < p.endHour)
      if (period) {
        period.events.push(event)
      }
    }
    
    // 分析每个时段
    for (const period of periods) {
      period.productivity = this.calculatePeriodProductivity(period.events)
      period.energyUtilization = this.calculatePeriodEnergyUtilization(period.events)
      period.conflictCount = this.calculatePeriodConflicts(period.events)
      period.optimalCategories = this.findOptimalCategories(period.events)
    }
    
    return periods
  }

  /**
   * 分析习惯强度
   */
  analyzeHabitStrength(): HabitStrength[] {
    const habits: HabitStrength[] = []
    const eventsByCategory = this.groupEventsByCategory()
    
    for (const [category, events] of eventsByCategory) {
      if (events.length >= 3) { // 至少需要3个事件才能分析习惯
        const habit = this.calculateHabitStrength(category, events)
        habits.push(habit)
      }
    }
    
    return habits.sort((a, b) => b.overall - a.overall)
  }

  /**
   * 预测最佳时间安排
   */
  predictOptimalScheduling(newEvent: Omit<Event, 'id' | 'startTime' | 'endTime'>): Array<{
    startTime: Date
    score: number
    reasoning: string[]
  }> {
    const suggestions: Array<{
      startTime: Date
      score: number
      reasoning: string[]
    }> = []
    
    const patterns = this.analyzeTimePatterns()
    const categoryPattern = patterns.find(p => p.category === newEvent.category)
    
    if (categoryPattern) {
      // 基于历史模式推荐时间
      for (const hour of categoryPattern.preferredHours) {
        const startTime = new Date()
        startTime.setHours(hour, 0, 0, 0)
        
        const score = this.calculateTimeScore(startTime, newEvent, categoryPattern)
        const reasoning = this.generateReasoningForTime(startTime, newEvent, categoryPattern)
        
        suggestions.push({ startTime, score, reasoning })
      }
    }
    
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5)
  }

  // 私有方法实现

  private isRelevantEvent(event: Event, date: Date): boolean {
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    
    return event.startTime >= weekStart && event.startTime < weekEnd
  }

  private groupEventsByCategory(): Map<EventCategory, Event[]> {
    const groups = new Map<EventCategory, Event[]>()
    
    for (const event of this.events) {
      if (!groups.has(event.category)) {
        groups.set(event.category, [])
      }
      groups.get(event.category)!.push(event)
    }
    
    return groups
  }

  private calculateCategoryPattern(category: EventCategory, events: Event[]): TimePattern {
    const hours = events.map(e => e.startTime.getHours())
    const durations = events.map(e => e.estimatedDuration)
    const energyRequirements = events.map(e => this.getEnergyScore(e.energyRequired))
    
    // 找出最常用的时间段
    const hourFrequency = new Map<number, number>()
    hours.forEach(hour => {
      hourFrequency.set(hour, (hourFrequency.get(hour) || 0) + 1)
    })
    
    const preferredHours = Array.from(hourFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour)
    
    return {
      category,
      preferredHours,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      frequency: events.length / 7, // 假设分析一周的数据
      energyCorrelation: this.calculateCorrelation(hours, energyRequirements)
    }
  }

  private calculateFocusTime(workEvents: Event[]): number {
    // 计算连续工作时间块
    const sortedEvents = workEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    let totalFocusTime = 0
    let currentFocusBlock = 0
    let lastEndTime: Date | null = null
    
    for (const event of sortedEvents) {
      if (lastEndTime && event.startTime.getTime() - lastEndTime.getTime() <= 30 * 60 * 1000) {
        // 30分钟内的事件算作连续
        currentFocusBlock += event.estimatedDuration
      } else {
        if (currentFocusBlock >= 60) { // 至少1小时才算专注时间
          totalFocusTime += currentFocusBlock
        }
        currentFocusBlock = event.estimatedDuration
      }
      lastEndTime = event.endTime
    }
    
    if (currentFocusBlock >= 60) {
      totalFocusTime += currentFocusBlock
    }
    
    return totalFocusTime
  }

  private calculateFragmentation(): number {
    const workEvents = this.events.filter(e => 
      e.category === EventCategory.WORK || 
      e.category === EventCategory.MEETING
    )
    
    if (workEvents.length <= 1) return 0
    
    const totalInterruptions = workEvents.length - 1
    const avgInterruptionTime = this.calculateAverageGapBetweenEvents(workEvents)
    
    // 碎片化程度与中断次数和平均间隔时间相关
    return Math.min(1, (totalInterruptions * 0.1) + (avgInterruptionTime / 120)) // 2小时为参考
  }

  private calculateEnergyAlignment(): number {
    let alignmentScore = 0
    let totalEvents = 0
    
    for (const event of this.events) {
      const hour = event.startTime.getHours()
      const isOptimalTime = this.isOptimalTimeForEnergy(hour, event.energyRequired)
      
      if (isOptimalTime) {
        alignmentScore += 1
      } else if (this.isAcceptableTimeForEnergy(hour, event.energyRequired)) {
        alignmentScore += 0.6
      } else {
        alignmentScore += 0.2
      }
      
      totalEvents += 1
    }
    
    return totalEvents > 0 ? alignmentScore / totalEvents : 0
  }

  private calculateOverallEfficiency(): number {
    const metrics = this.calculateProductivityMetrics()
    
    return (
      metrics.completionRate * 0.3 +
      metrics.energyAlignment * 0.25 +
      Math.max(0, 1 - metrics.fragmentationScore) * 0.25 +
      Math.min(1, metrics.focusTime / 480) * 0.2 // 8小时为满分
    )
  }

  private generatePatternInsights(patterns: TimePattern[]): TimeInsight[] {
    const insights: TimeInsight[] = []
    
    for (const pattern of patterns) {
      if (pattern.frequency > 1 && pattern.preferredHours.length > 0) {
        insights.push({
          type: 'pattern',
          title: `${pattern.category}时间模式识别`,
          description: `您倾向于在${pattern.preferredHours.join('点、')}点安排${pattern.category}类任务，平均时长${Math.round(pattern.averageDuration)}分钟`,
          confidence: Math.min(0.9, pattern.frequency / 5),
          impact: pattern.frequency > 3 ? 'high' : 'medium',
          actionable: true,
          recommendation: `建议继续保持这个时间安排模式，效果很好`
        })
      }
    }
    
    return insights
  }

  private generateEfficiencyInsights(metrics: ProductivityMetrics): TimeInsight[] {
    const insights: TimeInsight[] = []
    
    if (metrics.fragmentationScore > 0.6) {
      insights.push({
        type: 'efficiency',
        title: '工作时间过于碎片化',
        description: `您的工作时间被分割成了多个小块，碎片化程度${Math.round(metrics.fragmentationScore * 100)}%`,
        confidence: 0.8,
        impact: 'high',
        actionable: true,
        recommendation: '建议合并相邻的工作任务，创造更长的专注时间块'
      })
    }
    
    if (metrics.completionRate < 0.7) {
      insights.push({
        type: 'efficiency',
        title: '任务完成率偏低',
        description: `当前任务完成率为${Math.round(metrics.completionRate * 100)}%，有改进空间`,
        confidence: 0.9,
        impact: 'high',
        actionable: true,
        recommendation: '建议重新评估任务时长估算，或减少同时进行的任务数量'
      })
    }
    
    return insights
  }

  private generateEnergyInsights(periods: PeriodAnalysis[]): TimeInsight[] {
    const insights: TimeInsight[] = []
    const bestPeriod = periods.reduce((best, current) => 
      current.productivity > best.productivity ? current : best
    )
    
    if (bestPeriod.productivity > 0.7) {
      insights.push({
        type: 'energy',
        title: `${bestPeriod.period}是您的高效时段`,
        description: `${bestPeriod.period}时段的生产力指数为${Math.round(bestPeriod.productivity * 100)}%，表现最佳`,
        confidence: 0.85,
        impact: 'high',
        actionable: true,
        recommendation: `建议将最重要和最需要专注的任务安排在${bestPeriod.period}时段`
      })
    }
    
    return insights
  }

  private generateHabitInsights(): TimeInsight[] {
    const insights: TimeInsight[] = []
    const habits = this.analyzeHabitStrength()
    
    const strongestHabit = habits[0]
    if (strongestHabit && strongestHabit.overall > 0.7) {
      insights.push({
        type: 'habit',
        title: `${strongestHabit.category}习惯已形成`,
        description: `您在${strongestHabit.category}方面已建立了良好的时间习惯，一致性${Math.round(strongestHabit.consistency * 100)}%`,
        confidence: strongestHabit.overall,
        impact: 'medium',
        actionable: false,
        recommendation: '继续保持这个好习惯！'
      })
    }
    
    return insights
  }

  // 辅助方法
  private getEnergyScore(energy: EnergyLevel): number {
    const scores = {
      [EnergyLevel.PEAK]: 4,
      [EnergyLevel.HIGH]: 3,
      [EnergyLevel.MEDIUM]: 2,
      [EnergyLevel.LOW]: 1
    }
    return scores[energy] || 2
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0
    
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private getImpactScore(impact: string): number {
    const scores = { low: 1, medium: 2, high: 3 }
    return scores[impact as keyof typeof scores] || 1
  }

  private calculateAverageGapBetweenEvents(events: Event[]): number {
    if (events.length <= 1) return 0
    
    const sortedEvents = events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    let totalGap = 0
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const gap = sortedEvents[i].startTime.getTime() - sortedEvents[i-1].endTime.getTime()
      totalGap += Math.max(0, gap / (1000 * 60)) // 转换为分钟
    }
    
    return totalGap / (sortedEvents.length - 1)
  }

  private isOptimalTimeForEnergy(hour: number, energyRequired: EnergyLevel): boolean {
    if (energyRequired === EnergyLevel.PEAK) {
      return (hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 15)
    }
    if (energyRequired === EnergyLevel.LOW) {
      return hour >= 13 && hour <= 14 || hour >= 16 && hour <= 18
    }
    return true
  }

  private isAcceptableTimeForEnergy(hour: number, energyRequired: EnergyLevel): boolean {
    if (energyRequired === EnergyLevel.PEAK) {
      return hour >= 8 && hour <= 17
    }
    return true
  }

  private calculatePeriodProductivity(events: Event[]): number {
    if (events.length === 0) return 0
    
    const completedEvents = events.filter(e => e.status === EventStatus.COMPLETED)
    const highPriorityEvents = events.filter(e => e.priority === Priority.HIGH || e.priority === Priority.URGENT)
    
    return (completedEvents.length / events.length) * 0.7 + 
           (highPriorityEvents.length / events.length) * 0.3
  }

  private calculatePeriodEnergyUtilization(events: Event[]): number {
    if (events.length === 0) return 0
    
    const energyScores = events.map(e => this.getEnergyScore(e.energyRequired))
    const averageEnergy = energyScores.reduce((sum, score) => sum + score, 0) / energyScores.length
    
    return Math.min(1, averageEnergy / 4) // 4为最高能量分数
  }

  private calculatePeriodConflicts(events: Event[]): number {
    let conflicts = 0
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (this.eventsOverlap(events[i], events[j])) {
          conflicts++
        }
      }
    }
    
    return conflicts
  }

  private findOptimalCategories(events: Event[]): EventCategory[] {
    const categoryPerformance = new Map<EventCategory, number>()
    
    for (const event of events) {
      const performance = event.status === EventStatus.COMPLETED ? 1 : 0
      categoryPerformance.set(
        event.category, 
        (categoryPerformance.get(event.category) || 0) + performance
      )
    }
    
    return Array.from(categoryPerformance.entries())
      .filter(([, performance]) => performance > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category)
      .slice(0, 3)
  }

  private calculateHabitStrength(category: EventCategory, events: Event[]): HabitStrength {
    const times = events.map(e => e.startTime.getHours())
    const durations = events.map(e => e.estimatedDuration)
    
    // 计算时间一致性（小时）
    const timeVariance = this.calculateVariance(times)
    const timing = Math.max(0, 1 - timeVariance / 48) // 48小时为最大方差
    
    // 计算时长一致性
    const durationVariance = this.calculateVariance(durations)
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const duration = Math.max(0, 1 - durationVariance / (avgDuration * avgDuration))
    
    // 计算频率一致性
    const consistency = Math.min(1, events.length / 7) // 一周内的频率
    
    const overall = (timing * 0.4 + duration * 0.3 + consistency * 0.3)
    
    return {
      category,
      consistency,
      timing,
      duration,
      overall
    }
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
    const squaredDifferences = numbers.map(n => Math.pow(n - mean, 2))
    
    return squaredDifferences.reduce((sum, sq) => sum + sq, 0) / numbers.length
  }

  private calculateTimeScore(startTime: Date, newEvent: Omit<Event, 'id' | 'startTime' | 'endTime'>, pattern: TimePattern): number {
    const hour = startTime.getHours()
    let score = 0.5 // 基础分数
    
    // 基于历史偏好
    if (pattern.preferredHours.includes(hour)) {
      score += 0.3
    }
    
    // 基于精力匹配
    if (this.isOptimalTimeForEnergy(hour, newEvent.energyRequired || EnergyLevel.MEDIUM)) {
      score += 0.2
    }
    
    return Math.min(1, score)
  }

  private generateReasoningForTime(startTime: Date, newEvent: Omit<Event, 'id' | 'startTime' | 'endTime'>, pattern: TimePattern): string[] {
    const reasoning: string[] = []
    const hour = startTime.getHours()
    
    if (pattern.preferredHours.includes(hour)) {
      reasoning.push(`您通常在${hour}点处理${pattern.category}类任务`)
    }
    
    if (this.isOptimalTimeForEnergy(hour, newEvent.energyRequired || EnergyLevel.MEDIUM)) {
      reasoning.push(`这个时间点符合任务的精力需求`)
    }
    
    return reasoning
  }

  private eventsOverlap(event1: Event, event2: Event): boolean {
    return event1.endTime > event2.startTime && event1.startTime < event2.endTime
  }
}
