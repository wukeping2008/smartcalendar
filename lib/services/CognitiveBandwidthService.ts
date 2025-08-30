/**
 * 认知带宽监控服务
 * 核心理念：保护有限的认知资源，避免过载
 */

import {
  CognitiveLoad,
  CognitiveLoadLevel,
  CognitiveItem,
  Commitment,
  CommitmentType,
  CommitmentPriority,
  CommitmentStatus,
  TradingFocusMode,
  ROICalculation,
  CognitiveAlert,
  RejectionTemplate,
  CognitiveBandwidthStats
} from '../../types/cognitive'
import { Event } from '../../types/event'
import { InboxItem } from '../../types/inbox'

class CognitiveBandwidthService {
  private static instance: CognitiveBandwidthService
  
  // 核心配置
  private readonly MAX_COGNITIVE_LOAD = 7  // 基于海马体工作记忆限制
  private readonly WARNING_THRESHOLD = 5   // 警告阈值
  private readonly AUTO_ARCHIVE_AFTER = 48 * 60 * 60 * 1000 // 48小时自动归档
  
  // 状态
  private cognitiveLoad: CognitiveLoad
  private commitments: Map<string, Commitment> = new Map()
  private tradingMode: TradingFocusMode = { 
    enabled: false, 
    blockAllInterruptions: true,
    decisionTimeLimit: 60,
    allowedContacts: []
  }
  private alerts: CognitiveAlert[] = []
  
  // 拒绝模板库
  private rejectionTemplates: RejectionTemplate[] = [
    {
      id: 'busy_trading',
      type: CommitmentType.SOCIAL,
      message: '抱歉，我现在正在处理重要的交易决策，需要保持专注。如果不是特别紧急，我们可以改天再讨论。',
      tone: 'professional',
      scenario: '正在Trading无法分心',
      usage: 0,
      effectiveness: 5
    },
    {
      id: 'low_roi',
      type: CommitmentType.FAVOR,
      message: '感谢你的信任。不过这个事情可能不太适合我来处理，建议你找[具体领域]的专业人士，他们能提供更好的帮助。',
      tone: 'polite',
      scenario: 'ROI过低的请求',
      usage: 0,
      effectiveness: 4
    },
    {
      id: 'no_financial_support',
      type: CommitmentType.FINANCIAL,
      message: '理解你的处境，但我的资金都有既定安排。建议你考虑[其他融资渠道]，这样对双方都更合适。',
      tone: 'firm',
      scenario: '拒绝财务兜底',
      usage: 0,
      effectiveness: 4
    },
    {
      id: 'cannot_keep_secret',
      type: CommitmentType.SECRET,
      message: '我记性不太好，怕给你添麻烦。如果是重要的事，建议你找值得信任且记性好的朋友。',
      tone: 'friendly',
      scenario: '无法保守秘密',
      usage: 0,
      effectiveness: 3
    },
    {
      id: 'core_focus',
      type: CommitmentType.CORE,
      message: '谢谢邀请。目前我正专注于核心项目的关键阶段，需要全力以赴。待这个阶段完成后，我们再探讨合作机会。',
      tone: 'professional',
      scenario: '专注核心任务',
      usage: 0,
      effectiveness: 5
    }
  ]
  
  private constructor() {
    this.cognitiveLoad = {
      current: 0,
      max: this.MAX_COGNITIVE_LOAD,
      threshold: this.WARNING_THRESHOLD,
      level: CognitiveLoadLevel.LOW,
      activeItems: [],
      archivedItems: []
    }
    this.initializeAutoArchive()
  }
  
  static getInstance(): CognitiveBandwidthService {
    if (!CognitiveBandwidthService.instance) {
      CognitiveBandwidthService.instance = new CognitiveBandwidthService()
    }
    return CognitiveBandwidthService.instance
  }
  
  /**
   * 获取当前认知负载状态
   */
  getCognitiveLoad(): CognitiveLoad {
    this.updateCognitiveLoad()
    return this.cognitiveLoad
  }
  
