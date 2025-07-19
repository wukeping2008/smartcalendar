import type { AnimationSystem as IAnimationSystem, FlowEvent, RippleEffect, FlowPosition } from '@/types/timeFlow'

export class AnimationSystem implements IAnimationSystem {
  private activeAnimations = new Map<string, any>()

  // 基础动画
  async animateProperty(
    target: any,
    property: string,
    from: number,
    to: number,
    duration: number,
    easing: string = 'easeInOut'
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now()
      const animationId = `${target.id || 'unknown'}_${property}_${Date.now()}`
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // 应用缓动函数
        const easedProgress = this.applyEasing(progress, easing)
        const currentValue = from + (to - from) * easedProgress
        
        target[property] = currentValue
        
        if (progress < 1) {
          this.activeAnimations.set(animationId, requestAnimationFrame(animate))
        } else {
          this.activeAnimations.delete(animationId)
          resolve()
        }
      }
      
      this.activeAnimations.set(animationId, requestAnimationFrame(animate))
    })
  }

  // 流体动画
  animateFlow(events: FlowEvent[], deltaTime: number): void {
    const dt = deltaTime / 1000 // 转换为秒
    
    for (const event of events) {
      // 更新速度（考虑加速度）
      event.velocity.x += event.acceleration.x * dt
      event.velocity.y += event.acceleration.y * dt
      
      // 应用阻尼
      const damping = 0.95
      event.velocity.x *= damping
      event.velocity.y *= damping
      
      // 更新位置
      event.position.x += event.velocity.x * dt
      event.position.y += event.velocity.y * dt
      
      // 更新旋转
      if (Math.abs(event.velocity.x) > 0.1 || Math.abs(event.velocity.y) > 0.1) {
        const targetRotation = Math.atan2(event.velocity.y, event.velocity.x)
        event.rotation = this.lerpAngle(event.rotation, targetRotation, 0.1)
      }
      
      // 流体效果：根据速度调整缩放
      const speed = Math.sqrt(event.velocity.x ** 2 + event.velocity.y ** 2)
      const targetScale = 1 + Math.min(speed * 0.01, 0.2)
      event.scale = this.lerp(event.scale, targetScale, 0.1)
      
      // 悬停效果
      if (event.isHovered) {
        event.scale = this.lerp(event.scale, 1.1, 0.2)
        event.opacity = this.lerp(event.opacity, 0.9, 0.1)
      } else {
        event.scale = this.lerp(event.scale, 1, 0.1)
        event.opacity = this.lerp(event.opacity, 1, 0.1)
      }
      
      // 拖拽效果
      if (event.isDragging) {
        event.scale = this.lerp(event.scale, 1.2, 0.3)
        event.opacity = this.lerp(event.opacity, 0.8, 0.2)
      }
      
      // 冲突效果
      if (event.isConflicted) {
        // 添加轻微的震动效果
        const time = Date.now() * 0.01
        event.position.x += Math.sin(time) * 2
        event.position.y += Math.cos(time * 1.3) * 1
      }
    }
  }

  // 涟漪动画
  animateRipple(ripple: RippleEffect, deltaTime: number): void {
    const maxRadius = 100
    const progress = deltaTime / 1000 // 假设涟漪持续1秒
    
    ripple.radius = progress * maxRadius
    ripple.opacity = Math.max(0, 1 - progress)
  }

  // 过渡动画
  async animateEventMove(event: FlowEvent, newPosition: FlowPosition): Promise<void> {
    const duration = 300
    const startPosition = { ...event.position }
    
    await Promise.all([
      this.animateProperty(event.position, 'x', startPosition.x, newPosition.x, duration, 'easeInOut'),
      this.animateProperty(event.position, 'y', startPosition.y, newPosition.y, duration, 'easeInOut')
    ])
  }

  async animateEventScale(event: FlowEvent, scale: number): Promise<void> {
    const duration = 200
    const startScale = event.scale
    
    await this.animateProperty(event, 'scale', startScale, scale, duration, 'easeElastic')
  }

  async animateEventOpacity(event: FlowEvent, opacity: number): Promise<void> {
    const duration = 150
    const startOpacity = event.opacity
    
    await this.animateProperty(event, 'opacity', startOpacity, opacity, duration, 'easeInOut')
  }

  // 缓动函数
  easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  easeElastic(t: number): number {
    if (t === 0 || t === 1) return t
    
    const p = 0.3
    const s = p / 4
    
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1
  }

  easeFlow(t: number): number {
    // 自定义流体缓动函数
    return 1 - Math.pow(1 - t, 3)
  }

  // 私有辅助方法
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'easeInOut':
        return this.easeInOut(t)
      case 'easeElastic':
        return this.easeElastic(t)
      case 'easeFlow':
        return this.easeFlow(t)
      case 'linear':
      default:
        return t
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  private lerpAngle(a: number, b: number, t: number): number {
    // 处理角度插值，考虑2π的周期性
    let diff = b - a
    while (diff > Math.PI) diff -= 2 * Math.PI
    while (diff < -Math.PI) diff += 2 * Math.PI
    
    return a + diff * t
  }

  // 清理所有动画
  destroy(): void {
    for (const [id, animationId] of this.activeAnimations) {
      cancelAnimationFrame(animationId)
    }
    this.activeAnimations.clear()
  }
}
