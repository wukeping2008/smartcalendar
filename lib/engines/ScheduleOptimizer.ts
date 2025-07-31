/**
 * 秉笔太监智能调度优化引擎
 * 
 * 核心功能：
 * 1. 智能冲突检测与解决
 * 2. 精力水平优化调度
 * 3. 市场保护时段智能避让
 * 4. 工时预算智能分配
 */

import { Event, EventCategory, Priority, EventStatus, EnergyLevel } from '../../types/event'

export interface ConflictResolution {
  conflictId: string
  conflictType: 'time_overlap' | 'energy_overload' | 'market_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedEvents: Event[]
  solutions: ResolutionSolution[]
  recommendation: ResolutionSolution
}

export interface ResolutionSolution {
  id: string
  type: 'reschedule' | 'split' | 'delegate' | 'cancel' | 'merge'
  description: string
  confidence: number // 0-1
  impact: 'minimal' | 'moderate' | 'significant'
  changes: EventChange[]
  energyOptimization: number // 0-1, 越高越优化
  marketCompatibility: number // 0-1, 与市场时段的兼容性
}

export interface EventChange {
  eventId: string
  field: keyof Event
  oldValue: unknown
  newValue: unknown
  reason: string
}

export interface EnergyOptimization {
  currentLoad: number // 0-1
  optimalLoad: number // 0-1
  suggestions: EnergySuggestion[]
  peakHoursUtilization: number // 0-1
  distributionScore: number // 0-1, 越高分配越合理
}

export interface EnergySuggestion {
  type: 'redistribute' | 'add_break' | 'reschedule' | 'reduce_load'
  description: string
  priority: 'low' | 'medium' | 'high'
  eventIds: string[]
  expectedImprovement: number // 0-1
}

export class ScheduleOptimizer {
  private events: Event[] = []
  
  constructor(events: Event[]) {
    this.events = events
  }

  /**
   * 检测所有冲突
   */
  detectConflicts(): ConflictResolution[] {
    const conflicts: ConflictResolution[] = []
    
    // 1. 检测时间重叠冲突
    conflicts.push(...this.detectTimeConflicts())
    
    // 2. 检测精力过载冲突
    conflicts.push(...this.detectEnergyOverload())
    
    // 3. 检测市场保护冲突
    conflicts.push(...this.detectMarketConflicts())
    
    return conflicts.sort((a, b) => this.getSeverityScore(b.severity) - this.getSeverityScore(a.severity))
  }

  /**
   * 检测时间重叠冲突
   */
  private detectTimeConflicts(): ConflictResolution[] {
    const conflicts: ConflictResolution[] = []
    const checkedPairs = new Set<string>()
    
    for (let i = 0; i < this.events.length; i++) {
      for (let j = i + 1; j < this.events.length; j++) {
        const event1 = this.events[i]
        const event2 = this.events[j]
        const pairKey = [event1.id, event2.id].sort().join('-')
        
        if (checkedPairs.has(pairKey)) continue
        checkedPairs.add(pairKey)
        
        if (this.hasTimeOverlap(event1, event2)) {
          const severity = this.calculateConflictSeverity(event1, event2)
          const solutions = this.generateTimeConflictSolutions(event1, event2)
          
          conflicts.push({
            conflictId: `time_conflict_${pairKey}`,
            conflictType: 'time_overlap',
            severity,
            affectedEvents: [event1, event2],
            solutions,
            recommendation: solutions.find(s => s.confidence > 0.7) || solutions[0]
          })
        }
      }
    }
    
    return conflicts
  }

  /**
   * 检测精力过载冲突
   */
  private detectEnergyOverload(): ConflictResolution[] {
    const conflicts: ConflictResolution[] = []
    const energyAnalysis = this.analyzeEnergyDistribution()
    
    if (energyAnalysis.currentLoad > 0.85) {
      const peakEvents = this.events.filter(e => 
        e.energyRequired === EnergyLevel.PEAK || e.energyRequired === EnergyLevel.HIGH
      )
      
      if (peakEvents.length > 0) {
        const solutions = this.generateEnergyOptimizationSolutions(peakEvents)
        
        conflicts.push({
          conflictId: `energy_overload_${Date.now()}`,
          conflictType: 'energy_overload',
          severity: energyAnalysis.currentLoad > 0.95 ? 'critical' : 'high',
          affectedEvents: peakEvents,
          solutions,
          recommendation: solutions.find(s => s.energyOptimization > 0.8) || solutions[0]
        })
      }
    }
    
    return conflicts
  }

