/**
 * Daily Briefing Types
 * 每日简报系统类型定义
 */

export interface DailyBriefing {
  id: string
  date: Date
  generatedAt: Date
  
  // 简报内容
  summary: BriefingSummary
  weather: WeatherInfo
  schedule: ScheduleSummary
  tasks: TaskSummary
  market: MarketSummary
  insights: AIInsights
  recommendations: Recommendation[]
  
  // 元数据
  readStatus: 'unread' | 'read' | 'archived'
  readAt?: Date
  voiceNarrationUrl?: string
  tags: string[]
}

export interface BriefingSummary {
  greeting: string
  dateInfo: string
  overview: string
  highlights: string[]
  quote?: DailyQuote
}

export interface DailyQuote {
  text: string
  author: string
  category: 'motivation' | 'wisdom' | 'business' | 'life'
}

export interface WeatherInfo {
  current: {
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
    icon: string
  }
  forecast: {
    high: number
    low: number
    condition: string
    precipitation: number
  }
  suggestions: string[]
}

export interface ScheduleSummary {
  totalEvents: number
  importantEvents: EventBrief[]
  firstEvent?: EventBrief
  lastEvent?: EventBrief
  busyPeriods: TimePeriod[]
  freeSlots: TimePeriod[]
  conflictWarnings: string[]
}

export interface EventBrief {
  id: string
  title: string
  time: string
  duration: number
  category: string
  priority: 'high' | 'medium' | 'low'
  location?: string
  attendees?: string[]
  preparation?: string[]
}

export interface TimePeriod {
  start: Date
  end: Date
  duration: number
  label?: string
}

export interface TaskSummary {
  totalTasks: number
  completedYesterday: number
  dueToday: number
  overdue: number
  
  priorityTasks: TaskBrief[]
  upcomingDeadlines: TaskBrief[]
  suggestedFocus: TaskBrief[]
  
  estimatedWorkload: number // 预计工作量（小时）
  recommendedSchedule: TaskSchedule[]
}

export interface TaskBrief {
  id: string
  title: string
  category: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  dueTime?: Date
  estimatedDuration: number
  progress: number
  dependencies?: string[]
  context?: string
}

export interface TaskSchedule {
  task: TaskBrief
  suggestedTime: TimePeriod
  reason: string
}

export interface MarketSummary {
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours'
  keyIndicators: MarketIndicator[]
  watchlist: WatchlistItem[]
  economicEvents: EconomicEvent[]
  tradingOpportunities: TradingOpportunity[]
  riskAlerts: string[]
}

export interface MarketIndicator {
  symbol: string
  name: string
  value: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'flat'
}

export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  volume: number
  signal?: 'buy' | 'sell' | 'hold'
  note?: string
}

export interface EconomicEvent {
  time: Date
  title: string
  importance: 'high' | 'medium' | 'low'
  forecast?: string
  previous?: string
  impact?: string
}

export interface TradingOpportunity {
  type: 'breakout' | 'reversal' | 'trend' | 'news'
  symbol: string
  entry: number
  target: number
  stop: number
  confidence: number
  reasoning: string
}

export interface AIInsights {
  productivity: ProductivityInsight
  health: HealthInsight
  financial: FinancialInsight
  learning: LearningInsight
  social: SocialInsight
}

export interface ProductivityInsight {
  score: number
  trend: 'improving' | 'stable' | 'declining'
  analysis: string
  suggestions: string[]
  focusTime: TimePeriod[]
}

export interface HealthInsight {
  energyLevel: 'high' | 'medium' | 'low'
  stressLevel: 'high' | 'medium' | 'low'
  suggestions: string[]
  breaks: TimePeriod[]
}

export interface FinancialInsight {
  portfolioStatus: string
  dailyTarget: number
  riskLevel: 'high' | 'medium' | 'low'
  suggestions: string[]
}

export interface LearningInsight {
  learningGoals: string[]
  suggestedContent: ContentSuggestion[]
  skillProgress: SkillProgress[]
}

export interface ContentSuggestion {
  title: string
  type: 'article' | 'video' | 'course' | 'book'
  duration: number
  url?: string
  relevance: number
}

export interface SkillProgress {
  skill: string
  level: number
  progress: number
  nextMilestone: string
}

export interface SocialInsight {
  importantContacts: ContactReminder[]
  networkingOpportunities: string[]
  relationshipHealth: number
}

export interface ContactReminder {
  name: string
  reason: string
  lastContact: Date
  suggestedAction: string
}

export interface Recommendation {
  id: string
  type: 'schedule' | 'task' | 'health' | 'financial' | 'learning'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: {
    label: string
    handler: string
    params?: any
  }
  timeframe?: string
  impact?: string
}

export interface BriefingPreferences {
  // 生成时间
  generateTime: string // "06:00"
  autoGenerate: boolean
  
  // 内容偏好
  sections: {
    weather: boolean
    schedule: boolean
    tasks: boolean
    market: boolean
    insights: boolean
    quote: boolean
  }
  
  // 个性化设置
  tone: 'formal' | 'casual' | 'motivational'
  length: 'brief' | 'standard' | 'detailed'
  language: 'zh' | 'en'
  
  // 交付方式
  delivery: {
    push: boolean
    email: boolean
    voice: boolean
  }
  
  // 重点关注
  focus: {
    productivity: boolean
    health: boolean
    financial: boolean
    learning: boolean
    social: boolean
  }
}

export enum BriefingSection {
  SUMMARY = 'summary',
  WEATHER = 'weather',
  SCHEDULE = 'schedule',
  TASKS = 'tasks',
  MARKET = 'market',
  INSIGHTS = 'insights',
  RECOMMENDATIONS = 'recommendations'
}

export interface BriefingTemplate {
  id: string
  name: string
  description: string
  sections: BriefingSection[]
  style: {
    greeting: string
    closing: string
    tone: string
  }
  isDefault: boolean
}