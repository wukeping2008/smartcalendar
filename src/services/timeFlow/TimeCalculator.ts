import type { 
  TimeCalculator as ITimeCalculator, 
  FlowEvent, 
  TimeFlowViewport, 
  FlowPosition, 
  FlowSize, 
  TimeSlot,
  TimeFlowConfig 
} from '@/types/timeFlow'

export class TimeCalculator implements ITimeCalculator {
  private config!: TimeFlowConfig

  initialize(config: TimeFlowConfig): void {
    this.config = config
  }

  timeToY(time: Date, viewport: TimeFlowViewport): number {
    const startTime = viewport.visibleTimeRange.start.getTime()
    const endTime = viewport.visibleTimeRange.end.getTime()
    const timeRange = endTime - startTime
    
    if (timeRange === 0) return 0
    
    const progress = (time.getTime() - startTime) / timeRange
    const canvasHeight = this.getCanvasHeight()
    
    return progress * canvasHeight * viewport.zoom + viewport.offset.y
  }

  yToTime(y: number, viewport: TimeFlowViewport): Date {
    const canvasHeight = this.getCanvasHeight()
    const adjustedY = (y - viewport.offset.y) / viewport.zoom
    const progress = adjustedY / canvasHeight
    
    const startTime = viewport.visibleTimeRange.start.getTime()
    const endTime = viewport.visibleTimeRange.end.getTime()
    const timeRange = endTime - startTime
    
    const targetTime = startTime + progress * timeRange
    return new Date(targetTime)
  }

  getEventDuration(event: FlowEvent): number {
    return event.endTime.getTime() - event.startTime.getTime()
  }

  getTimeSlots(start: Date, end: Date, slotDuration: number): TimeSlot[] {
    const slots: TimeSlot[] = []
    const slotMs = slotDuration * 60 * 1000 // 转换为毫秒
    
    let currentTime = new Date(start)
    
    while (currentTime < end) {
      const slotEnd = new Date(currentTime.getTime() + slotMs)
      
      slots.push({
        start: new Date(currentTime),
        end: slotEnd > end ? new Date(end) : slotEnd,
        isAvailable: this.isTimeSlotAvailable(currentTime, slotEnd),
        conflictLevel: this.calculateConflictLevel(currentTime, slotEnd)
      })
      
      currentTime = slotEnd
    }
    
    return slots
  }

