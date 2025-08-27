/**
 * Warm Guidance Service
 * 温暖引导系统服务
 * 提供智能化、个性化的用户引导体验
 */

import {
  GuidanceStep,
  GuidanceTour,
  TourCategory,
  UserLevel,
  TourStatus,
  TourTrigger,
  TourPersonality,
  GuidanceContext,
  UserPreferences,
  GuidanceStatistics,
  Achievement,
  Tooltip,
  HelpResource,
  InteractiveGuide,
  GuidanceNotification,
  ContextualHelp,
  HelpSuggestion,
  QuickAction,
  CommonIssue,
  FeedbackRequest,
  GuidanceAnalytics
} from '../../types/guidance'
import { Event } from '../../types/event'
import { InboxItem } from '../../types/inbox'

export class WarmGuidanceService {
  private static instance: WarmGuidanceService
  private context: GuidanceContext
  private tours: Map<string, GuidanceTour>
  private tooltips: Map<string, Tooltip>
  private resources: Map<string, HelpResource>
  private notifications: GuidanceNotification[]
  private analytics: GuidanceAnalytics
  private listeners: Set<(context: GuidanceContext) => void>

  private constructor() {
    this.context = this.initializeContext()
    this.tours = new Map()
    this.tooltips = new Map()
    this.resources = new Map()
    this.notifications = []
    this.analytics = this.initializeAnalytics()
    this.listeners = new Set()
    
    this.initializeDefaultTours()
    this.initializeResources()
    this.setupEventListeners()
  }

  static getInstance(): WarmGuidanceService {
    if (!WarmGuidanceService.instance) {
      WarmGuidanceService.instance = new WarmGuidanceService()
    }
    return WarmGuidanceService.instance
  }

  private initializeContext(): GuidanceContext {
    return {
      completedTours: [],
      skippedTours: [],
      userLevel: UserLevel.BEGINNER,
      preferences: {
        enableGuidance: true,
        autoStartTours: true,
        showTips: true,
        guidanceSpeed: 'normal',
        skipOnboarding: false
      },
      statistics: {
        toursStarted: 0,
        toursCompleted: 0,
        toursSkipped: 0,
        averageCompletion: 0,
        totalTimeSpent: 0,
        lastActiveDate: new Date(),
        achievements: []
      }
    }
  }

  private initializeAnalytics(): GuidanceAnalytics {
    return {
      usage: {
        totalSessions: 0,
        averageSessionDuration: 0,
        mostUsedFeatures: [],
        leastUsedFeatures: []
      },
      effectiveness: {
        completionRate: 0,
        dropOffPoints: [],
        averageTimePerStep: 0,
        userSatisfaction: 0
      },
      behavior: {
        preferredLearningStyle: 'interactive',
        peakLearningTime: '10:00',
        skipPatterns: []
      },
      recommendations: []
    }
  }

