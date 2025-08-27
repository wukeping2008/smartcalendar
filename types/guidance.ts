/**
 * Warm Guidance System Types
 * 温暖引导系统类型定义
 */

export interface GuidanceStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  
  // 交互配置
  action?: {
    type: 'click' | 'input' | 'scroll' | 'hover'
    selector?: string
    value?: any
    validate?: (value: any) => boolean
  }
  
  // 显示条件
  condition?: {
    type: 'time' | 'action' | 'state' | 'always'
    value?: any
  }
  
  // 样式配置
  style?: {
    highlight?: boolean
    overlay?: boolean
    animation?: 'pulse' | 'bounce' | 'fade'
  }
  
  // 内容类型
  content?: {
    type: 'text' | 'video' | 'image' | 'interactive'
    src?: string
    component?: React.ComponentType<any>
  }
  
  // 进度追踪
  progress?: {
    current: number
    total: number
  }
  
  // 跳过配置
  skippable?: boolean
  skipLabel?: string
}

export interface GuidanceTour {
  id: string
  name: string
  description: string
  category: TourCategory
  
  // 步骤列表
  steps: GuidanceStep[]
  
  // 触发条件
  trigger: TourTrigger
  
  // 目标用户
  targetAudience: UserLevel
  
  // 完成奖励
  reward?: {
    type: 'badge' | 'points' | 'feature'
    value: any
    message: string
  }
  
  // 状态
  status: TourStatus
  startedAt?: Date
  completedAt?: Date
  currentStep?: number
  
  // 个性化
  personality: TourPersonality
}

export enum TourCategory {
  ONBOARDING = 'onboarding',
  FEATURE = 'feature',
  TIPS = 'tips',
  WORKFLOW = 'workflow',
  ADVANCED = 'advanced'
}

export enum UserLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum TourStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

export interface TourTrigger {
  type: 'immediate' | 'delayed' | 'event' | 'manual' | 'contextual'
  
  // 延迟触发
  delay?: number // 毫秒
  
  // 事件触发
  event?: {
    name: string
    count?: number // 触发次数
  }
  
  // 上下文触发
  context?: {
    time?: string // 特定时间
    location?: string // 特定页面
    feature?: string // 使用特定功能
    userState?: any // 用户状态
  }
  
  // 条件组合
  conditions?: Array<{
    type: string
    operator: 'and' | 'or'
    value: any
  }>
}

export interface TourPersonality {
  tone: 'friendly' | 'professional' | 'playful' | 'encouraging'
  avatar?: {
    type: 'character' | 'icon' | 'none'
    src?: string
    name?: string
  }
  
  // 个性化消息
  messages: {
    welcome?: string
    progress?: string
    encouragement?: string[]
    completion?: string
    skip?: string
  }
  
  // 交互风格
  interaction: {
    allowQuestions?: boolean
    provideTips?: boolean
    showProgress?: boolean
    celebrateSuccess?: boolean
  }
}

export interface GuidanceContext {
  currentTour?: GuidanceTour
  completedTours: string[]
  skippedTours: string[]
  userLevel: UserLevel
  preferences: UserPreferences
  statistics: GuidanceStatistics
}

export interface UserPreferences {
  enableGuidance: boolean
  autoStartTours: boolean
  showTips: boolean
  guidanceSpeed: 'slow' | 'normal' | 'fast'
  preferredTime?: string // 偏好引导时间
  skipOnboarding?: boolean
}

