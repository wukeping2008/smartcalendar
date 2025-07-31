// 时间流系统类型定义
import { Event } from './event'

export interface TimeFlowEngine {
  // 核心渲染
  render(): void
  update(deltaTime: number): void
  
  // 事件管理
  addEvent(event: Event): void
  removeEvent(eventId: string): void
  updateEvent(eventId: string, updates: Partial<Event>): void
  
  // 视图控制
  setTimeRange(start: Date, end: Date): void
  setFlowSpeed(speed: number): void
  centerOnTime(time: Date): void
  setZoom(level: number): void
  
  // 交互处理
  onEventDrag(callback: (event: Event, position: FlowPosition) => void): void
  onEventDrop(callback: (event: Event, newTime: Date) => void): void
  onEventSelect(callback: (event: Event) => void): void
}

export interface TimeFlowState {
  // 视图状态
  currentTime: Date
  timeRange: TimeRange
  flowSpeed: number
  zoomLevel: number
  
  // 事件状态
  events: Event[]
  selectedEvents: string[]
  draggedEvent: string | null
  hoveredEvent: string | null
  
  // 交互状态
  isPlaying: boolean
  isPaused: boolean
  isDragging: boolean
  
  // 渲染状态
  canvas: HTMLCanvasElement | null
  context: CanvasRenderingContext2D | null
  animationId: number | null
}

export interface TimeRange {
  start: Date
  end: Date
  duration: number // milliseconds
}

export interface FlowPosition {
  x: number
  y: number
  z: number
}

export interface FlowAnimation {
  id: string
  type: AnimationType
  target: string // event id
  startTime: number
  duration: number
  easing: EasingFunction
  properties: AnimationProperties
}

export enum AnimationType {
  FLOAT = 'float',
  RIPPLE = 'ripple',
  PULSE = 'pulse',
  SLIDE = 'slide',
  FADE = 'fade',
  SCALE = 'scale',
  ROTATE = 'rotate'
}

export type EasingFunction = (t: number) => number

export interface AnimationProperties {
  from: Record<string, number>
  to: Record<string, number>
}

// 流体物理系统
export interface FluidPhysics {
  // 粒子系统
  particles: Particle[]
  forces: Force[]
  constraints: Constraint[]
  
  // 物理参数
  gravity: number
  viscosity: number
  density: number
  pressure: number
}

export interface Particle {
  id: string
  position: FlowPosition
  velocity: Vector3D
  acceleration: Vector3D
  mass: number
  radius: number
  color: string
  life: number
}

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface Force {
  id: string
  type: ForceType
  strength: number
  position: FlowPosition
  radius: number
  direction: Vector3D
}

export enum ForceType {
  GRAVITY = 'gravity',
  MAGNETIC = 'magnetic',
  REPULSION = 'repulsion',
  ATTRACTION = 'attraction',
  WIND = 'wind',
  TURBULENCE = 'turbulence'
}

export interface Constraint {
  id: string
  type: ConstraintType
  particleIds: string[]
  restLength?: number
  stiffness?: number
  damping?: number
}

export enum ConstraintType {
  DISTANCE = 'distance',
  PIN = 'pin',
  ROPE = 'rope',
  SPRING = 'spring'
}

// 拖拽交互系统
export interface DragSystem {
  isDragging: boolean
  draggedEvent: Event | null
  dragStartPosition: FlowPosition
  dragCurrentPosition: FlowPosition
  dragPreview: DragPreview | null
  snapTargets: SnapTarget[]
}

export interface DragPreview {
  event: Event
  position: FlowPosition
  opacity: number
  scale: number
  isValid: boolean
}

export interface SnapTarget {
  id: string
  position: FlowPosition
  type: SnapType
  strength: number
  radius: number
}

export enum SnapType {
  TIME_GRID = 'time_grid',
  EVENT_BOUNDARY = 'event_boundary',
  CATEGORY_GROUP = 'category_group',
  PRIORITY_LANE = 'priority_lane'
}

// 涟漪效果系统
export interface RippleSystem {
  ripples: Ripple[]
  maxRipples: number
  fadeSpeed: number
}

export interface Ripple {
  id: string
  center: FlowPosition
  radius: number
  maxRadius: number
  intensity: number
  speed: number
  color: string
  life: number
}

// 时间流渲染配置
export interface TimeFlowConfig {
  // 画布设置
  canvas: {
    width: number
    height: number
    dpi: number
    backgroundColor: string
  }
  
  // 时间轴设置
  timeAxis: {
    pixelsPerMinute: number
    majorTickInterval: number // minutes
    minorTickInterval: number // minutes
    labelFormat: string
    color: string
    fontSize: number
  }
  
  // 事件渲染设置
  eventCard: {
    minWidth: number
    maxWidth: number
    height: number
    cornerRadius: number
    shadowBlur: number
    shadowOffsetX: number
    shadowOffsetY: number
  }
  
  // 动画设置
  animation: {
    fps: number
    flowSpeed: number
    rippleSpeed: number
    particleCount: number
    easing: EasingFunction
  }
  
  // 交互设置
  interaction: {
    snapDistance: number
    dragThreshold: number
    hoverDelay: number
    doubleClickDelay: number
  }
}

// 性能监控
export interface PerformanceMetrics {
  fps: number
  renderTime: number
  updateTime: number
  particleCount: number
  eventCount: number
  memoryUsage: number
}

// 时间流事件
export interface TimeFlowEvent {
  type: TimeFlowEventType
  timestamp: number
  data: any
}

export enum TimeFlowEventType {
  // 渲染事件
  RENDER_START = 'render_start',
  RENDER_END = 'render_end',
  
  // 交互事件
  EVENT_DRAG_START = 'event_drag_start',
  EVENT_DRAG_MOVE = 'event_drag_move',
  EVENT_DRAG_END = 'event_drag_end',
  EVENT_SELECT = 'event_select',
  EVENT_HOVER = 'event_hover',
  
  // 动画事件
  ANIMATION_START = 'animation_start',
  ANIMATION_END = 'animation_end',
  RIPPLE_CREATED = 'ripple_created',
  
  // 系统事件
  TIME_CHANGE = 'time_change',
  ZOOM_CHANGE = 'zoom_change',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved'
}