  private initializeDefaultTours() {
    // 新手引导
    this.addTour({
      id: 'onboarding',
      name: '欢迎来到智能日历',
      description: '让我带您了解智能日历的核心功能',
      category: TourCategory.ONBOARDING,
      steps: [
        {
          id: 'welcome',
          title: '👋 欢迎使用智能日历 v4.0',
          description: '我是您的智能助手，将帮助您充分利用这个强大的时间管理工具。让我们开始这段旅程吧！',
          position: 'center',
          style: {
            overlay: true,
            animation: 'fade'
          },
          skippable: true
        },
        {
          id: 'ai-assistant',
          title: '🤖 认识AI助手',
          description: 'AI助手可以帮您智能规划日程、优化时间分配，并提供个性化建议。点击右侧工具栏的AI图标试试吧！',
          target: '[data-panel-id="ai-assistant"]',
          position: 'left',
          action: {
            type: 'click',
            selector: '[data-panel-id="ai-assistant"]'
          },
          style: {
            highlight: true,
            animation: 'pulse'
          }
        },
        {
          id: 'calendar-view',
          title: '📅 智能日历视图',
          description: '这是您的主要工作区域。您可以在这里查看、创建和管理所有日程安排。',
          target: '[data-panel-id="calendar"]',
          position: 'left',
          style: {
            highlight: true
          }
        },
        {
          id: 'inbox',
          title: '📥 智能收件箱',
          description: '所有任务和待办事项都会汇集到这里。系统会自动应用GTD方法帮您分类和优先排序。',
          target: '[data-panel-id="inbox"]',
          position: 'left',
          style: {
            highlight: true,
            animation: 'bounce'
          }
        },
        {
          id: 'time-budget',
          title: '⏱️ 时间预算管理',
          description: '精确到秒的时间追踪，帮您了解时间都花在哪里，并优化时间分配。',
          target: '[data-panel-id="time-budget"]',
          position: 'left'
        },
        {
          id: 'what-if',
          title: '🔀 What-If模拟器',
          description: '在做重要决策前，使用模拟器预测不同选择的影响，做出最优决策。',
          target: '[data-panel-id="what-if"]',
          position: 'left'
        },
        {
          id: 'completion',
          title: '🎉 准备就绪！',
          description: '恭喜您完成了基础引导！现在您可以开始使用智能日历了。如需帮助，随时点击帮助按钮。',
          position: 'center',
          style: {
            overlay: true,
            animation: 'fade'
          }
        }
      ],
      trigger: {
        type: 'immediate'
      },
      targetAudience: UserLevel.BEGINNER,
      status: TourStatus.NOT_STARTED,
      personality: {
        tone: 'friendly',
        avatar: {
          type: 'character',
          name: '小智'
        },
        messages: {
          welcome: '嗨！我是小智，您的智能日历助手 😊',
          progress: '做得很好！让我们继续...',
          encouragement: [
            '太棒了！您学得真快！',
            '继续保持，马上就要完成了！',
            '您做得很好！'
          ],
          completion: '🎊 恭喜！您已经掌握了基础功能！',
          skip: '没问题，您可以随时在帮助中心重新开始引导。'
        },
        interaction: {
          allowQuestions: true,
          provideTips: true,
          showProgress: true,
          celebrateSuccess: true
        }
      },
      reward: {
        type: 'badge',
        value: 'early_adopter',
        message: '获得成就：早期使用者'
      }
    })

    // GTD工作流引导
    this.addTour({
      id: 'gtd-workflow',
      name: 'GTD工作流程',
      description: '学习如何使用GTD方法管理任务',
      category: TourCategory.WORKFLOW,
      steps: [
        {
          id: 'capture',
          title: '📝 捕获一切',
          description: '将所有想法、任务和承诺记录到收件箱中，不要让它们占用您的mental space。',
          target: '[data-action="add-to-inbox"]',
          position: 'bottom'
        },
        {
          id: 'clarify',
          title: '🎯 明确处理',
          description: '对每个任务问自己：这是什么？需要行动吗？如果需要2分钟内完成，立即执行！',
          target: '[data-inbox-item]',
          position: 'right'
        },
        {
          id: 'organize',
          title: '📂 组织整理',
          description: '将任务分配到合适的类别：下一步行动、项目、等待、或某天/也许。',
          target: '[data-category-selector]',
          position: 'top'
        },
        {
          id: 'reflect',
          title: '🔍 回顾检查',
          description: '定期回顾您的任务列表，确保系统保持更新和相关。',
          position: 'center'
        },
        {
          id: 'engage',
          title: '⚡ 执行行动',
          description: '根据情境、时间、精力和优先级选择要执行的任务。',
          target: '[data-task-list]',
          position: 'left'
        }
      ],
      trigger: {
        type: 'event',
        event: {
          name: 'inbox_opened',
          count: 2
        }
      },
      targetAudience: UserLevel.INTERMEDIATE,
      status: TourStatus.NOT_STARTED,
      personality: {
        tone: 'professional',
        messages: {
          welcome: '让我们探索GTD方法的强大功能',
          completion: '您已经掌握了GTD工作流程！'
        },
        interaction: {
          showProgress: true,
          provideTips: true
        }
      }
    })

    // AI功能深度引导
    this.addTour({
      id: 'ai-features',
      name: 'AI智能功能',
      description: '深入了解AI如何帮助您提升效率',
      category: TourCategory.FEATURE,
      steps: [
        {
          id: 'smart-scheduling',
          title: '🧠 智能排程',
          description: 'AI会根据您的习惯、能量状态和任务特性，自动建议最佳的任务安排时间。',
          target: '[data-ai-suggestion]',
          position: 'bottom'
        },
        {
          id: 'context-awareness',
          title: '🎯 情境感知',
          description: '系统会监测9个维度的情境信息，自动触发相应的SOP和提醒。',
          position: 'center'
        },
        {
          id: 'decision-simulation',
          title: '📊 决策模拟',
          description: '在做重要决策前，使用What-If模拟器预测不同选择的后果。',
          target: '[data-panel-id="what-if"]',
          position: 'left'
        },
        {
          id: 'daily-briefing',
          title: '📰 每日简报',
          description: '每天早上，AI会为您准备个性化的简报，包括天气、日程、市场和重要提醒。',
          target: '[data-panel-id="daily-briefing"]',
          position: 'left'
        }
      ],
      trigger: {
        type: 'manual'
      },
      targetAudience: UserLevel.INTERMEDIATE,
      status: TourStatus.NOT_STARTED,
      personality: {
        tone: 'encouraging',
        messages: {
          welcome: '准备好解锁AI的全部潜力了吗？',
          completion: '太棒了！您现在是AI功能专家了！'
        },
        interaction: {
          celebrateSuccess: true,
          provideTips: true
        }
      }
    })
  }