  /**
   * 添加承诺
   */
  addCommitment(commitment: Omit<Commitment, 'id' | 'createdAt'>): string {
    // 检查是否会过载
    if (this.wouldCauseOverload(commitment.cognitiveLoad)) {
      this.createAlert('overload', '添加此承诺将导致认知过载', 'warning')
      throw new Error('认知带宽不足，建议先清理或拒绝其他承诺')
    }
    
    const id = `commitment_${Date.now()}`
    const newCommitment: Commitment = {
      ...commitment,
      id,
      createdAt: new Date(),
      expiresAt: commitment.expiresAt || new Date(Date.now() + this.AUTO_ARCHIVE_AFTER)
    }
    
    this.commitments.set(id, newCommitment)
    this.updateCognitiveLoad()
    
    // Trading相关承诺发出特别提醒
    if (commitment.priority === CommitmentPriority.CRITICAL) {
      this.createAlert('info', `Trading相关承诺已添加: ${commitment.content}`, 'info')
    }
    
    return id
  }
  
  /**
   * 计算活动的ROI
   */
  calculateROI(
    activity: string,
    timeHours: number,
    expectedReturn: number,
    tradingHourlyReturn: number = 10000 // 默认Trading时薪
  ): ROICalculation {
    const tradingOpportunityCost = timeHours * tradingHourlyReturn
    const roi = (expectedReturn - tradingOpportunityCost) / (timeHours * tradingHourlyReturn)
    
    let recommendation: 'accept' | 'reject' | 'delegate'
    let reason: string
    
    if (roi > 0.5) {
      recommendation = 'accept'
      reason = '回报率显著高于Trading，值得投入'
    } else if (roi > -0.3) {
      recommendation = 'delegate'
      reason = '回报率一般，建议委托他人处理'
    } else {
      recommendation = 'reject'
      reason = 'ROI过低，机会成本太高'
    }
    
    return {
      activity,
      timeInvestment: timeHours,
      expectedReturn,
      tradingOpportunityCost,
      roi,
      recommendation,
      reason
    }
  }
  
  /**
   * 进入Trading专注模式
   */
  enterTradingFocusMode(duration: number = 60): void {
    this.tradingMode = {
      enabled: true,
      startTime: new Date(),
      duration,
      blockAllInterruptions: true,
      allowedContacts: ['野猪老师', '量化工程师'], // 预设允许联系人
      decisionTimeLimit: 60
    }
    
    // 自动归档所有低优先级项
    this.autoArchiveLowPriority()
    
    // 创建提醒
    this.createAlert('info', `Trading专注模式已开启，持续${duration}分钟`, 'info')
    
    // 设置自动退出
    setTimeout(() => {
      this.exitTradingFocusMode()
    }, duration * 60 * 1000)
  }
  
  /**
   * 退出Trading专注模式
   */
  exitTradingFocusMode(): void {
    if (this.tradingMode.enabled && this.tradingMode.startTime) {
      const duration = (Date.now() - this.tradingMode.startTime.getTime()) / 60000
      this.tradingMode.enabled = false
      this.createAlert('info', `Trading专注模式已结束，持续${Math.round(duration)}分钟`, 'info')
    }
  }
  
  /**
   * 智能拒绝建议
   */
  suggestRejection(commitmentType: CommitmentType, scenario?: string): RejectionTemplate | null {
    // 根据类型和场景匹配模板
    let template = this.rejectionTemplates.find(t => 
      t.type === commitmentType && 
      (!scenario || (t.scenario && t.scenario.includes(scenario)))
    )
    
    if (!template) {
      template = this.rejectionTemplates.find(t => t.type === commitmentType)
    }
    
    if (template) {
      if (template.usage !== undefined) {
        template.usage++
      }
      return template
    }
    
    return null
  }
  
  /**
   * 自动归档过期项
   */
  private autoArchiveLowPriority(): void {
    const now = Date.now()
    
    this.cognitiveLoad.activeItems = this.cognitiveLoad.activeItems.filter(item => {
      // 检查是否可以自动归档
      if (item.canAutoArchive && item.priority === CommitmentPriority.LOW) {
        this.cognitiveLoad.archivedItems.push(item)
        return false
      }
      
      // 检查是否过期
      if (item.deadline && item.deadline.getTime() < now) {
        this.cognitiveLoad.archivedItems.push(item)
        this.createAlert('expired', `已过期: ${item.title}`, 'info')
        return false
      }
      
      return true
    })
    
    this.updateCognitiveLoad()
  }
  
