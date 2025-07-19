// 时间流相关类型定义

export interface FlowPosition {
  x: number
  y: number
}

export interface FlowSize {
  width: number
  height: number
}

export interface RippleEffect {
  x: number
  y: number
  radius: number
  opacity: number
  timestamp: number
}

export interface FlowEvent {
  id: string
  title: string
  startTime: Date
  endTime: Date
  category: string
  priority: 'low' | 'medium' | 'high'
  
  // 流体属性
  position: FlowPosition
  size: FlowSize
  opacity: number
  rippleEffects: RippleEffect[]
  
  // 视觉状态
  isHovered: boolean
  isDragging: boolean
  isConflicted: boolean
  isSelected: boolean
  
  // 动画属性
  velocity: { x: number; y: number }
  acceleration: { x: number; y: number }
  rotation: number
  scale: number
}

export interface TimeFlowConfig {
  // 渲染配置
  pixelsPerMinute: number
  flowSpeed: number
  maxVisibleHours: number
  
  // 动画配置
  animationDuration: number
  easeFunction: string
  rippleLifetime: number
  
  // 交互配置
  dragThreshold: number
  hoverDelay: number
  snapToGrid: boolean
  
  // 视觉配置
  eventMinHeight: number
  eventMaxHeight: number
  eventSpacing: number
  timeAxisWidth: number
}

export interface TimeFlowViewport {
  centerTime: Date
  visibleTimeRange: {
    start: Date
    end: Date
  }
  zoom: number
  offset: FlowPosition
}

export interface ConflictInfo {
  eventIds: string[]
  type: 'time_overlap' | 'energy_conflict' | 'priority_conflict'
  severity: 'low' | 'medium' | 'high'
  suggestion: string
}

export interface TimeSlot {
  start: Date
  end: Date
  isAvailable: boolean
  conflictLevel: number
  energyLevel?: number
}

export interface FlowInteraction {
  type: 'drag' | 'hover' | 'click' | 'drop'
  eventId: string
  position: FlowPosition
  timestamp: number
  data?: any
}

export interface TimeFlowState {
  events: FlowEvent[]
  viewport: TimeFlowViewport
  conflicts: ConflictInfo[]
  interactions: FlowInteraction[]
  isAnimating: boolean
  selectedEventId: string | null
}

// 时间流引擎接口
export interface TimeFlowEngine {
  // 初始化
  initialize(canvas: HTMLCanvasElement, config: TimeFlowConfig): void
  
  // 渲染
  render(): void
  startAnimation(): void
  stopAnimation(): void
  
  // 事件管理
  addEvent(event: FlowEvent): void
  removeEvent(eventId: string): void
  updateEvent(eventId: string, updates: Partial<FlowEvent>): void
  
  // 视图控制
  setViewport(viewport: Partial<TimeFlowViewport>): void
  centerOnTime(time: Date): void
  zoomTo(level: number): void
  
  // 交互处理
  onEventDrag(callback: (event: FlowEvent, position: FlowPosition) => void): void
  onEventDrop(callback: (event: FlowEvent, newTime: Date) => void): void
  onEventHover(callback: (event: FlowEvent | null) => void): void
  
  // 冲突检测
  detectConflicts(): ConflictInfo[]
  resolveConflict(conflictId: string, resolution: string): void
  
  // 效果系统
  addRippleEffect(position: FlowPosition): void
  updateRippleEffects(): void
  
  // 状态管理
  getState(): TimeFlowState
  setState(state: Partial<TimeFlowState>): void
  
  // 清理
  destroy(): void
}

// 拖拽交互系统
export interface DragInteractionSystem {
  onDragStart(event: FlowEvent, position: FlowPosition): void
  onDragMove(event: FlowEvent, position: FlowPosition): void
  onDragEnd(event: FlowEvent, position: FlowPosition): void
  
  showPreviewGhost(event: FlowEvent): void
  updatePreviewGhost(position: FlowPosition): void
  hidePreviewGhost(): void
  
  highlightDropZones(event: FlowEvent): void
  clearDropZones(): void
  
  checkConflicts(event: FlowEvent, position: FlowPosition): ConflictInfo[]
}

// 动画系统
export interface AnimationSystem {
  // 基础动画
  animateProperty(
    target: any,
    property: string,
    from: number,
    to: number,
    duration: number,
    easing?: string
  ): Promise<void>
  
  // 流体动画
  animateFlow(events: FlowEvent[], deltaTime: number): void
  animateRipple(ripple: RippleEffect, deltaTime: number): void
  
  // 过渡动画
  animateEventMove(event: FlowEvent, newPosition: FlowPosition): Promise<void>
  animateEventScale(event: FlowEvent, scale: number): Promise<void>
  animateEventOpacity(event: FlowEvent, opacity: number): Promise<void>
  
  // 缓动函数
  easeInOut(t: number): number
  easeElastic(t: number): number
  easeFlow(t: number): number
}

// 渲染系统
export interface RenderSystem {
  // 基础渲染
  clear(): void
  drawTimeAxis(viewport: TimeFlowViewport): void
  drawEvent(event: FlowEvent): void
  drawRippleEffect(ripple: RippleEffect): void
  
  // 高级渲染
  drawEventShadow(event: FlowEvent): void
  drawConflictIndicator(conflict: ConflictInfo): void
  drawDropZone(zone: TimeSlot): void
  
  // 效果渲染
  applyBlurEffect(radius: number): void
  applyGlowEffect(color: string, intensity: number): void
  drawParticleEffect(position: FlowPosition, count: number): void
}

// 工具函数类型
export type TimeCalculator = {
  timeToY(time: Date, viewport: TimeFlowViewport): number
  yToTime(y: number, viewport: TimeFlowViewport): Date
  getEventDuration(event: FlowEvent): number
  getTimeSlots(start: Date, end: Date, slotDuration: number): TimeSlot[]
  findFreeTime(events: FlowEvent[], duration: number): TimeSlot[]
}

export type ConflictDetector = {
  detectTimeOverlap(event1: FlowEvent, event2: FlowEvent): boolean
  detectEnergyConflict(event: FlowEvent, userState: any): boolean
  calculateConflictSeverity(conflicts: ConflictInfo[]): number
  generateResolutionSuggestions(conflict: ConflictInfo): string[]
}

export type EventPositioner = {
  calculateEventPosition(event: FlowEvent, viewport: TimeFlowViewport): FlowPosition
  calculateEventSize(event: FlowEvent, viewport: TimeFlowViewport): FlowSize
  arrangeOverlappingEvents(events: FlowEvent[]): void
  optimizeEventLayout(events: FlowEvent[]): void
}
