import type { 
  ConflictDetector as IConflictDetector, 
  FlowEvent, 
  ConflictInfo,
  TimeFlowConfig 
} from '@/types/timeFlow'

export class ConflictDetector implements IConflictDetector {
  private config!: TimeFlowConfig

  initialize(config: TimeFlowConfig): void {
    this.config = config
  }

  detectConflicts(events: FlowEvent[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    
    // 检测时间重叠冲突
    conflicts.push(...this.detectTimeOverlapConflicts(events))
    
    // 检测能量冲突
    conflicts.push(...this.detectEnergyConflicts(events))
    
    // 检测优先级冲突
    conflicts.push(...this.detectPriorityConflicts(events))
    
    return conflicts
  }

  detectTimeOverlap(event1: FlowEvent, event2: FlowEvent): boolean {
    const start1 = event1.startTime.getTime()
    const end1 = event1.endTime.getTime()
    const start2 = event2.startTime.getTime()
    const end2 = event2.endTime.getTime()
    
    // 检查时间段是否重叠
    return start1 < end2 && start2 < end1
  }

  detectEnergyConflict(event: FlowEvent, userState: any): boolean {
    // 简化的能量冲突检测
    // 实际实现中会考虑用户的能量水平、疲劳度等
    
    const eventHour = event.startTime.getHours()
    const eventDuration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60)
    
    // 检查是否在低能量时段安排高强度任务
    if (this.isLowEnergyTime(eventHour) && this.isHighIntensityEvent(event)) {
      return true
    }
    
    // 检查是否连续安排了过多高强度任务
    if (eventDuration > 3 && event.priority === 'high') {
      return true
    }
    
    return false
  }

  calculateConflictSeverity(conflicts: ConflictInfo[]): number {
    if (conflicts.length === 0) return 0
    
    let totalSeverity = 0
    for (const conflict of conflicts) {
      switch (conflict.severity) {
        case 'high':
          totalSeverity += 3
          break
        case 'medium':
          totalSeverity += 2
          break
        case 'low':
          totalSeverity += 1
          break
      }
    }
    
    return Math.min(totalSeverity / conflicts.length, 3)
  }

  generateResolutionSuggestions(conflict: ConflictInfo): string[] {
    const suggestions: string[] = []
    
    switch (conflict.type) {
      case 'time_overlap':
        suggestions.push('调整其中一个事件的时间')
        suggestions.push('缩短事件持续时间')
        suggestions.push('将事件移至其他日期')
        break
        
      case 'energy_conflict':
        suggestions.push('将高强度任务移至高能量时段')
        suggestions.push('在任务间安排休息时间')
        suggestions.push('降低任务强度或分解任务')
        break
        
      case 'priority_conflict':
        suggestions.push('重新评估任务优先级')
        suggestions.push('将低优先级任务延后')
        suggestions.push('寻求帮助或委托任务')
        break
    }
    
    return suggestions
  }