  private initializeResources() {
    // 帮助文章
    this.addResource({
      id: 'getting-started',
      type: 'article',
      title: '快速入门指南',
      description: '5分钟了解智能日历的核心功能',
      content: '智能日历是一个AI驱动的时间管理平台...',
      category: '基础',
      tags: ['入门', '基础', '新手'],
      difficulty: UserLevel.BEGINNER,
      estimatedTime: 5,
      popularity: 100,
      lastUpdated: new Date()
    })

    this.addResource({
      id: 'gtd-guide',
      type: 'article',
      title: 'GTD方法完整指南',
      description: '掌握Getting Things Done方法',
      content: 'GTD是由David Allen创建的时间管理方法...',
      category: '方法论',
      tags: ['GTD', '效率', '任务管理'],
      difficulty: UserLevel.INTERMEDIATE,
      estimatedTime: 15,
      popularity: 85,
      lastUpdated: new Date()
    })

    this.addResource({
      id: 'ai-features-video',
      type: 'video',
      title: 'AI功能演示',
      description: '视频演示AI助手的强大功能',
      url: '/videos/ai-features.mp4',
      category: '功能',
      tags: ['AI', '视频', '演示'],
      difficulty: UserLevel.INTERMEDIATE,
      estimatedTime: 10,
      popularity: 92,
      lastUpdated: new Date()
    })
  }

  private setupEventListeners() {
    // 监听用户行为事件
    if (typeof window !== 'undefined') {
      // 页面加载完成
      window.addEventListener('load', () => {
        this.checkAndStartTours()
      })

      // 用户交互跟踪
      document.addEventListener('click', (e) => {
        this.trackUserInteraction('click', e.target as HTMLElement)
      })

      // 功能使用跟踪
      document.addEventListener('feature-used', ((e: CustomEvent) => {
        this.trackFeatureUsage(e.detail.feature)
      }) as EventListener)
    }
  }

  // 公共方法

  /**
   * 开始引导
   */
  async startTour(tourId: string): Promise<void> {
    const tour = this.tours.get(tourId)
    if (!tour) {
      throw new Error(`Tour ${tourId} not found`)
    }

    if (tour.status === TourStatus.COMPLETED) {
      console.log('Tour already completed')
      return
    }

    tour.status = TourStatus.IN_PROGRESS
    tour.startedAt = new Date()
    tour.currentStep = 0
    
    this.context.currentTour = tour
    this.context.statistics.toursStarted++
    
    this.notifyListeners()
    this.trackEvent('tour_started', { tourId })
  }

  /**
   * 下一步
   */
  async nextStep(): Promise<void> {
    const tour = this.context.currentTour
    if (!tour) return

    if (tour.currentStep !== undefined && 
        tour.currentStep < tour.steps.length - 1) {
      tour.currentStep++
      this.notifyListeners()
      this.trackEvent('step_completed', { 
        tourId: tour.id, 
        stepId: tour.steps[tour.currentStep - 1].id 
      })
    } else {
      await this.completeTour()
    }
  }

  /**
   * 上一步
   */
  async previousStep(): Promise<void> {
    const tour = this.context.currentTour
    if (!tour || tour.currentStep === undefined) return

    if (tour.currentStep > 0) {
      tour.currentStep--
      this.notifyListeners()
    }
  }