  /**
   * 更新认知负载
   */
  private updateCognitiveLoad(): void {
    // 计算活跃承诺的总负载
    let totalLoad = 0
    const activeItems: CognitiveItem[] = []
    
    // 从承诺中计算
    this.commitments.forEach(commitment => {
      if (commitment.status === CommitmentStatus.ACTIVE) {
        totalLoad += commitment.cognitiveLoad
        activeItems.push({
          id: commitment.id,
          type: 'commitment',
          load: commitment.cognitiveLoad,
          title: commitment.content,
          deadline: commitment.expiresAt,
          source: commitment.source,
          canAutoArchive: commitment.isAutoDismissible,
          priority: commitment.priority
        })
      }
    })
    
    this.cognitiveLoad.current = totalLoad
    this.cognitiveLoad.activeItems = activeItems
    
    // 检查是否超载
    if (totalLoad >= this.WARNING_THRESHOLD) {
      this.createAlert('approaching_limit', `认知负载接近上限 (${totalLoad}/${this.MAX_COGNITIVE_LOAD})`, 'warning')
    }
    
    if (totalLoad >= this.MAX_COGNITIVE_LOAD) {
      this.createAlert('overload', `认知过载！请立即清理或推迟任务`, 'critical')
    }
  }
  
  /**
   * 检查是否会导致过载
   */
  private wouldCauseOverload(additionalLoad: number): boolean {
    return this.cognitiveLoad.current + additionalLoad > this.MAX_COGNITIVE_LOAD
  }
  
  /**
   * 创建警告
   */
  private createAlert(
    type: 'overload' | 'approaching_limit' | 'deadline' | 'expired' | 'info',
    message: string,
    severity: 'info' | 'warning' | 'critical'
  ): void {
    const alert: CognitiveAlert = {
      id: `alert_${Date.now()}`,
      type,
      severity,
      message,
      timestamp: new Date()
    }
    
    this.alerts.push(alert)
    
    // 只保留最近20条警告
    if (this.alerts.length > 20) {
      this.alerts = this.alerts.slice(-20)
    }
  }
  
  /**
   * 获取最近的警告
   */
  getRecentAlerts(limit: number = 5): CognitiveAlert[] {
    return this.alerts.slice(-limit)
  }
  
  /**
   * 获取所有拒绝模板
   */
  getRejectionTemplates(): RejectionTemplate[] {
    return this.rejectionTemplates
  }
  
  /**
   * 初始化自动归档定时器
   */
  private initializeAutoArchive(): void {
    // 每小时检查一次
    setInterval(() => {
      this.autoArchiveLowPriority()
    }, 60 * 60 * 1000)
  }
  
  /**
   * 获取统计数据
   */
  getStats(date: Date = new Date()): CognitiveBandwidthStats {
    // 这里简化实现，实际应该从持久化存储中获取
    return {
      date,
      averageLoad: this.cognitiveLoad.current,
      peakLoad: Math.min(this.cognitiveLoad.current + 2, this.MAX_COGNITIVE_LOAD),
      peakTime: new Date(),
      overloadDuration: 0,
      rejectedCommitments: this.rejectionTemplates.reduce((sum, t) => sum + (t.usage || 0), 0),
      completedCommitments: Array.from(this.commitments.values())
        .filter(c => c.status === CommitmentStatus.COMPLETED).length,
      tradingFocusTime: 0
    }
  }
  
  /**
   * 清理认知负载（一键清空非关键项）
   */
  clearNonCritical(): number {
    let clearedCount = 0
    
    this.commitments.forEach((commitment, id) => {
      if (commitment.priority !== CommitmentPriority.CRITICAL && 
          commitment.status === CommitmentStatus.ACTIVE) {
        commitment.status = CommitmentStatus.ARCHIVED
        clearedCount++
      }
    })
    
    this.updateCognitiveLoad()
    this.createAlert('info', `已清理${clearedCount}个非关键承诺`, 'info')
    
    return clearedCount
  }
}

export const cognitiveBandwidthService = CognitiveBandwidthService.getInstance()
export default cognitiveBandwidthService