export interface GuidanceStatistics {
  toursStarted: number
  toursCompleted: number
  toursSkipped: number
  averageCompletion: number
  totalTimeSpent: number
  lastActiveDate: Date
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: Date
  category: 'tour' | 'feature' | 'milestone'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface Tooltip {
  id: string
  target: string // CSS selector
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  
  // 显示条件
  showWhen?: {
    hover?: boolean
    focus?: boolean
    firstTime?: boolean
    contextual?: any
  }
  
  // 样式
  style?: {
    theme?: 'light' | 'dark'
    maxWidth?: number
    showArrow?: boolean
  }
  
  // 持续时间
  duration?: number // 自动消失时间
  persistent?: boolean // 是否持续显示
}

export interface HelpResource {
  id: string
  type: 'article' | 'video' | 'faq' | 'contact'
  title: string
  description: string
  url?: string
  content?: string
  category: string
  tags: string[]
  difficulty: UserLevel
  estimatedTime?: number // 预计阅读/观看时间（分钟）
  popularity: number
  lastUpdated: Date
}

export interface InteractiveGuide {
  id: string
  title: string
  description: string
  
  // 交互元素
  elements: Array<{
    id: string
    type: 'button' | 'input' | 'select' | 'drag' | 'checkbox'
    label: string
    value?: any
    validation?: (value: any) => boolean
    feedback?: {
      success: string
      error: string
    }
  }>
  
  // 模拟环境
  sandbox?: {
    enabled: boolean
    resetable: boolean
    initialState: any
  }
  
  // 进度追踪
  checkpoints: Array<{
    id: string
    name: string
    completed: boolean
    score?: number
  }>
  
  // 完成条件
  completion: {
    type: 'all' | 'any' | 'score'
    threshold?: number
  }
}

export interface GuidanceNotification {
  id: string
  type: 'tip' | 'reminder' | 'achievement' | 'update'
  title: string
  message: string
  
  // 显示配置
  display: {
    position: 'top' | 'bottom' | 'center'
    duration: number
    animation?: 'slide' | 'fade' | 'bounce'
  }
  
  // 交互
  actions?: Array<{
    label: string
    action: string
    primary?: boolean
  }>
  
  // 触发条件
  trigger: {
    type: 'time' | 'action' | 'achievement'
    value: any
  }
  
  // 状态
  shown: boolean
  dismissedAt?: Date
  clickedAt?: Date
}

export interface ContextualHelp {
  feature: string
  context: any
  suggestions: HelpSuggestion[]
  quickActions: QuickAction[]
  relatedGuides: string[] // Tour IDs
  commonIssues: CommonIssue[]
}

export interface HelpSuggestion {
  id: string
  title: string
  description: string
  action?: {
    label: string
    handler: () => void
  }
  confidence: number // 0-1, 建议的相关度
}

export interface QuickAction {
  id: string
  label: string
  icon?: string
  shortcut?: string
  handler: () => void
  description?: string
}

export interface CommonIssue {
  id: string
  problem: string
  solution: string
  steps?: string[]
  preventionTip?: string
  frequency: number // 问题出现频率
}

export interface FeedbackRequest {
  id: string
  tourId: string
  stepId?: string
  
  // 反馈类型
  type: 'rating' | 'text' | 'choice' | 'mixed'
  
  // 问题
  question: string
  
  // 选项（用于choice类型）
  options?: Array<{
    value: any
    label: string
  }>
  
  // 评分范围（用于rating类型）
  scale?: {
    min: number
    max: number
    labels?: string[]
  }
  
  // 提交的反馈
  response?: {
    value: any
    timestamp: Date
    additionalComments?: string
  }
}

export interface GuidanceAnalytics {
  // 使用统计
  usage: {
    totalSessions: number
    averageSessionDuration: number
    mostUsedFeatures: Array<{ feature: string; count: number }>
    leastUsedFeatures: Array<{ feature: string; count: number }>
  }
  
  // 引导效果
  effectiveness: {
    completionRate: number
    dropOffPoints: Array<{ tourId: string; stepId: string; count: number }>
    averageTimePerStep: number
    userSatisfaction: number
  }
  
  // 用户行为
  behavior: {
    preferredLearningStyle: 'visual' | 'interactive' | 'text'
    peakLearningTime: string
    skipPatterns: Array<{ pattern: string; frequency: number }>
  }
  
  // 改进建议
  recommendations: Array<{
    type: 'improve' | 'remove' | 'add'
    target: string
    reason: string
    priority: 'high' | 'medium' | 'low'
  }>
}