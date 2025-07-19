<template>
  <div class="time-flow-container">
    <!-- 时间流画布 -->
    <canvas 
      ref="canvasRef"
      class="time-flow-canvas"
      @contextmenu.prevent
    ></canvas>
    
    <!-- 控制面板 -->
    <div class="flow-controls">
      <div class="control-group">
        <button 
          @click="centerOnNow" 
          class="control-btn"
          title="回到当前时间"
        >
          📍 现在
        </button>
        
        <button 
          @click="toggleAnimation" 
          class="control-btn"
          :class="{ active: isAnimating }"
          title="切换动画"
        >
          {{ isAnimating ? '⏸️' : '▶️' }} 动画
        </button>
        
        <button 
          @click="optimizeLayout" 
          class="control-btn"
          title="优化布局"
        >
          ✨ 优化
        </button>
      </div>
      
      <div class="control-group">
        <label class="zoom-control">
          缩放: 
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1" 
            v-model="zoomLevel"
            @input="handleZoomChange"
          />
          {{ Math.round(zoomLevel * 100) }}%
        </label>
      </div>
      
      <div class="control-group">
        <button 
          @click="addSampleEvent" 
          class="control-btn add-btn"
          title="添加示例事件"
        >
          ➕ 添加事件
        </button>
      </div>
    </div>
    
    <!-- 事件详情面板 -->
    <div v-if="selectedEvent" class="event-details-panel">
      <div class="panel-header">
        <h3>{{ selectedEvent.title }}</h3>
        <button @click="selectedEvent = null" class="close-btn">×</button>
      </div>
      
      <div class="panel-content">
        <div class="detail-item">
          <label>时间:</label>
          <span>{{ formatEventTime(selectedEvent) }}</span>
        </div>
        
        <div class="detail-item">
          <label>类别:</label>
          <span class="category-tag" :class="`category-${selectedEvent.category}`">
            {{ getCategoryName(selectedEvent.category) }}
          </span>
        </div>
        
        <div class="detail-item">
          <label>优先级:</label>
          <span class="priority-tag" :class="`priority-${selectedEvent.priority}`">
            {{ getPriorityName(selectedEvent.priority) }}
          </span>
        </div>
        
        <div class="detail-item">
          <label>持续时间:</label>
          <span>{{ formatDuration(selectedEvent) }}</span>
        </div>
        
        <div class="detail-actions">
          <button @click="editEvent" class="action-btn">编辑</button>
          <button @click="deleteEvent" class="action-btn danger">删除</button>
        </div>
      </div>
    </div>
    
    <!-- 冲突提示 -->
    <div v-if="conflicts.length > 0" class="conflicts-panel">
      <div class="panel-header">
        <h4>⚠️ 发现 {{ conflicts.length }} 个冲突</h4>
      </div>
      
      <div class="conflicts-list">
        <div 
          v-for="conflict in conflicts" 
          :key="conflict.eventIds.join('-')"
          class="conflict-item"
          :class="`severity-${conflict.severity}`"
        >
          <div class="conflict-type">{{ getConflictTypeName(conflict.type) }}</div>
          <div class="conflict-suggestion">{{ conflict.suggestion }}</div>
          <button @click="resolveConflict(conflict)" class="resolve-btn">
            解决
          </button>
        </div>
      </div>
    </div>
    
    <!-- 状态指示器 -->
    <div class="status-indicator">
      <div class="status-item">
        <span class="status-dot" :class="{ active: engineReady }"></span>
        引擎状态
      </div>
      
      <div class="status-item">
        <span class="status-dot" :class="{ active: isAnimating }"></span>
        动画运行
      </div>
      
      <div class="status-item">
        <span class="status-dot" :class="{ active: events.length > 0 }"></span>
        {{ events.length }} 个事件
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { TimeFlowEngineImpl } from '@/services/timeFlow/TimeFlowEngine'
import type { 
  FlowEvent, 
  TimeFlowConfig, 
  ConflictInfo, 
  FlowPosition 
} from '@/types/timeFlow'

// 响应式数据
const canvasRef = ref<HTMLCanvasElement>()
const engine = ref<TimeFlowEngineImpl>()
const engineReady = ref(false)
const isAnimating = ref(false)
const zoomLevel = ref(1)
const selectedEvent = ref<FlowEvent | null>(null)
const events = ref<FlowEvent[]>([])
const conflicts = ref<ConflictInfo[]>([])

// 时间流配置
const config: TimeFlowConfig = {
  // 渲染配置
  pixelsPerMinute: 2,
  flowSpeed: 1,
  maxVisibleHours: 12,
  
  // 动画配置
  animationDuration: 300,
  easeFunction: 'easeInOut',
  rippleLifetime: 1000,
  
  // 交互配置
  dragThreshold: 5,
  hoverDelay: 200,
  snapToGrid: true,
  
  // 视觉配置
  eventMinHeight: 40,
  eventMaxHeight: 200,
  eventSpacing: 10,
  timeAxisWidth: 80
}

