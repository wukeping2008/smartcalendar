import type { 
  RenderSystem as IRenderSystem, 
  FlowEvent, 
  RippleEffect, 
  TimeFlowViewport, 
  ConflictInfo, 
  TimeSlot, 
  FlowPosition,
  TimeFlowConfig 
} from '@/types/timeFlow'

export class RenderSystem implements IRenderSystem {
  private ctx!: CanvasRenderingContext2D
  private config!: TimeFlowConfig
  private gradientCache = new Map<string, CanvasGradient>()

  initialize(ctx: CanvasRenderingContext2D, config: TimeFlowConfig): void {
    this.ctx = ctx
    this.config = config
    
    // 设置高质量渲染
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
  }

  // 基础渲染
  clear(): void {
    const canvas = this.ctx.canvas
    this.ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制背景渐变
    const gradient = this.getOrCreateGradient('background', () => {
      const grad = this.ctx.createLinearGradient(0, 0, 0, canvas.height)
      grad.addColorStop(0, '#f8f9fa')
      grad.addColorStop(0.5, '#ffffff')
      grad.addColorStop(1, '#f1f3f4')
      return grad
    })
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  drawTimeAxis(viewport: TimeFlowViewport): void {
    const canvas = this.ctx.canvas
    const axisWidth = this.config.timeAxisWidth
    
    // 绘制时间轴背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    this.ctx.fillRect(0, 0, axisWidth, canvas.height)
    
    // 绘制时间刻度
    this.drawTimeScale(viewport, axisWidth)
    
    // 绘制当前时间线
    this.drawCurrentTimeLine(viewport, axisWidth)
    
    // 绘制时间轴边框
    this.ctx.strokeStyle = '#e1e5e9'
    this.ctx.lineWidth = 1
    this.ctx.beginPath()
    this.ctx.moveTo(axisWidth, 0)
    this.ctx.lineTo(axisWidth, canvas.height)
    this.ctx.stroke()
  }

  private drawTimeScale(viewport: TimeFlowViewport, axisWidth: number): void {
    const canvas = this.ctx.canvas
    const startTime = viewport.visibleTimeRange.start
    const endTime = viewport.visibleTimeRange.end
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    
    // 计算刻度间隔
    const scaleInterval = this.calculateScaleInterval(totalMinutes, canvas.height)
    
    this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    this.ctx.fillStyle = '#6c757d'
    this.ctx.textAlign = 'right'
    this.ctx.textBaseline = 'middle'
    
    let currentTime = new Date(startTime)
    currentTime.setMinutes(Math.floor(currentTime.getMinutes() / scaleInterval) * scaleInterval, 0, 0)
    
    while (currentTime <= endTime) {
      const y = this.timeToY(currentTime, viewport, canvas.height)
      
      // 绘制刻度线
      const isHour = currentTime.getMinutes() === 0
      const lineLength = isHour ? 20 : 10
      
      this.ctx.strokeStyle = isHour ? '#495057' : '#adb5bd'
      this.ctx.lineWidth = isHour ? 2 : 1
      this.ctx.beginPath()
      this.ctx.moveTo(axisWidth - lineLength, y)
      this.ctx.lineTo(axisWidth, y)
      this.ctx.stroke()
      
      // 绘制时间标签
      if (isHour) {
        const timeText = currentTime.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        this.ctx.fillText(timeText, axisWidth - 25, y)
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + scaleInterval)
    }
  }

  private drawCurrentTimeLine(viewport: TimeFlowViewport, axisWidth: number): void {
    const canvas = this.ctx.canvas
    const now = new Date()
    const y = this.timeToY(now, viewport, canvas.height)
    
    // 绘制当前时间线
    this.ctx.strokeStyle = '#dc3545'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    this.ctx.beginPath()
    this.ctx.moveTo(axisWidth, y)
    this.ctx.lineTo(canvas.width, y)
    this.ctx.stroke()
    this.ctx.setLineDash([])
    
    // 绘制当前时间标签
    this.ctx.fillStyle = '#dc3545'
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    this.ctx.textAlign = 'left'
    this.ctx.fillText('现在', axisWidth + 10, y - 10)
  }

  drawEvent(event: FlowEvent): void {
    this.ctx.save()
    
    // 应用变换
    this.ctx.translate(
      event.position.x + event.size.width / 2,
      event.position.y + event.size.height / 2
    )
    this.ctx.rotate(event.rotation)
    this.ctx.scale(event.scale, event.scale)
    this.ctx.globalAlpha = event.opacity
    
    // 绘制事件阴影
    if (!event.isDragging) {
      this.drawEventShadow(event)
    }
    
    // 绘制事件主体
    this.drawEventBody(event)
    
    // 绘制事件内容
    this.drawEventContent(event)
    
    // 绘制状态指示器
    this.drawEventStateIndicators(event)
    
    this.ctx.restore()
  }

  private drawEventBody(event: FlowEvent): void {
    const width = event.size.width
    const height = event.size.height
    const x = -width / 2
    const y = -height / 2
    const radius = 8
    
    // 创建事件颜色渐变
    const gradient = this.getOrCreateGradient(`event_${event.category}`, () => {
      const colors = this.getEventColors(event.category, event.priority)
      const grad = this.ctx.createLinearGradient(x, y, x, y + height)
      grad.addColorStop(0, colors.primary)
      grad.addColorStop(1, colors.secondary)
      return grad
    })
    
    // 绘制圆角矩形
    this.ctx.fillStyle = gradient
    this.drawRoundedRect(x, y, width, height, radius)
    this.ctx.fill()
    
    // 绘制边框
    if (event.isSelected) {
      this.ctx.strokeStyle = '#007bff'
      this.ctx.lineWidth = 3
    } else if (event.isHovered) {
      this.ctx.strokeStyle = '#6c757d'
      this.ctx.lineWidth = 2
    } else {
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
      this.ctx.lineWidth = 1
    }
    
    this.drawRoundedRect(x, y, width, height, radius)
    this.ctx.stroke()
  }

  private drawEventContent(event: FlowEvent): void {
    const width = event.size.width
    const height = event.size.height
    const padding = 12
    
    // 绘制标题
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    
    const titleY = -height / 2 + padding
    this.drawTextWithEllipsis(event.title, 0, titleY, width - padding * 2)
    
    // 绘制时间信息
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto'
    
    const startTime = event.startTime.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    const endTime = event.endTime.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    const timeText = `${startTime} - ${endTime}`
    
    const timeY = height / 2 - padding - 12
    this.ctx.fillText(timeText, 0, timeY)
  }

  private drawEventStateIndicators(event: FlowEvent): void {
    const width = event.size.width
    const height = event.size.height
    const indicatorSize = 8
    const spacing = 4
    
    let x = width / 2 - indicatorSize - spacing
    const y = -height / 2 + spacing
    
    // 优先级指示器
    if (event.priority === 'high') {
      this.ctx.fillStyle = '#dc3545'
      this.ctx.beginPath()
      this.ctx.arc(x, y, indicatorSize / 2, 0, Math.PI * 2)
      this.ctx.fill()
      x -= indicatorSize + spacing
    }
    
    // 冲突指示器
    if (event.isConflicted) {
      this.ctx.fillStyle = '#ffc107'
      this.ctx.font = `${indicatorSize}px -apple-system`
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText('⚠', x, y)
    }
  }

  drawEventShadow(event: FlowEvent): void {
    const width = event.size.width
    const height = event.size.height
    const x = -width / 2
    const y = -height / 2
    const radius = 8
    const shadowOffset = 4
    
    this.ctx.save()
    this.ctx.globalAlpha = 0.2
    this.ctx.fillStyle = '#000000'
    this.ctx.translate(shadowOffset, shadowOffset)
    this.drawRoundedRect(x, y, width, height, radius)
    this.ctx.fill()
    this.ctx.restore()
  }

  drawRippleEffect(ripple: RippleEffect): void {
    this.ctx.save()
    this.ctx.globalAlpha = ripple.opacity
    
    // 创建径向渐变
    const gradient = this.ctx.createRadialGradient(
      ripple.x, ripple.y, 0,
      ripple.x, ripple.y, ripple.radius
    )
    gradient.addColorStop(0, 'rgba(0, 123, 255, 0.3)')
    gradient.addColorStop(0.7, 'rgba(0, 123, 255, 0.1)')
    gradient.addColorStop(1, 'rgba(0, 123, 255, 0)')
    
    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
    this.ctx.fill()
    
    this.ctx.restore()
  }

  drawConflictIndicator(conflict: ConflictInfo): void {
    // 实现冲突指示器绘制
    this.ctx.save()
    this.ctx.strokeStyle = this.getConflictColor(conflict.severity)
    this.ctx.lineWidth = 3
    this.ctx.setLineDash([10, 5])
    
    // 绘制冲突连接线（简化实现）
    this.ctx.beginPath()
    this.ctx.moveTo(100, 100)
    this.ctx.lineTo(200, 200)
    this.ctx.stroke()
    
    this.ctx.restore()
  }

  drawDropZone(zone: TimeSlot): void {
    // 实现拖放区域绘制
    this.ctx.save()
    this.ctx.fillStyle = zone.isAvailable ? 
      'rgba(40, 167, 69, 0.2)' : 
      'rgba(220, 53, 69, 0.2)'
    
    // 绘制时间槽区域（简化实现）
    this.ctx.fillRect(this.config.timeAxisWidth, 50, 300, 60)
    
    this.ctx.restore()
  }

  // 效果渲染
  applyBlurEffect(radius: number): void {
    this.ctx.filter = `blur(${radius}px)`
  }

  applyGlowEffect(color: string, intensity: number): void {
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = intensity
  }

  drawParticleEffect(position: FlowPosition, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const distance = 20 + Math.random() * 30
      const x = position.x + Math.cos(angle) * distance
      const y = position.y + Math.sin(angle) * distance
      
      this.ctx.fillStyle = `hsla(${Math.random() * 360}, 70%, 60%, ${Math.random()})`
      this.ctx.beginPath()
      this.ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  // 辅助方法
  private getOrCreateGradient(key: string, factory: () => CanvasGradient): CanvasGradient {
    if (!this.gradientCache.has(key)) {
      this.gradientCache.set(key, factory())
    }
    return this.gradientCache.get(key)!
  }

  private getEventColors(category: string, priority: string) {
    const colorMap: Record<string, { primary: string; secondary: string }> = {
      work: { primary: '#3498db', secondary: '#2980b9' },
      personal: { primary: '#2ecc71', secondary: '#27ae60' },
      meeting: { primary: '#9b59b6', secondary: '#8e44ad' },
      break: { primary: '#f39c12', secondary: '#e67e22' },
      default: { primary: '#95a5a6', secondary: '#7f8c8d' }
    }
    
    let colors = colorMap[category] || colorMap.default
    
    // 根据优先级调整颜色
    if (priority === 'high') {
      colors = { primary: '#e74c3c', secondary: '#c0392b' }
    }
    
    return colors
  }

  private getConflictColor(severity: string): string {
    switch (severity) {
      case 'high': return '#dc3545'
      case 'medium': return '#ffc107'
      case 'low': return '#17a2b8'
      default: return '#6c757d'
    }
  }

  private timeToY(time: Date, viewport: TimeFlowViewport, canvasHeight: number): number {
    const startTime = viewport.visibleTimeRange.start.getTime()
    const endTime = viewport.visibleTimeRange.end.getTime()
    const timeRange = endTime - startTime
    const progress = (time.getTime() - startTime) / timeRange
    
    return progress * canvasHeight
  }

  private calculateScaleInterval(totalMinutes: number, canvasHeight: number): number {
    const pixelsPerMinute = canvasHeight / totalMinutes
    
    if (pixelsPerMinute > 4) return 15  // 15分钟间隔
    if (pixelsPerMinute > 2) return 30  // 30分钟间隔
    if (pixelsPerMinute > 1) return 60  // 1小时间隔
    return 120  // 2小时间隔
  }

  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }

  private drawTextWithEllipsis(text: string, x: number, y: number, maxWidth: number): void {
    const metrics = this.ctx.measureText(text)
    if (metrics.width <= maxWidth) {
      this.ctx.fillText(text, x, y)
    } else {
      // 截断文本并添加省略号
      let truncated = text
      while (this.ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1)
      }
      this.ctx.fillText(truncated + '...', x, y)
    }
  }
}