  /**
   * 跳过引导
   */
  async skipTour(): Promise<void> {
    const tour = this.context.currentTour
    if (!tour) return

    tour.status = TourStatus.SKIPPED
    this.context.skippedTours.push(tour.id)
    this.context.statistics.toursSkipped++
    this.context.currentTour = undefined
    
    this.notifyListeners()
    this.trackEvent('tour_skipped', { tourId: tour.id })
  }

  /**
   * 完成引导
   */
  private async completeTour(): Promise<void> {
    const tour = this.context.currentTour
    if (!tour) return

    tour.status = TourStatus.COMPLETED
    tour.completedAt = new Date()
    this.context.completedTours.push(tour.id)
    this.context.statistics.toursCompleted++
    
    // 发放奖励
    if (tour.reward) {
      await this.grantReward(tour.reward)
    }

    // 更新用户等级
    this.updateUserLevel()
    
    this.context.currentTour = undefined
    this.notifyListeners()
    this.trackEvent('tour_completed', { tourId: tour.id })
  }

  /**
   * 获取当前步骤
   */
  getCurrentStep(): GuidanceStep | null {
    const tour = this.context.currentTour
    if (!tour || tour.currentStep === undefined) return null
    
    return tour.steps[tour.currentStep]
  }

  /**
   * 获取进度
   */
  getProgress(): { current: number; total: number; percentage: number } {
    const tour = this.context.currentTour
    if (!tour || tour.currentStep === undefined) {
      return { current: 0, total: 0, percentage: 0 }
    }

    const current = tour.currentStep + 1
    const total = tour.steps.length
    const percentage = Math.round((current / total) * 100)

    return { current, total, percentage }
  }

  /**
   * 获取上下文帮助
   */
  async getContextualHelp(feature: string, context: any): Promise<ContextualHelp> {
    // 分析上下文
    const suggestions = await this.generateHelpSuggestions(feature, context)
    const quickActions = this.getQuickActionsForFeature(feature)
    const relatedGuides = this.findRelatedTours(feature)
    const commonIssues = this.getCommonIssues(feature)

    return {
      feature,
      context,
      suggestions,
      quickActions,
      relatedGuides,
      commonIssues
    }
  }