// 计算属性
const formattedZoom = computed(() => Math.round(zoomLevel.value * 100))

// 生命周期
onMounted(async () => {
  await initializeEngine()
  setupEventListeners()
  loadSampleData()
})

onUnmounted(() => {
  if (engine.value) {
    engine.value.destroy()
  }
})

// 监听缩放变化
watch(zoomLevel, (newZoom) => {
  if (engine.value) {
    engine.value.zoomTo(newZoom)
  }
})

// 方法
const initializeEngine = async () => {
  if (!canvasRef.value) return
  
  try {
    engine.value = new TimeFlowEngineImpl()
    
    // 设置画布大小
    const container = canvasRef.value.parentElement!
    canvasRef.value.width = container.clientWidth
    canvasRef.value.height = container.clientHeight
    
    // 初始化引擎
    engine.value.initialize(canvasRef.value, config)
    
    // 设置事件回调
    engine.value.onEventHover((event) => {
      // 悬停事件处理
    })
    
    engine.value.onEventDrop((event, newTime) => {
      // 拖放事件处理
      event.startTime = newTime
      event.endTime = new Date(newTime.getTime() + (event.endTime.getTime() - event.startTime.getTime()))
      updateConflicts()
    })
    
    engineReady.value = true
    console.log('时间流引擎初始化成功')
    
  } catch (error) {
    console.error('时间流引擎初始化失败:', error)
  }
}

const setupEventListeners = () => {
  if (!canvasRef.value) return
  
  // 点击事件
  canvasRef.value.addEventListener('click', (event) => {
    const rect = canvasRef.value!.getBoundingClientRect()
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    // 查找点击的事件
    const clickedEvent = findEventAtPosition(position)
    selectedEvent.value = clickedEvent
  })
  
  // 窗口大小变化
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  if (!canvasRef.value || !engine.value) return
  
  const container = canvasRef.value.parentElement!
  canvasRef.value.width = container.clientWidth
  canvasRef.value.height = container.clientHeight
  
  engine.value.render()
}

const findEventAtPosition = (position: FlowPosition): FlowEvent | null => {
  if (!engine.value) return null
  
  const state = engine.value.getState()
  
  for (const event of state.events) {
    if (position.x >= event.position.x &&
        position.x <= event.position.x + event.size.width &&
        position.y >= event.position.y &&
        position.y <= event.position.y + event.size.height) {
      return event
    }
  }
  
  return null
}

const loadSampleData = () => {
  if (!engine.value) return
  
  const sampleEvents: FlowEvent[] = [
    createSampleEvent('晨会', '09:00', '09:30', 'meeting', 'high'),
    createSampleEvent('项目开发', '10:00', '12:00', 'work', 'high'),
    createSampleEvent('午餐时间', '12:00', '13:00', 'break', 'medium'),
    createSampleEvent('代码审查', '14:00', '15:00', 'work', 'medium'),
    createSampleEvent('客户会议', '15:30', '16:30', 'meeting', 'high'),
    createSampleEvent('健身运动', '18:00', '19:00', 'personal', 'low')
  ]
  
  for (const event of sampleEvents) {
    engine.value.addEvent(event)
    events.value.push(event)
  }
  
  updateConflicts()
  
  // 开始动画
  engine.value.startAnimation()
  isAnimating.value = true
}

const createSampleEvent = (
  title: string, 
  startTime: string, 
  endTime: string, 
  category: string, 
  priority: 'low' | 'medium' | 'high'
): FlowEvent => {
  const today = new Date()
  const start = new Date(today)
  const [startHour, startMinute] = startTime.split(':').map(Number)
  start.setHours(startHour, startMinute, 0, 0)
  
  const end = new Date(today)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  end.setHours(endHour, endMinute, 0, 0)
  
  return {
    id: `event-${Date.now()}-${Math.random()}`,
    title,
    startTime: start,
    endTime: end,
    category,
    priority,
    
    // 流体属性
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    opacity: 1,
    rippleEffects: [],
    
    // 视觉状态
    isHovered: false,
    isDragging: false,
    isConflicted: false,
    isSelected: false,
    
    // 动画属性
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    rotation: 0,
    scale: 1
  }
}

const updateConflicts = () => {
  if (!engine.value) return
  
  conflicts.value = engine.value.detectConflicts()
}

// 控制方法
const centerOnNow = () => {
  if (!engine.value) return
  
  engine.value.centerOnTime(new Date())
}

const toggleAnimation = () => {
  if (!engine.value) return
  
  if (isAnimating.value) {
    engine.value.stopAnimation()
  } else {
    engine.value.startAnimation()
  }
  
  isAnimating.value = !isAnimating.value
}

const optimizeLayout = () => {
  if (!engine.value) return
  
  const state = engine.value.getState()
  // 这里可以调用布局优化算法
  console.log('优化布局', state.events.length, '个事件')
}

const handleZoomChange = () => {
  if (!engine.value) return
  
  engine.value.zoomTo(zoomLevel.value)
}