  findFreeTime(events: FlowEvent[], duration: number): TimeSlot[] {
    const freeSlots: TimeSlot[] = []
    const durationMs = duration * 60 * 1000 // 转换为毫秒
    
    // 获取今天的时间范围
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(8, 0, 0, 0) // 从早上8点开始
    
    const endOfDay = new Date(today)
    endOfDay.setHours(22, 0, 0, 0) // 到晚上10点结束
    
    // 按时间排序事件
    const sortedEvents = [...events]
      .filter(event => this.isEventInDateRange(event, startOfDay, endOfDay))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    
    let currentTime = new Date(startOfDay)
    
    for (const event of sortedEvents) {
      // 检查当前时间到事件开始时间之间是否有足够的空闲时间
      const availableTime = event.startTime.getTime() - currentTime.getTime()
      
      if (availableTime >= durationMs) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(currentTime.getTime() + durationMs),
          isAvailable: true,
          conflictLevel: 0
        })
      }
      
      // 更新当前时间到事件结束时间
      currentTime = new Date(Math.max(currentTime.getTime(), event.endTime.getTime()))
    }
    
    // 检查最后一个事件后到一天结束是否有空闲时间
    const remainingTime = endOfDay.getTime() - currentTime.getTime()
    if (remainingTime >= durationMs) {
      freeSlots.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + durationMs),
        isAvailable: true,
        conflictLevel: 0
      })
    }
    
    return freeSlots
  }

  calculateEventPosition(event: FlowEvent, viewport: TimeFlowViewport): FlowPosition {
    const y = this.timeToY(event.startTime, viewport)
    
    // X位置基于事件类别和优先级
    const baseX = this.config.timeAxisWidth + 20
    const categoryOffset = this.getCategoryOffset(event.category)
    const priorityOffset = this.getPriorityOffset(event.priority)
    
    return {
      x: baseX + categoryOffset + priorityOffset,
      y: Math.max(0, y)
    }
  }

  calculateEventSize(event: FlowEvent, viewport: TimeFlowViewport): FlowSize {
    const duration = this.getEventDuration(event)
    const durationMinutes = duration / (1000 * 60)
    
    // 高度基于持续时间
    const baseHeight = Math.max(
      this.config.eventMinHeight,
      durationMinutes * this.config.pixelsPerMinute * viewport.zoom
    )
    
    const height = Math.min(baseHeight, this.config.eventMaxHeight)
    
    // 宽度基于事件类型和重要性
    const baseWidth = this.getBaseWidth(event.category)
    const priorityMultiplier = this.getPriorityMultiplier(event.priority)
    
    return {
      width: baseWidth * priorityMultiplier,
      height
    }
  }

  arrangeOverlappingEvents(events: FlowEvent[]): void {
    // 检测重叠事件并重新排列
    const overlappingGroups = this.findOverlappingGroups(events)
    
    for (const group of overlappingGroups) {
      this.arrangeEventGroup(group)
    }
  }

  optimizeEventLayout(events: FlowEvent[]): void {
    // 优化事件布局，减少重叠和冲突
    
    // 1. 按优先级排序
    const sortedEvents = [...events].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    
    // 2. 重新计算位置
    for (const event of sortedEvents) {
      const optimalPosition = this.findOptimalPosition(event, events)
      if (optimalPosition) {
        event.position = optimalPosition
      }
    }
    
    // 3. 处理重叠
    this.arrangeOverlappingEvents(sortedEvents)
  }

  // 私有辅助方法
  private getCanvasHeight(): number {
    // 假设画布高度，实际应该从配置或DOM获取
    return 800
  }

  private isTimeSlotAvailable(start: Date, end: Date): boolean {
    const hour = start.getHours()
    
    // 工作时间内认为是可用的
    return hour >= 8 && hour <= 18
  }

  private calculateConflictLevel(start: Date, end: Date): number {
    const hour = start.getHours()
    
    // 根据时间段计算冲突级别
    if (hour >= 9 && hour <= 11) return 0.8 // 高效时段，冲突级别高
    if (hour >= 14 && hour <= 16) return 0.6 // 中等时段
    if (hour >= 19 || hour <= 7) return 0.2 // 非工作时间，冲突级别低
    
    return 0.4 // 默认中等冲突级别
  }

  private isEventInDateRange(event: FlowEvent, start: Date, end: Date): boolean {
    return event.startTime >= start && event.endTime <= end
  }

  private getCategoryOffset(category: string): number {
    const offsets: Record<string, number> = {
      work: 0,
      meeting: 100,
      personal: 200,
      break: 300,
      default: 50
    }
    
    return offsets[category] || offsets.default
  }

  private getPriorityOffset(priority: string): number {
    const offsets: Record<string, number> = {
      high: 0,
      medium: 20,
      low: 40
    }
    
    return offsets[priority] || 20
  }

  private getBaseWidth(category: string): number {
    const widths: Record<string, number> = {
      work: 200,
      meeting: 180,
      personal: 160,
      break: 120,
      default: 150
    }
    
    return widths[category] || widths.default
  }

  private getPriorityMultiplier(priority: string): number {
    const multipliers: Record<string, number> = {
      high: 1.2,
      medium: 1.0,
      low: 0.8
    }
    
    return multipliers[priority] || 1.0
  }

  private findOverlappingGroups(events: FlowEvent[]): FlowEvent[][] {
    const groups: FlowEvent[][] = []
    const processed = new Set<string>()
    
    for (const event of events) {
      if (processed.has(event.id)) continue
      
      const group = [event]
      processed.add(event.id)
      
      // 查找与当前事件重叠的其他事件
      for (const otherEvent of events) {
        if (processed.has(otherEvent.id)) continue
        
        if (this.eventsOverlap(event, otherEvent)) {
          group.push(otherEvent)
          processed.add(otherEvent.id)
        }
      }
      
      if (group.length > 1) {
        groups.push(group)
      }
    }
    
    return groups
  }

  private eventsOverlap(event1: FlowEvent, event2: FlowEvent): boolean {
    // 检查时间重叠
    const timeOverlap = event1.startTime < event2.endTime && 
                       event2.startTime < event1.endTime
    
    // 检查位置重叠
    const positionOverlap = this.positionsOverlap(event1, event2)
    
    return timeOverlap || positionOverlap
  }

  private positionsOverlap(event1: FlowEvent, event2: FlowEvent): boolean {
    return event1.position.x < event2.position.x + event2.size.width &&
           event2.position.x < event1.position.x + event1.size.width &&
           event1.position.y < event2.position.y + event2.size.height &&
           event2.position.y < event1.position.y + event1.size.height
  }

  private arrangeEventGroup(group: FlowEvent[]): void {
    // 水平排列重叠的事件
    const spacing = this.config.eventSpacing
    let currentX = group[0].position.x
    
    for (let i = 0; i < group.length; i++) {
      const event = group[i]
      event.position.x = currentX
      currentX += event.size.width + spacing
    }
  }

  private findOptimalPosition(event: FlowEvent, allEvents: FlowEvent[]): FlowPosition | null {
    // 寻找事件的最优位置
    const basePosition = event.position
    const testPositions = this.generateTestPositions(basePosition)
    
    for (const position of testPositions) {
      if (this.isPositionValid(event, position, allEvents)) {
        return position
      }
    }
    
    return null
  }

  private generateTestPositions(basePosition: FlowPosition): FlowPosition[] {
    const positions: FlowPosition[] = []
    const offsets = [-50, -25, 0, 25, 50]
    
    for (const xOffset of offsets) {
      for (const yOffset of offsets) {
        positions.push({
          x: basePosition.x + xOffset,
          y: basePosition.y + yOffset
        })
      }
    }
    
    return positions
  }

  private isPositionValid(
    event: FlowEvent, 
    position: FlowPosition, 
    allEvents: FlowEvent[]
  ): boolean {
    // 检查位置是否在边界内
    if (position.x < this.config.timeAxisWidth || 
        position.y < 0 ||
        position.x + event.size.width > 1000 || // 假设画布宽度
        position.y + event.size.height > this.getCanvasHeight()) {
      return false
    }
    
    // 检查是否与其他事件冲突
    const testEvent = { ...event, position }
    
    for (const otherEvent of allEvents) {
      if (otherEvent.id === event.id) continue
      
      if (this.positionsOverlap(testEvent, otherEvent)) {
        return false
      }
    }
    
    return true
  }

  // 高级时间计算功能
  calculateOptimalMeetingTime(
    participants: string[], 
    duration: number, 
    preferredTimeRange: { start: Date; end: Date }
  ): TimeSlot[] {
    // 计算最佳会议时间
    const slots: TimeSlot[] = []
    
    // 简化实现：返回工作时间内的可用时段
    const workingHours = this.getWorkingHours()
    
    for (const hour of workingHours) {
      const slotStart = new Date(preferredTimeRange.start)
      slotStart.setHours(hour, 0, 0, 0)
      
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000)
      
      if (slotEnd <= preferredTimeRange.end) {
        slots.push({
          start: slotStart,
          end: slotEnd,
          isAvailable: true,
          conflictLevel: this.calculateConflictLevel(slotStart, slotEnd)
        })
      }
    }
    
    return slots.sort((a, b) => a.conflictLevel - b.conflictLevel)
  }

  private getWorkingHours(): number[] {
    return [9, 10, 11, 14, 15, 16, 17]
  }

  // 能量管理相关计算
  calculateEnergyOptimalTime(taskType: string, userEnergyPattern: any): Date {
    const now = new Date()
    const optimalHours: Record<string, number[]> = {
      creative: [9, 10, 11],
      analytical: [10, 11, 14, 15],
      routine: [13, 14, 16, 17],
      social: [11, 14, 15, 16]
    }
    
    const hours = optimalHours[taskType] || optimalHours.routine
    const nextOptimalHour = hours.find(hour => hour > now.getHours()) || hours[0]
    
    const optimalTime = new Date(now)
    if (nextOptimalHour <= now.getHours()) {
      optimalTime.setDate(optimalTime.getDate() + 1)
    }
    optimalTime.setHours(nextOptimalHour, 0, 0, 0)
    
    return optimalTime
  }
}
