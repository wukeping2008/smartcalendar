'use client'

/**
 * AI驱动的智能决策引擎 v1.0
 * 
 * 核心功能：
 * 1. 市场数据驱动的智能决策
 * 2. AI增强的时间安排优化
 * 3. 实时预警驱动的日程调整
 * 4. 多维度智能推荐系统
 */

import { Event, EventCategory, Priority, EnergyLevel, EventStatus } from '../../types/event'
import { MarketData, MarketOverview, MarketAlert } from '../services/RealTimeMarketService'
import { marketService } from '../services/RealTimeMarketService'
import { aiService } from '../services/AIService'
import { TimeAnalyzer, TimePattern, ProductivityMetrics, TimeInsight } from './TimeAnalyzer'

export interface DecisionContext {
  currentTime: Date
  marketData: MarketOverview | null
  recentAlerts: MarketAlert[]
  userEvents: Event[]
  timePatterns: TimePattern[]
  productivityMetrics: ProductivityMetrics
  insights: TimeInsight[]
}

export interface SmartRecommendation {
  id: string
  type: 'schedule' | 'market' | 'productivity' | 'energy' | 'focus'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  reasoning: string[]
  suggestedActions: Array<{
    action: string
    impact: 'low' | 'medium' | 'high'
    effort: 'low' | 'medium' | 'high'
    timeline: 'immediate' | 'short' | 'medium' | 'long'
  }>
  confidence: number // 0-1
  timestamp: Date
  expiresAt?: Date
  marketTrigger?: MarketAlert
  relatedEvents?: string[] // Event IDs
}

export interface IntelligentInsight {
  category: 'market' | 'productivity' | 'habits' | 'optimization' | 'prediction'
  insight: string
  dataPoints: string[]
  actionableAdvice: string[]
  confidence: number
  impact: 'low' | 'medium' | 'high'
  urgency: 'low' | 'medium' | 'high'
  aiGenerated: boolean
}

class AIDecisionEngine {
  private static instance: AIDecisionEngine
  private timeAnalyzer: TimeAnalyzer | null = null
  private decisionContext: DecisionContext | null = null
  private activeRecommendations: Map<string, SmartRecommendation> = new Map()
  private decisionHistory: SmartRecommendation[] = []

  private constructor() {
    this.initializeEngine()
  }

  static getInstance(): AIDecisionEngine {
    if (!AIDecisionEngine.instance) {
      AIDecisionEngine.instance = new AIDecisionEngine()
    }
    return AIDecisionEngine.instance
  }

  /**
   * 初始化决策引擎
   */
  private async initializeEngine() {
    console.log('🧠 AI决策引擎初始化中...')
    
    // 连接市场数据服务
    await marketService.connect()
    
    // 订阅市场预警，触发智能决策
    marketService.subscribeAlerts((alert) => {
      this.handleMarketAlert(alert)
    })

    console.log('✅ AI决策引擎初始化完成')
  }

  /**
   * 更新决策上下文
   */
  async updateDecisionContext(events: Event[]): Promise<DecisionContext> {
    const currentTime = new Date()
    
    // 初始化时间分析器
    this.timeAnalyzer = new TimeAnalyzer(events, currentTime)
    
    // 获取市场数据
    const marketData = marketService.getMarketOverview()
    const recentAlerts = marketService.getRecentAlerts(10)
    
    // 分析用户时间模式
    const timePatterns = this.timeAnalyzer.analyzeTimePatterns()
    const productivityMetrics = this.timeAnalyzer.calculateProductivityMetrics()
    const insights = this.timeAnalyzer.generateInsights()
    
    this.decisionContext = {
      currentTime,
      marketData,
      recentAlerts,
      userEvents: events,
      timePatterns,
      productivityMetrics,
      insights
    }

    return this.decisionContext
  }

