import type {
  TimeFlowEngine,
  TimeFlowConfig,
  TimeFlowState,
  TimeFlowViewport,
  FlowEvent,
  FlowPosition,
  ConflictInfo,
  RippleEffect
} from '@/types/timeFlow'
import { AnimationSystem } from './AnimationSystem'
import { RenderSystem } from './RenderSystem'
import { DragInteractionSystem } from './DragInteractionSystem'
import { ConflictDetector } from './ConflictDetector'
import { TimeCalculator } from './TimeCalculator'

export class TimeFlowEngineImpl implements TimeFlowEngine {
  private canvas!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D
  private config!: TimeFlowConfig
  private state: TimeFlowState
  private animationId: number | null = null
  private lastFrameTime = 0

  // 子系统
  private animationSystem: AnimationSystem
  private renderSystem: RenderSystem
  private dragSystem: DragInteractionSystem
  private conflictDetector: ConflictDetector
  private timeCalculator: TimeCalculator

  // 事件回调
  private eventDragCallback?: (event: FlowEvent, position: FlowPosition) => void
  private eventDropCallback?: (event: FlowEvent, newTime: Date) => void
  private eventHoverCallback?: (event: FlowEvent | null) => void

  constructor() {
    // 初始化状态
    this.state = {
      events: [],
      viewport: {
        centerTime: new Date(),
        visibleTimeRange: {
          start: new Date(),
          end: new Date()
        },
        zoom: 1,
        offset: { x: 0, y: 0 }
      },
      conflicts: [],
      interactions: [],
      isAnimating: false,
      selectedEventId: null
    }

    // 初始化子系统
    this.animationSystem = new AnimationSystem()
    this.renderSystem = new RenderSystem()
    this.dragSystem = new DragInteractionSystem()
    this.conflictDetector = new ConflictDetector()
    this.timeCalculator = new TimeCalculator()
  }

  initialize(canvas: HTMLCanvasElement, config: TimeFlowConfig): void {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.config = config

    // 初始化子系统
    this.renderSystem.initialize(this.ctx, config)
    this.dragSystem.initialize(canvas, config)
    this.conflictDetector.initialize(config)
    this.timeCalculator.initialize(config)

    // 设置初始视口
    this.updateViewport()

    // 绑定事件监听器
    this.bindEventListeners()

    console.log('时间流引擎初始化完成')
  }

  private updateViewport(): void {
    const now = new Date()
    const startTime = new Date(now.getTime() - this.config.maxVisibleHours * 60 * 60 * 1000 / 2)
    const endTime = new Date(now.getTime() + this.config.maxVisibleHours * 60 * 60 * 1000 / 2)

    this.state.viewport = {
      centerTime: now,
      visibleTimeRange: { start: startTime, end: endTime },
      zoom: 1,
      offset: { x: 0, y: 0 }
    }
  }