  /**
   * 检测市场保护冲突
   */
  private detectMarketConflicts(): ConflictResolution[] {
    const conflicts: ConflictResolution[] = []
    const marketProtectedEvents = this.events.filter(e => e.isMarketProtected)
    
    // 检测非交易事件与市场保护时段的冲突
    for (const protectedEvent of marketProtectedEvents) {
      const conflictingEvents = this.events.filter(e => 
        !e.isMarketProtected && 
        e.category !== EventCategory.TRADING &&
        e.priority !== Priority.URGENT &&
        this.hasTimeOverlap(e, protectedEvent)
      )
      
      if (conflictingEvents.length > 0) {
        const solutions = this.generateMarketConflictSolutions(protectedEvent, conflictingEvents)
        
        conflicts.push({
          conflictId: `market_conflict_${protectedEvent.id}`,
          conflictType: 'market_conflict',
          severity: 'medium',
          affectedEvents: [protectedEvent, ...conflictingEvents],
          solutions,
          recommendation: solutions.find(s => s.marketCompatibility > 0.8) || solutions[0]
        })
      }
    }
    
    return conflicts
  }

  /**
   * 生成时间冲突解决方案
   */
  private generateTimeConflictSolutions(event1: Event, event2: Event): ResolutionSolution[] {
    const solutions: ResolutionSolution[] = []
    
    // 方案1: 重新安排低优先级事件
    const lowerPriorityEvent = this.getLowerPriorityEvent(event1, event2)
    const higherPriorityEvent = lowerPriorityEvent.id === event1.id ? event2 : event1
    
    if (lowerPriorityEvent.flexibilityScore > 50) {
      const newStartTime = new Date(higherPriorityEvent.endTime.getTime() + 15 * 60 * 1000) // 15分钟缓冲
      const newEndTime = new Date(newStartTime.getTime() + lowerPriorityEvent.estimatedDuration * 60 * 1000)
      
      solutions.push({
        id: `reschedule_${lowerPriorityEvent.id}`,
        type: 'reschedule',
        description: `将"${lowerPriorityEvent.title}"重新安排到${newStartTime.toLocaleTimeString('zh-CN')}`,
        confidence: this.calculateRescheduleConfidence(lowerPriorityEvent, newStartTime),
        impact: lowerPriorityEvent.priority === Priority.LOW ? 'minimal' : 'moderate',
        changes: [
          {
            eventId: lowerPriorityEvent.id,
            field: 'startTime',
            oldValue: lowerPriorityEvent.startTime,
            newValue: newStartTime,
            reason: '避免时间冲突'
          },
          {
            eventId: lowerPriorityEvent.id,
            field: 'endTime',
            oldValue: lowerPriorityEvent.endTime,
            newValue: newEndTime,
            reason: '避免时间冲突'
          }
        ],
        energyOptimization: this.calculateEnergyOptimization(lowerPriorityEvent, newStartTime),
        marketCompatibility: this.calculateMarketCompatibility(lowerPriorityEvent, newStartTime)
      })
    }

    return solutions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * 生成精力优化解决方案
   */
  private generateEnergyOptimizationSolutions(peakEvents: Event[]): ResolutionSolution[] {
    const solutions: ResolutionSolution[] = []
    
    // 方案1: 重新分配高精力任务
    const redistributableEvents = peakEvents.filter(e => e.flexibilityScore > 60)
    
    if (redistributableEvents.length > 0) {
      solutions.push({
        id: `redistribute_energy_${Date.now()}`,
        type: 'reschedule',
        description: `重新分配${redistributableEvents.length}个高精力任务到不同时段`,
        confidence: 0.8,
        impact: 'moderate',
        changes: [],
        energyOptimization: 0.9,
        marketCompatibility: 0.7
      })
    }
    
    return solutions
  }

  /**
   * 生成市场冲突解决方案
   */
  private generateMarketConflictSolutions(protectedEvent: Event, conflictingEvents: Event[]): ResolutionSolution[] {
    const solutions: ResolutionSolution[] = []
    
    // 方案1: 移动非交易事件到非市场时段
    const flexibleEvents = conflictingEvents.filter(e => e.flexibilityScore > 70)
    
    if (flexibleEvents.length > 0) {
      solutions.push({
        id: `avoid_market_${protectedEvent.id}`,
        type: 'reschedule',
        description: `将${flexibleEvents.length}个非交易事件移出市场保护时段`,
        confidence: 0.85,
        impact: 'minimal',
        changes: [],
        energyOptimization: 0.6,
        marketCompatibility: 0.95
      })
    }
    
    return solutions
  }

  /**
   * 分析精力分配
   */
  analyzeEnergyDistribution(): EnergyOptimization {
    const totalDuration = this.events.reduce((sum, event) => sum + event.estimatedDuration, 0)
    const peakDuration = this.events
      .filter(e => e.energyRequired === EnergyLevel.PEAK)
      .reduce((sum, event) => sum + event.estimatedDuration, 0)
    
    const currentLoad = totalDuration > 0 ? peakDuration / totalDuration : 0
    const optimalLoad = 0.3 // 30%为理想的高精力任务占比
    
    return {
      currentLoad,
      optimalLoad,
      suggestions: this.generateEnergySuggestions(currentLoad, optimalLoad),
      peakHoursUtilization: Math.min(1, peakDuration / (8 * 60)), // 8小时为一天的工作时间
      distributionScore: Math.max(0, 1 - Math.abs(currentLoad - optimalLoad))
    }
  }

  /**
   * 生成精力建议
   */
  private generateEnergySuggestions(currentLoad: number, optimalLoad: number): EnergySuggestion[] {
    const suggestions: EnergySuggestion[] = []
    
    if (currentLoad > optimalLoad + 0.2) {
      suggestions.push({
        type: 'redistribute',
        description: '高精力任务过多，建议重新分配到不同时段',
        priority: 'high',
        eventIds: this.events.filter(e => e.energyRequired === EnergyLevel.PEAK).map(e => e.id),
        expectedImprovement: 0.3
      })
    }
    
    if (currentLoad > 0.7) {
      suggestions.push({
        type: 'add_break',
        description: '建议在高强度任务间增加休息时间',
        priority: 'medium',
        eventIds: [],
        expectedImprovement: 0.2
      })
    }
    
    return suggestions
  }

  // 辅助方法
  private hasTimeOverlap(event1: Event, event2: Event): boolean {
    return event1.endTime > event2.startTime && event1.startTime < event2.endTime
  }

  private getLowerPriorityEvent(event1: Event, event2: Event): Event {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    const priority1 = priorityOrder[event1.priority] || 0
    const priority2 = priorityOrder[event2.priority] || 0
    
    return priority1 <= priority2 ? event1 : event2
  }

  private calculateConflictSeverity(event1: Event, event2: Event): 'low' | 'medium' | 'high' | 'critical' {
    const hasUrgent = event1.priority === Priority.URGENT || event2.priority === Priority.URGENT
    const hasMarketProtected = event1.isMarketProtected || event2.isMarketProtected
    
    if (hasUrgent && hasMarketProtected) return 'critical'
    if (hasUrgent) return 'high'
    if (hasMarketProtected) return 'medium'
    return 'low'
  }

  private calculateRescheduleConfidence(event: Event, newTime: Date): number {
    let confidence = 0.5
    
    // 基于灵活度调整
    confidence += (event.flexibilityScore / 100) * 0.3
    
    // 基于优先级调整
    if (event.priority === Priority.LOW) confidence += 0.2
    if (event.priority === Priority.URGENT) confidence -= 0.3
    
    return Math.max(0, Math.min(1, confidence))
  }

  private calculateEnergyOptimization(event: Event, newTime: Date): number {
    // 简化实现：基于时间段判断精力优化程度
    const hour = newTime.getHours()
    
    if (event.energyRequired === EnergyLevel.PEAK) {
      // 巅峰精力任务在上午9-11点最优
      if (hour >= 9 && hour <= 11) return 0.9
      if (hour >= 14 && hour <= 16) return 0.7
      return 0.3
    }
    
    return 0.6
  }

  private calculateMarketCompatibility(event: Event, newTime: Date): number {
    const hour = newTime.getHours()
    
    // 如果是交易相关事件，在市场时间兼容性高
    if (event.category === EventCategory.TRADING) {
      if ((hour >= 9 && hour <= 15) || (hour >= 21 && hour <= 23)) return 0.9
      return 0.3
    }
    
    // 非交易事件在市场时间外兼容性高
    if (hour < 9 || (hour > 15 && hour < 21) || hour > 23) return 0.9
    return 0.5
  }

  private getSeverityScore(severity: string): number {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 }
    return scores[severity as keyof typeof scores] || 0
  }
}
