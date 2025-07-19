import type { 
  DragInteractionSystem as IDragInteractionSystem, 
  FlowEvent, 
  FlowPosition, 
  ConflictInfo,
  TimeFlowConfig 
} from '@/types/timeFlow'

export class DragInteractionSystem implements IDragInteractionSystem {
  private canvas!: HTMLCanvasElement
  private config!: TimeFlowConfig
  private isDragging = false
  private dragStartPosition: FlowPosition = { x: 0, y: 0 }
  private dragOffset: FlowPosition = { x: 0, y: 0 }
  private ghostElement: HTMLElement | null = null

  initialize(canvas: HTMLCanvasElement, config: TimeFlowConfig): void {
    this.canvas = canvas
    this.config = config
  }

  onDragStart(event: FlowEvent, position: FlowPosition): void {
    this.isDragging = true
    this.dragStartPosition = { ...position }
    
    // 计算拖拽偏移量
    this.dragOffset = {
      x: position.x - event.position.x,
      y: position.y - event.position.y
    }
    
    // 设置事件状态
    event.isDragging = true
    event.isSelected = true
    
    // 显示预览幽灵
    this.showPreviewGhost(event)
    
    // 高亮可放置区域
    this.highlightDropZones(event)
    
    // 添加拖拽样式
    this.canvas.style.cursor = 'grabbing'
    
    console.log(`开始拖拽事件: ${event.title}`)
  }

  onDragMove(event: FlowEvent, position: FlowPosition): void {
    if (!this.isDragging) return
    
    // 更新事件位置
    const newPosition = {
      x: position.x - this.dragOffset.x,
      y: position.y - this.dragOffset.y
    }
    
    // 应用拖拽阈值
    const distance = Math.sqrt(
      Math.pow(position.x - this.dragStartPosition.x, 2) +
      Math.pow(position.y - this.dragStartPosition.y, 2)
    )
    
    if (distance > this.config.dragThreshold) {
      event.position = newPosition
      
      // 更新预览幽灵位置
      this.updatePreviewGhost(position)
      
      // 检查冲突
      const conflicts = this.checkConflicts(event, newPosition)
      event.isConflicted = conflicts.length > 0
      
      // 添加拖拽动画效果
      event.velocity.x = (newPosition.x - event.position.x) * 10
      event.velocity.y = (newPosition.y - event.position.y) * 10
    }
  }

  onDragEnd(event: FlowEvent, position: FlowPosition): void {
    if (!this.isDragging) return
    
    this.isDragging = false
    event.isDragging = false
    
    // 隐藏预览幽灵
    this.hidePreviewGhost()
    
    // 清除高亮区域
    this.clearDropZones()
    
    // 恢复光标
    this.canvas.style.cursor = 'default'
    
    // 检查是否需要吸附到网格
    if (this.config.snapToGrid) {
      this.snapToGrid(event)
    }
    
    // 添加放置动画
    this.addDropAnimation(event)
    
    console.log(`结束拖拽事件: ${event.title}`)
  }

  showPreviewGhost(event: FlowEvent): void {
    // 创建幽灵元素
    this.ghostElement = document.createElement('div')
    this.ghostElement.className = 'time-flow-ghost'
    this.ghostElement.style.cssText = `
      position: fixed;
      width: ${event.size.width}px;
      height: ${event.size.height}px;
      background: rgba(52, 152, 219, 0.3);
      border: 2px dashed #3498db;
      border-radius: 8px;
      pointer-events: none;
      z-index: 1000;
      transition: all 0.1s ease;
    `
    
    document.body.appendChild(this.ghostElement)
  }

  updatePreviewGhost(position: FlowPosition): void {
    if (!this.ghostElement) return
    
    const rect = this.canvas.getBoundingClientRect()
    this.ghostElement.style.left = `${rect.left + position.x - this.dragOffset.x}px`
    this.ghostElement.style.top = `${rect.top + position.y - this.dragOffset.y}px`
  }