  /**
   * 生成智能推荐
   */
  async generateSmartRecommendations(events: Event[]): Promise<SmartRecommendation[]> {
    if (!this.decisionContext) {
      await this.updateDecisionContext(events)
    }

    const recommendations: SmartRecommendation[] = []

    // 1. 市场数据驱动推荐
    recommendations.push(...await this.generateMarketBasedRecommendations())
    
    // 2. 生产力优化推荐
    recommendations.push(...await this.generateProductivityRecommendations())
    
    // 3. 精力管理推荐
    recommendations.push(...await this.generateEnergyOptimizationRecommendations())
    
    // 4. AI增强推荐
    recommendations.push(...await this.generateAIEnhancedRecommendations())

    // 按优先级和置信度排序
    const sortedRecommendations = recommendations.sort((a, b) => {
      const aPriority = this.getPriorityScore(a.priority)
      const bPriority = this.getPriorityScore(b.priority)
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return b.confidence - a.confidence
    })

    // 更新活跃推荐
    sortedRecommendations.forEach(rec => {
      this.activeRecommendations.set(rec.id, rec)
    })

    // 清理过期推荐
    this.cleanupExpiredRecommendations()

    return sortedRecommendations.slice(0, 8) // 返回前8个推荐
  }

  /**
   * 生成智能洞察
   */
  async generateIntelligentInsights(events: Event[]): Promise<IntelligentInsight[]> {
    if (!this.decisionContext) {
      await this.updateDecisionContext(events)
    }

    const insights: IntelligentInsight[] = []
    
    // 1. 市场洞察
    insights.push(...await this.generateMarketInsights())
    
    // 2. 生产力洞察
    insights.push(...await this.generateProductivityInsights())
    
    // 3. AI预测洞察
    insights.push(...await this.generatePredictiveInsights())

    return insights.sort((a, b) => {
      const aScore = this.getUrgencyScore(a.urgency) * 0.6 + this.getImpactScore(a.impact) * 0.4
      const bScore = this.getUrgencyScore(b.urgency) * 0.6 + this.getImpactScore(b.impact) * 0.4
      return bScore - aScore
    })
  }

  /**
   * 处理市场预警
   */
  private async handleMarketAlert(alert: MarketAlert) {
    if (!this.decisionContext) return

    console.log(`🚨 处理市场预警: ${alert.title}`)

    // 根据预警严重程度生成相应建议
    if (alert.severity === 'critical' || alert.severity === 'high') {
      const recommendation = await this.generateMarketAlertRecommendation(alert)
      this.activeRecommendations.set(recommendation.id, recommendation)
      
      // 通知用户
      console.log(`💡 生成市场预警推荐: ${recommendation.title}`)
    }
  }

  /**
   * 生成基于市场的推荐
   */
  private async generateMarketBasedRecommendations(): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = []
    const { marketData } = this.decisionContext!

    if (!marketData) return recommendations

    // 1. 交易时段保护推荐
    const activeSessions = marketData.activeSessions.filter(s => s.isOpen)
    if (activeSessions.length > 0) {
      recommendations.push({
        id: `market_protection_${Date.now()}`,
        type: 'market',
        priority: 'medium',
        title: '交易时段保护建议',
        description: `当前${activeSessions.map(s => s.name).join('、')}正在开市，建议减少非交易相关的干扰`,
        reasoning: [
          '活跃交易时段需要专注',
          '市场波动可能需要及时响应',
          '减少干扰有助于提高交易效率'
        ],
        suggestedActions: [
          {
            action: '将非紧急会议推迟到休市时间',
            impact: 'high',
            effort: 'low',
            timeline: 'immediate'
          },
          {
            action: '设置免打扰模式',
            impact: 'medium',
            effort: 'low',
            timeline: 'immediate'
          }
        ],
        confidence: 0.85,
        timestamp: new Date()
      })
    }

    // 2. 高波动率预警推荐
    if (marketData.vixLevel > 25) {
      recommendations.push({
        id: `volatility_alert_${Date.now()}`,
        type: 'market',
        priority: 'high',
        title: '高波动率预警',
        description: `当前VIX指数为${marketData.vixLevel.toFixed(1)}，市场波动较大，建议调整日程安排`,
        reasoning: [
          'VIX指数超过25表明市场恐慌情绪',
          '高波动期需要更多关注市场',
          '可能出现突发交易机会'
        ],
        suggestedActions: [
          {
            action: '清空下午2-4点的非交易安排',
            impact: 'high',
            effort: 'medium',
            timeline: 'immediate'
          },
          {
            action: '设置价格突破提醒',
            impact: 'medium',
            effort: 'low',
            timeline: 'immediate'
          }
        ],
        confidence: 0.9,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4小时后过期
      })
    }