  private detectTimeOverlapConflicts(events: FlowEvent[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i]
        const event2 = events[j]
        
        if (this.detectTimeOverlap(event1, event2)) {
          const overlapDuration = this.calculateOverlapDuration(event1, event2)
          const severity = this.getOverlapSeverity(overlapDuration)
          
          conflicts.push({
            eventIds: [event1.id, event2.id],
            type: 'time_overlap',
            severity,
            suggestion: `事件"${event1.title}"和"${event2.title}"时间重叠${Math.round(overlapDuration)}分钟`
          })
        }
      }
    }
    
    return conflicts
  }

  private detectEnergyConflicts(events: FlowEvent[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    
    // 按时间排序事件
    const sortedEvents = [...events].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    )
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i]
      
      // 检查单个事件的能量冲突
      if (this.detectEnergyConflict(event, {})) {
        conflicts.push({
          eventIds: [event.id],
          type: 'energy_conflict',
          severity: 'medium',
          suggestion: `事件"${event.title}"可能在低能量时段安排了高强度任务`
        })
      }
      
      // 检查连续事件的能量消耗
      if (i > 0) {
        const prevEvent = sortedEvents[i - 1]
        if (this.isConsecutiveHighIntensity(prevEvent, event)) {
          conflicts.push({
            eventIds: [prevEvent.id, event.id],
            type: 'energy_conflict',
            severity: 'high',
            suggestion: `连续的高强度任务可能导致疲劳，建议安排休息时间`
          })
        }
      }
    }
    
    return conflicts
  }

  private detectPriorityConflicts(events: FlowEvent[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    
    const highPriorityEvents = events.filter(e => e.priority === 'high')
    const todayEvents = events.filter(e => this.isToday(e.startTime))
    
    // 检查是否有过多高优先级任务
    if (highPriorityEvents.length > 3) {
      conflicts.push({
        eventIds: highPriorityEvents.map(e => e.id),
        type: 'priority_conflict',
        severity: 'medium',
        suggestion: `今天有${highPriorityEvents.length}个高优先级任务，可能需要重新评估优先级`
      })
    }
    
    // 检查工作日程是否过于紧凑
    if (todayEvents.length > 8) {
      conflicts.push({
        eventIds: todayEvents.map(e => e.id),
        type: 'priority_conflict',
        severity: 'high',
        suggestion: `今天安排了${todayEvents.length}个事件，日程过于紧凑`
      })
    }
    
    return conflicts
  }

  private calculateOverlapDuration(event1: FlowEvent, event2: FlowEvent): number {
    const start1 = event1.startTime.getTime()
    const end1 = event1.endTime.getTime()
    const start2 = event2.startTime.getTime()
    const end2 = event2.endTime.getTime()
    
    const overlapStart = Math.max(start1, start2)
    const overlapEnd = Math.min(end1, end2)
    
    return (overlapEnd - overlapStart) / (1000 * 60) // 返回分钟数
  }

  private getOverlapSeverity(overlapMinutes: number): 'low' | 'medium' | 'high' {
    if (overlapMinutes <= 15) return 'low'
    if (overlapMinutes <= 60) return 'medium'
    return 'high'
  }

  private isLowEnergyTime(hour: number): boolean {
    // 定义低能量时段：午后1-3点，晚上8点后
    return (hour >= 13 && hour <= 15) || hour >= 20
  }

  private isHighIntensityEvent(event: FlowEvent): boolean {
    // 根据事件类型和优先级判断强度
    const highIntensityCategories = ['work', 'meeting']
    return highIntensityCategories.includes(event.category) && 
           event.priority === 'high'
  }

  private isConsecutiveHighIntensity(event1: FlowEvent, event2: FlowEvent): boolean {
    // 检查两个事件是否都是高强度且时间相近
    const timeDiff = event2.startTime.getTime() - event1.endTime.getTime()
    const isConsecutive = timeDiff <= 30 * 60 * 1000 // 30分钟内
    
    return isConsecutive && 
           this.isHighIntensityEvent(event1) && 
           this.isHighIntensityEvent(event2)
  }

  private isToday(date: Date): boolean {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // 智能冲突解决建议
  generateSmartResolution(conflict: ConflictInfo, events: FlowEvent[]): string {
    const conflictEvents = events.filter(e => conflict.eventIds.includes(e.id))
    
    switch (conflict.type) {
      case 'time_overlap':
        return this.generateTimeOverlapResolution(conflictEvents)
        
      case 'energy_conflict':
        return this.generateEnergyConflictResolution(conflictEvents)
        
      case 'priority_conflict':
        return this.generatePriorityConflictResolution(conflictEvents)
        
      default:
        return '建议手动调整冲突事件'
    }
  }

  private generateTimeOverlapResolution(events: FlowEvent[]): string {
    if (events.length !== 2) return '请检查重叠的事件'
    
    const [event1, event2] = events
    const duration1 = event1.endTime.getTime() - event1.startTime.getTime()
    const duration2 = event2.endTime.getTime() - event2.startTime.getTime()
    
    // 建议调整较短的事件
    if (duration1 < duration2) {
      return `建议将"${event1.title}"移至"${event2.title}"结束后`
    } else {
      return `建议将"${event2.title}"移至"${event1.title}"结束后`
    }
  }

  private generateEnergyConflictResolution(events: FlowEvent[]): string {
    const highIntensityEvents = events.filter(e => this.isHighIntensityEvent(e))
    
    if (highIntensityEvents.length > 0) {
      const event = highIntensityEvents[0]
      const optimalHour = this.getOptimalTimeForEvent(event)
      return `建议将"${event.title}"移至${optimalHour}:00，这是您的高效时段`
    }
    
    return '建议在高强度任务间安排15-30分钟休息'
  }

  private generatePriorityConflictResolution(events: FlowEvent[]): string {
    const highPriorityCount = events.filter(e => e.priority === 'high').length
    
    if (highPriorityCount > 3) {
      return `建议重新评估${highPriorityCount}个高优先级任务，将部分任务调整为中等优先级`
    }
    
    return '建议优化任务分配，避免日程过于紧凑'
  }

  private getOptimalTimeForEvent(event: FlowEvent): number {
    // 根据事件类型返回最佳时间
    switch (event.category) {
      case 'work':
        return 9 // 上午9点
      case 'meeting':
        return 10 // 上午10点
      case 'personal':
        return 18 // 下午6点
      default:
        return 14 // 下午2点
    }
  }
}