  private bindEventListeners(): void {
    // 鼠标事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this))
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this))

    // 触摸事件
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this))
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this))
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this))

    // 窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  private handleMouseDown(event: MouseEvent): void {
    const position = this.getMousePosition(event)
    const clickedEvent = this.getEventAtPosition(position)

    if (clickedEvent) {
      this.state.selectedEventId = clickedEvent.id
      this.dragSystem.onDragStart(clickedEvent, position)
      
      if (this.eventDragCallback) {
        this.eventDragCallback(clickedEvent, position)
      }
    } else {
      this.state.selectedEventId = null
      this.addRippleEffect(position)
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const position = this.getMousePosition(event)
    const hoveredEvent = this.getEventAtPosition(position)

    // 更新悬停状态
    this.state.events.forEach(evt => {
      evt.isHovered = evt.id === hoveredEvent?.id
    })

    if (this.eventHoverCallback) {
      this.eventHoverCallback(hoveredEvent)
    }

    // 处理拖拽
    if (this.state.selectedEventId) {
      const selectedEvent = this.state.events.find(e => e.id === this.state.selectedEventId)
      if (selectedEvent) {
        this.dragSystem.onDragMove(selectedEvent, position)
      }
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const position = this.getMousePosition(event)
    
    if (this.state.selectedEventId) {
      const selectedEvent = this.state.events.find(e => e.id === this.state.selectedEventId)
      if (selectedEvent) {
        this.dragSystem.onDragEnd(selectedEvent, position)
        
        // 计算新时间
        const newTime = this.timeCalculator.yToTime(position.y, this.state.viewport)
        
        if (this.eventDropCallback) {
          this.eventDropCallback(selectedEvent, newTime)
        }
      }
    }
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault()
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(5, this.state.viewport.zoom * zoomFactor))
    
    this.zoomTo(newZoom)
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      this.handleMouseDown(mouseEvent)
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault()
    
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      })
      this.handleMouseMove(mouseEvent)
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const mouseEvent = new MouseEvent('mouseup', {})
    this.handleMouseUp(mouseEvent)
  }

  private handleResize(): void {
    // 更新画布大小
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * window.devicePixelRatio
    this.canvas.height = rect.height * window.devicePixelRatio
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // 重新渲染
    this.render()
  }

  private getMousePosition(event: MouseEvent): FlowPosition {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  private getEventAtPosition(position: FlowPosition): FlowEvent | null {
    for (const event of this.state.events) {
      if (this.isPositionInEvent(position, event)) {
        return event
      }
    }
    return null
  }

  private isPositionInEvent(position: FlowPosition, event: FlowEvent): boolean {
    return position.x >= event.position.x &&
           position.x <= event.position.x + event.size.width &&
           position.y >= event.position.y &&
           position.y <= event.position.y + event.size.height
  }

  // 公共API实现
  render(): void {
    this.renderSystem.clear()
    this.renderSystem.drawTimeAxis(this.state.viewport)
    
    // 绘制事件
    for (const event of this.state.events) {
      this.renderSystem.drawEvent(event)
      
      if (event.isConflicted) {
        this.renderSystem.drawConflictIndicator(this.getEventConflicts(event.id))
      }
    }
    
    // 绘制涟漪效果
    for (const event of this.state.events) {
      for (const ripple of event.rippleEffects) {
        this.renderSystem.drawRippleEffect(ripple)
      }
    }
    
    // 绘制冲突指示器
    for (const conflict of this.state.conflicts) {
      this.renderSystem.drawConflictIndicator(conflict)
    }
  }

  startAnimation(): void {
    if (this.animationId) return
    
    this.state.isAnimating = true
    this.lastFrameTime = performance.now()
    this.animationLoop()
  }

  stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.state.isAnimating = false
  }

  private animationLoop(): void {
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    // 更新动画
    this.animationSystem.animateFlow(this.state.events, deltaTime)
    this.updateRippleEffects()

    // 渲染
    this.render()

    // 继续动画循环
    this.animationId = requestAnimationFrame(() => this.animationLoop())
  }

  addEvent(event: FlowEvent): void {
    // 计算事件位置和大小
    event.position = this.timeCalculator.calculateEventPosition(event, this.state.viewport)
    event.size = this.timeCalculator.calculateEventSize(event, this.state.viewport)
    
    this.state.events.push(event)
    this.detectConflicts()
    
    // 添加入场动画
    this.animationSystem.animateEventScale(event, 1)
  }

  removeEvent(eventId: string): void {
    const eventIndex = this.state.events.findIndex(e => e.id === eventId)
    if (eventIndex !== -1) {
      const event = this.state.events[eventIndex]
      
      // 添加退场动画
      this.animationSystem.animateEventOpacity(event, 0).then(() => {
        this.state.events.splice(eventIndex, 1)
        this.detectConflicts()
      })
    }
  }

  updateEvent(eventId: string, updates: Partial<FlowEvent>): void {
    const event = this.state.events.find(e => e.id === eventId)
    if (event) {
      Object.assign(event, updates)
      
      // 重新计算位置和大小
      event.position = this.timeCalculator.calculateEventPosition(event, this.state.viewport)
      event.size = this.timeCalculator.calculateEventSize(event, this.state.viewport)
      
      this.detectConflicts()
    }
  }

  setViewport(viewport: Partial<TimeFlowViewport>): void {
    Object.assign(this.state.viewport, viewport)
    
    // 重新计算所有事件的位置
    for (const event of this.state.events) {
      event.position = this.timeCalculator.calculateEventPosition(event, this.state.viewport)
      event.size = this.timeCalculator.calculateEventSize(event, this.state.viewport)
    }
  }

  centerOnTime(time: Date): void {
    this.state.viewport.centerTime = time
    
    const halfRange = this.config.maxVisibleHours * 60 * 60 * 1000 / 2
    this.state.viewport.visibleTimeRange = {
      start: new Date(time.getTime() - halfRange),
      end: new Date(time.getTime() + halfRange)
    }
    
    this.setViewport(this.state.viewport)
  }

  zoomTo(level: number): void {
    this.state.viewport.zoom = level
    this.setViewport(this.state.viewport)
  }

  onEventDrag(callback: (event: FlowEvent, position: FlowPosition) => void): void {
    this.eventDragCallback = callback
  }

  onEventDrop(callback: (event: FlowEvent, newTime: Date) => void): void {
    this.eventDropCallback = callback
  }

  onEventHover(callback: (event: FlowEvent | null) => void): void {
    this.eventHoverCallback = callback
  }

  detectConflicts(): ConflictInfo[] {
    this.state.conflicts = this.conflictDetector.detectConflicts(this.state.events)
    
    // 更新事件的冲突状态
    for (const event of this.state.events) {
      event.isConflicted = this.state.conflicts.some(conflict => 
        conflict.eventIds.includes(event.id)
      )
    }
    
    return this.state.conflicts
  }

  resolveConflict(conflictId: string, resolution: string): void {
    // 实现冲突解决逻辑
    console.log(`解决冲突 ${conflictId}: ${resolution}`)
  }

  addRippleEffect(position: FlowPosition): void {
    const ripple: RippleEffect = {
      x: position.x,
      y: position.y,
      radius: 0,
      opacity: 1,
      timestamp: Date.now()
    }
    
    // 找到最近的事件添加涟漪效果
    const nearestEvent = this.findNearestEvent(position)
    if (nearestEvent) {
      nearestEvent.rippleEffects.push(ripple)
    }
  }

  updateRippleEffects(): void {
    const now = Date.now()
    
    for (const event of this.state.events) {
      event.rippleEffects = event.rippleEffects.filter(ripple => {
        const age = now - ripple.timestamp
        if (age > this.config.rippleLifetime) {
          return false
        }
        
        // 更新涟漪效果
        this.animationSystem.animateRipple(ripple, age)
        return true
      })
    }
  }

  private findNearestEvent(position: FlowPosition): FlowEvent | null {
    let nearest: FlowEvent | null = null
    let minDistance = Infinity
    
    for (const event of this.state.events) {
      const distance = Math.sqrt(
        Math.pow(position.x - (event.position.x + event.size.width / 2), 2) +
        Math.pow(position.y - (event.position.y + event.size.height / 2), 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearest = event
      }
    }
    
    return nearest
  }

  private getEventConflicts(eventId: string): ConflictInfo {
    return this.state.conflicts.find(conflict => 
      conflict.eventIds.includes(eventId)
    ) || {
      eventIds: [eventId],
      type: 'time_overlap',
      severity: 'low',
      suggestion: '无冲突'
    }
  }

  getState(): TimeFlowState {
    return { ...this.state }
  }

  setState(state: Partial<TimeFlowState>): void {
    Object.assign(this.state, state)
  }

  destroy(): void {
    this.stopAnimation()
    
    // 移除事件监听器
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('wheel', this.handleWheel)
    this.canvas.removeEventListener('touchstart', this.handleTouchStart)
    this.canvas.removeEventListener('touchmove', this.handleTouchMove)
    this.canvas.removeEventListener('touchend', this.handleTouchEnd)
    window.removeEventListener('resize', this.handleResize)
    
    console.log('时间流引擎已销毁')
  }
}