    return recommendations
  }

  /**
   * 生成生产力推荐
   */
  private async generateProductivityRecommendations(): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = []
    const { productivityMetrics } = this.decisionContext!

    // 专注时间不足推荐
    if (productivityMetrics.focusTime < 240) { // 少于4小时
      recommendations.push({
        id: `focus_time_${Date.now()}`,
        type: 'productivity',
        priority: 'medium',
        title: '专注时间不足',
        description: `当前每日专注时间仅${Math.round(productivityMetrics.focusTime / 60)}小时，建议增加深度工作时间`,
        reasoning: [
          '专注时间是高质量工作的基础',
          '当前专注时间低于建议的4-6小时',
          '碎片化工作影响效率'
        ],
        suggestedActions: [
          {
            action: '合并相邻的工作任务',
            impact: 'high',
            effort: 'low',
            timeline: 'immediate'
          },
          {
            action: '设定2小时专注工作块',
            impact: 'high',
            effort: 'medium',
            timeline: 'short'
          }
        ],
        confidence: 0.8,
        timestamp: new Date()
      })
    }

    return recommendations
  }

  /**
   * 生成精力管理推荐
   */
  private async generateEnergyOptimizationRecommendations(): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = []
    const { productivityMetrics } = this.decisionContext!

    if (productivityMetrics.energyAlignment < 0.6) {
      recommendations.push({
        id: `energy_alignment_${Date.now()}`,
        type: 'energy',
        priority: 'medium',
        title: '精力匹配度需要优化',
        description: `当前精力匹配度为${Math.round(productivityMetrics.energyAlignment * 100)}%，建议重新安排任务时间`,
        reasoning: [
          '任务与个人精力曲线不匹配',
          '在低精力时段安排了高要求任务',
          '优化匹配度可提升整体效率'
        ],
        suggestedActions: [
          {
            action: '将高精力任务移到上午9-11点',
            impact: 'high',
            effort: 'medium',
            timeline: 'short'
          },
          {
            action: '下午安排轻量级任务',
            impact: 'medium',
            effort: 'low',
            timeline: 'immediate'
          }
        ],
        confidence: 0.75,
        timestamp: new Date()
      })
    }

    return recommendations
  }

  /**
   * 生成AI增强推荐
   */
  private async generateAIEnhancedRecommendations(): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = []

    try {
      // 使用AI服务生成智能建议
      const aiInsight = await aiService.parseNaturalLanguage(
        '基于当前用户的时间使用模式和市场情况，提供3个具体的时间管理优化建议'
      )

      if (aiInsight.command && aiInsight.params) {
        recommendations.push({
          id: `ai_insight_${Date.now()}`,
          type: 'productivity',
          priority: 'medium',
          title: 'AI智能建议',
          description: '基于您的使用模式，AI为您生成了个性化建议',
          reasoning: [
            'AI分析了您的历史数据',
            '结合市场环境给出建议',
            '个性化优化方案'
          ],
          suggestedActions: [
            {
              action: 'AI推荐的优化策略',
              impact: 'medium',
              effort: 'low',
              timeline: 'short'
            }
          ],
          confidence: 0.7,
          timestamp: new Date()
        })
      }
    } catch (error) {
      console.warn('AI增强推荐生成失败:', error)
    }

    return recommendations
  }

  /**
   * 生成市场预警推荐
   */
  private async generateMarketAlertRecommendation(alert: MarketAlert): Promise<SmartRecommendation> {
    return {
      id: `market_alert_${alert.id}`,
      type: 'market',
      priority: alert.severity === 'critical' ? 'critical' : 'high',
      title: `市场预警: ${alert.title}`,
      description: alert.message,
      reasoning: [
        `${alert.type}类型预警触发`,
        `严重程度: ${alert.severity}`,
        '需要立即关注市场变化'
      ],
      suggestedActions: [
        {
          action: '暂停非关键任务，关注市场',
          impact: 'high',
          effort: 'low',
          timeline: 'immediate'
        },
        {
          action: '检查相关持仓风险',
          impact: 'high',
          effort: 'medium',
          timeline: 'immediate'
        }
      ],
      confidence: 0.95,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后过期
      marketTrigger: alert
    }
  }

  /**
   * 生成市场洞察
   */
  private async generateMarketInsights(): Promise<IntelligentInsight[]> {
    const insights: IntelligentInsight[] = []
    const { marketData } = this.decisionContext!

    if (marketData) {
      insights.push({
        category: 'market',
        insight: `当前市场情绪为${marketData.globalSentiment}，VIX指数${marketData.vixLevel.toFixed(1)}`,
        dataPoints: [
          `活跃交易时段: ${marketData.activeSessions.filter(s => s.isOpen).length}个`,
          `市场情绪: ${marketData.globalSentiment}`,
          `VIX指数: ${marketData.vixLevel.toFixed(1)}`
        ],
        actionableAdvice: [
          '根据市场情绪调整交易策略',
          '在高波动期保持更多现金仓位',
          '关注重要经济数据发布时间'
        ],
        confidence: 0.9,
        impact: 'high',
        urgency: marketData.vixLevel > 25 ? 'high' : 'medium',
        aiGenerated: false
      })
    }

    return insights
  }

  /**
   * 生成生产力洞察
   */
  private async generateProductivityInsights(): Promise<IntelligentInsight[]> {
    const insights: IntelligentInsight[] = []
    const { productivityMetrics } = this.decisionContext!

    insights.push({
      category: 'productivity',
      insight: `当前生产力效率为${Math.round(productivityMetrics.overallEfficiency * 100)}%`,
      dataPoints: [
        `任务完成率: ${Math.round(productivityMetrics.completionRate * 100)}%`,
        `专注时间: ${Math.round(productivityMetrics.focusTime / 60)}小时`,
        `精力匹配度: ${Math.round(productivityMetrics.energyAlignment * 100)}%`
      ],
      actionableAdvice: [
        '优化高精力任务的时间安排',
        '减少工作时间的碎片化',
        '建立更好的任务优先级系统'
      ],
      confidence: 0.85,
      impact: 'high',
      urgency: productivityMetrics.overallEfficiency < 0.6 ? 'high' : 'medium',
      aiGenerated: false
    })

    return insights
  }

  /**
   * 生成预测洞察
   */
  private async generatePredictiveInsights(): Promise<IntelligentInsight[]> {
    const insights: IntelligentInsight[] = []

    try {
      const prediction = await aiService.chatWithClaude(
        '基于用户的时间使用模式，预测未来一周可能遇到的时间管理挑战和机会'
      )

      insights.push({
        category: 'prediction',
        insight: '基于历史数据的AI预测分析',
        dataPoints: ['历史时间模式', '市场周期性', '个人习惯趋势'],
        actionableAdvice: ['提前规划高风险时段', '预留缓冲时间', '建立应急预案'],
        confidence: 0.7,
        impact: 'medium',
        urgency: 'low',
        aiGenerated: true
      })
    } catch (error) {
      console.warn('AI预测洞察生成失败:', error)
    }

    return insights
  }

  // 辅助方法

  private getPriorityScore(priority: string): number {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 }
    return scores[priority as keyof typeof scores] || 1
  }

  private getUrgencyScore(urgency: string): number {
    const scores = { low: 1, medium: 2, high: 3 }
    return scores[urgency as keyof typeof scores] || 1
  }

  private getImpactScore(impact: string): number {
    const scores = { low: 1, medium: 2, high: 3 }
    return scores[impact as keyof typeof scores] || 1
  }

  private cleanupExpiredRecommendations() {
    const now = new Date()
    for (const [id, rec] of this.activeRecommendations) {
      if (rec.expiresAt && rec.expiresAt < now) {
        this.activeRecommendations.delete(id)
        this.decisionHistory.push(rec)
      }
    }
  }

  /**
   * 获取活跃推荐
   */
  getActiveRecommendations(): SmartRecommendation[] {
    this.cleanupExpiredRecommendations()
    return Array.from(this.activeRecommendations.values())
  }

  /**
   * 获取决策历史
   */
  getDecisionHistory(limit = 20): SmartRecommendation[] {
    return this.decisionHistory.slice(-limit)
  }

  /**
   * 获取决策上下文
   */
  getCurrentContext(): DecisionContext | null {
    return this.decisionContext
  }
}

// 导出单例和类型
export const aiDecisionEngine = AIDecisionEngine.getInstance()
export type { DecisionContext, SmartRecommendation, IntelligentInsight }
export default AIDecisionEngine