  hidePreviewGhost(): void {
    if (this.ghostElement) {
      document.body.removeChild(this.ghostElement)
      this.ghostElement = null
    }
  }

  highlightDropZones(event: FlowEvent): void {
    // 创建可放置区域的视觉提示
    const dropZones = this.calculateDropZones(event)
    
    for (const zone of dropZones) {
      const zoneElement = document.createElement('div')
      zoneElement.className = 'time-flow-drop-zone'
      zoneElement.style.cssText = `
        position: absolute;
        left: ${this.config.timeAxisWidth}px;
        top: ${zone.y}px;
        width: ${zone.width}px;
        height: ${zone.height}px;
        background: ${zone.isValid ? 
          'rgba(40, 167, 69, 0.1)' : 
          'rgba(220, 53, 69, 0.1)'};
        border: 2px dashed ${zone.isValid ? '#28a745' : '#dc3545'};
        border-radius: 4px;
        pointer-events: none;
        z-index: 999;
      `
      
      this.canvas.parentElement?.appendChild(zoneElement)
    }
  }

  clearDropZones(): void {
    const dropZones = document.querySelectorAll('.time-flow-drop-zone')
    dropZones.forEach(zone => zone.remove())
  }

  checkConflicts(event: FlowEvent, position: FlowPosition): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    
    // 简化的冲突检测逻辑
    // 实际实现中会检查时间重叠、能量冲突等
    
    // 检查边界冲突
    if (position.x < this.config.timeAxisWidth) {
      conflicts.push({
        eventIds: [event.id],
        type: 'time_overlap',
        severity: 'medium',
        suggestion: '事件不能放置在时间轴上'
      })
    }
    
    // 检查画布边界
    const canvasRect = this.canvas.getBoundingClientRect()
    if (position.x + event.size.width > canvasRect.width ||
        position.y + event.size.height > canvasRect.height ||
        position.x < 0 || position.y < 0) {
      conflicts.push({
        eventIds: [event.id],
        type: 'time_overlap',
        severity: 'high',
        suggestion: '事件超出可视区域'
      })
    }
    
    return conflicts
  }

  private calculateDropZones(event: FlowEvent) {
    // 计算可放置的时间槽
    const canvasRect = this.canvas.getBoundingClientRect()
    const zones = []
    
    // 示例：每小时一个时间槽
    const slotHeight = 60
    const slotCount = Math.floor(canvasRect.height / slotHeight)
    
    for (let i = 0; i < slotCount; i++) {
      const y = i * slotHeight
      const isValid = this.isValidDropZone(event, y)
      
      zones.push({
        y,
        width: canvasRect.width - this.config.timeAxisWidth,
        height: slotHeight,
        isValid
      })
    }
    
    return zones
  }

  private isValidDropZone(event: FlowEvent, y: number): boolean {
    // 简化的验证逻辑
    // 实际实现中会检查时间冲突、工作时间等
    return y >= 0 && y + event.size.height <= this.canvas.height
  }

  private snapToGrid(event: FlowEvent): void {
    const gridSize = 30 // 30分钟网格
    
    // 吸附到最近的网格点
    event.position.y = Math.round(event.position.y / gridSize) * gridSize
    
    // 确保不超出边界
    event.position.x = Math.max(
      this.config.timeAxisWidth,
      Math.min(event.position.x, this.canvas.width - event.size.width)
    )
    
    event.position.y = Math.max(
      0,
      Math.min(event.position.y, this.canvas.height - event.size.height)
    )
  }

  private addDropAnimation(event: FlowEvent): void {
    // 添加放置时的弹性动画
    event.scale = 1.1
    event.velocity.x = 0
    event.velocity.y = 0
    
    // 模拟弹性效果
    setTimeout(() => {
      event.scale = 1
    }, 200)
  }

  // 清理资源
  destroy(): void {
    this.hidePreviewGhost()
    this.clearDropZones()
    this.canvas.style.cursor = 'default'
  }
}