  /**
   * 搜索帮助资源
   */
  searchResources(query: string, filters?: {
    type?: string
    category?: string
    difficulty?: UserLevel
  }): HelpResource[] {
    let results = Array.from(this.resources.values())

    // 文本搜索
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(r => 
        r.title.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery) ||
        r.tags.some(t => t.toLowerCase().includes(lowerQuery))
      )
    }

    // 应用过滤器
    if (filters) {
      if (filters.type) {
        results = results.filter(r => r.type === filters.type)
      }
      if (filters.category) {
        results = results.filter(r => r.category === filters.category)
      }
      if (filters.difficulty) {
        results = results.filter(r => r.difficulty === filters.difficulty)
      }
    }

    // 按流行度排序
    results.sort((a, b) => b.popularity - a.popularity)

    return results
  }

  /**
   * 显示工具提示
   */
  showTooltip(tooltipId: string): void {
    const tooltip = this.tooltips.get(tooltipId)
    if (!tooltip) return

    // 触发工具提示显示事件
    this.trackEvent('tooltip_shown', { tooltipId })
  }

  /**
   * 获取成就列表
   */
  getAchievements(): Achievement[] {
    return this.context.statistics.achievements
  }

  /**
   * 更新用户偏好
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this.context.preferences = {
      ...this.context.preferences,
      ...preferences
    }
    this.notifyListeners()
  }

  /**
   * 获取分析数据
   */
  getAnalytics(): GuidanceAnalytics {
    return this.analytics
  }

  /**
   * 注册监听器
   */
  subscribe(listener: (context: GuidanceContext) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // 私有辅助方法

  private addTour(tour: GuidanceTour): void {
    this.tours.set(tour.id, tour)
  }

  private addResource(resource: HelpResource): void {
    this.resources.set(resource.id, resource)
  }

  private async checkAndStartTours(): Promise<void> {
    if (!this.context.preferences.enableGuidance) return
    if (!this.context.preferences.autoStartTours) return

    // 检查是否需要启动新手引导
    if (!this.context.completedTours.includes('onboarding') &&
        !this.context.skippedTours.includes('onboarding') &&
        !this.context.preferences.skipOnboarding) {
      await this.startTour('onboarding')
    }
  }

  private trackUserInteraction(type: string, element: HTMLElement): void {
    // 跟踪用户交互
    const feature = element.getAttribute('data-feature') || 'unknown'
    this.trackEvent('user_interaction', { type, feature })
  }

  private trackFeatureUsage(feature: string): void {
    // 更新功能使用统计
    const existing = this.analytics.usage.mostUsedFeatures.find(f => f.feature === feature)
    if (existing) {
      existing.count++
    } else {
      this.analytics.usage.mostUsedFeatures.push({ feature, count: 1 })
    }
  }

  private trackEvent(event: string, data: any): void {
    // 发送分析事件
    console.log('Guidance Event:', event, data)
    
    // 更新统计
    if (event === 'tour_completed') {
      this.updateCompletionRate()
    }
  }

  private updateCompletionRate(): void {
    const total = this.context.statistics.toursStarted
    const completed = this.context.statistics.toursCompleted
    
    if (total > 0) {
      this.context.statistics.averageCompletion = (completed / total) * 100
    }
  }

  private updateUserLevel(): void {
    const completed = this.context.completedTours.length
    
    if (completed >= 10) {
      this.context.userLevel = UserLevel.EXPERT
    } else if (completed >= 5) {
      this.context.userLevel = UserLevel.ADVANCED
    } else if (completed >= 2) {
      this.context.userLevel = UserLevel.INTERMEDIATE
    }
  }

  private async grantReward(reward: any): Promise<void> {
    if (reward.type === 'badge') {
      const achievement: Achievement = {
        id: reward.value,
        name: reward.message,
        description: '完成引导获得',
        icon: '🏆',
        unlockedAt: new Date(),
        category: 'tour',
        rarity: 'common'
      }
      this.context.statistics.achievements.push(achievement)
    }

    // 显示奖励通知
    this.showNotification({
      id: `reward-${Date.now()}`,
      type: 'achievement',
      title: '获得成就！',
      message: reward.message,
      display: {
        position: 'top',
        duration: 5000,
        animation: 'bounce'
      },
      trigger: {
        type: 'achievement',
        value: reward.value
      },
      shown: true
    })
  }

  private showNotification(notification: GuidanceNotification): void {
    this.notifications.push(notification)
    this.notifyListeners()
  }

  private async generateHelpSuggestions(
    feature: string, 
    context: any
  ): Promise<HelpSuggestion[]> {
    const suggestions: HelpSuggestion[] = []

    // 基于功能生成建议
    switch (feature) {
      case 'calendar':
        suggestions.push({
          id: 'cal-1',
          title: '创建新事件',
          description: '点击空白时间段或使用快捷键Ctrl+N',
          confidence: 0.9
        })
        suggestions.push({
          id: 'cal-2',
          title: '查看不同视图',
          description: '切换日/周/月视图以获得不同的时间视角',
          confidence: 0.8
        })
        break
        
      case 'inbox':
        suggestions.push({
          id: 'inbox-1',
          title: '应用2分钟规则',
          description: '如果任务可以在2分钟内完成，立即执行',
          confidence: 0.95
        })
        break
    }

    return suggestions
  }

  private getQuickActionsForFeature(feature: string): QuickAction[] {
    const actions: QuickAction[] = []

    switch (feature) {
      case 'calendar':
        actions.push({
          id: 'quick-event',
          label: '快速创建事件',
          icon: '➕',
          shortcut: 'Ctrl+N',
          handler: () => console.log('Create event'),
          description: '创建新的日程事件'
        })
        break
    }

    return actions
  }

  private findRelatedTours(feature: string): string[] {
    const related: string[] = []
    
    this.tours.forEach((tour, id) => {
      if (tour.steps.some(step => 
        step.target?.includes(feature) || 
        step.description.includes(feature)
      )) {
        related.push(id)
      }
    })

    return related
  }

  private getCommonIssues(feature: string): CommonIssue[] {
    const issues: CommonIssue[] = []

    switch (feature) {
      case 'calendar':
        issues.push({
          id: 'cal-issue-1',
          problem: '事件时间冲突',
          solution: '使用AI助手自动检测和解决冲突',
          steps: [
            '打开AI助手面板',
            '选择"解决冲突"',
            '查看建议并应用'
          ],
          preventionTip: '创建事件时启用冲突检测',
          frequency: 45
        })
        break
    }

    return issues
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.context))
  }
}

// 导出单例
export const warmGuidanceService = WarmGuidanceService.getInstance()