const addSampleEvent = () => {
  if (!engine.value) return
  
  const now = new Date()
  const start = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后
  const end = new Date(start.getTime() + 30 * 60 * 1000) // 持续30分钟
  
  const newEvent = createSampleEvent(
    `新事件 ${events.value.length + 1}`,
    start.toTimeString().slice(0, 5),
    end.toTimeString().slice(0, 5),
    'work',
    'medium'
  )
  
  engine.value.addEvent(newEvent)
  events.value.push(newEvent)
  updateConflicts()
}

// 事件操作
const editEvent = () => {
  if (!selectedEvent.value) return
  
  // 这里可以打开编辑对话框
  console.log('编辑事件:', selectedEvent.value.title)
}

const deleteEvent = () => {
  if (!selectedEvent.value || !engine.value) return
  
  engine.value.removeEvent(selectedEvent.value.id)
  events.value = events.value.filter(e => e.id !== selectedEvent.value!.id)
  selectedEvent.value = null
  updateConflicts()
}

const resolveConflict = (conflict: ConflictInfo) => {
  if (!engine.value) return
  
  engine.value.resolveConflict(conflict.eventIds.join('-'), 'auto')
  updateConflicts()
}

// 格式化方法
const formatEventTime = (event: FlowEvent): string => {
  const start = event.startTime.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const end = event.endTime.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  return `${start} - ${end}`
}

const formatDuration = (event: FlowEvent): string => {
  const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60)
  return `${Math.round(duration)} 分钟`
}

const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    work: '工作',
    meeting: '会议',
    personal: '个人',
    break: '休息'
  }
  return names[category] || category
}

const getPriorityName = (priority: string): string => {
  const names: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return names[priority] || priority
}

const getConflictTypeName = (type: string): string => {
  const names: Record<string, string> = {
    time_overlap: '时间重叠',
    energy_conflict: '能量冲突',
    priority_conflict: '优先级冲突'
  }
  return names[type] || type
}
</script>

<style scoped>
.time-flow-container {
  position: relative;
  width: 100%;
  height: 600px;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.time-flow-canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.time-flow-canvas:active {
  cursor: grabbing;
}

.flow-controls {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: white;
  color: #495057;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #f8f9fa;
  border-color: #3498db;
}

.control-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.control-btn.add-btn {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.control-btn.add-btn:hover {
  background: #218838;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6c757d;
}

.zoom-control input[type="range"] {
  width: 80px;
}

.event-details-panel {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #3498db;
  color: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.panel-content {
  padding: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.detail-item label {
  font-weight: 500;
  color: #6c757d;
}

.category-tag, .priority-tag {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.category-work { background: #e3f2fd; color: #1976d2; }
.category-meeting { background: #f3e5f5; color: #7b1fa2; }
.category-personal { background: #e8f5e8; color: #388e3c; }
.category-break { background: #fff3e0; color: #f57c00; }

.priority-high { background: #ffebee; color: #d32f2f; }
.priority-medium { background: #fff8e1; color: #f57c00; }
.priority-low { background: #e8f5e8; color: #388e3c; }

.detail-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f8f9fa;
}

.action-btn.danger {
  color: #dc3545;
  border-color: #dc3545;
}

.action-btn.danger:hover {
  background: #dc3545;
  color: white;
}

.conflicts-panel {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.conflicts-panel .panel-header {
  padding: 0.75rem 1rem;
  background: #ffc107;
  color: #212529;
}

.conflicts-panel .panel-header h4 {
  margin: 0;
  font-size: 0.9rem;
}

.conflicts-list {
  max-height: 200px;
  overflow-y: auto;
}

.conflict-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.conflict-item:last-child {
  border-bottom: none;
}

.conflict-type {
  font-weight: 500;
  font-size: 0.8rem;
}

.conflict-suggestion {
  font-size: 0.75rem;
  color: #6c757d;
  line-height: 1.4;
}

.resolve-btn {
  align-self: flex-start;
  padding: 0.25rem 0.5rem;
  border: 1px solid #28a745;
  border-radius: 4px;
  background: white;
  color: #28a745;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s ease;
}

.resolve-btn:hover {
  background: #28a745;
  color: white;
}

.severity-high { border-left: 4px solid #dc3545; }
.severity-medium { border-left: 4px solid #ffc107; }
.severity-low { border-left: 4px solid #17a2b8; }

.status-indicator {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.75rem;
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #6c757d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dee2e6;
  transition: background 0.2s ease;
}

.status-dot.active {
  background: #28a745;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .time-flow-container {
    height: 400px;
  }
  
  .flow-controls {
    position: static;
    margin-bottom: 1rem;
  }
  
  .event-details-panel {
    position: static;
    width: 100%;
    margin-bottom: 1rem;
  }
  
  .conflicts-panel {
    position: static;
    width: 100%;
  }
  
  .status-indicator {
    position: static;
    flex-direction: row;
    justify-content: center;
  }
}
</style>
