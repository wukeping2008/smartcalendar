/**
 * Person Card CRM Types
 * 人物卡CRM系统类型定义
 */

export interface PersonCard {
  id: string
  // 基本信息
  name: string
  avatar?: string
  title?: string
  company?: string
  department?: string
  
  // 联系方式
  contact: ContactInfo
  
  // 关系属性
  relationship: RelationshipInfo
  
  // 互动记录
  interactions: Interaction[]
  
  // 标签和分类
  tags: string[]
  category: PersonCategory
  
  // 重要性和影响力
  importance: ImportanceLevel
  influence: InfluenceScore
  
  // 个人特征
  personality: PersonalityProfile
  
  // 兴趣和偏好
  interests: string[]
  preferences: Preferences
  
  // 重要日期
  importantDates: ImportantDate[]
  
  // 笔记和备忘
  notes: Note[]
  
  // 任务和待办
  tasks: PersonTask[]
  
  // 业务相关
  business: BusinessInfo
  
  // 社交网络
  socialNetwork: SocialConnection[]
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  lastContactedAt?: Date
  nextContactDate?: Date
  
  // 扩展字段（从关系管理模块迁移）
  contactPreferences?: ContactPreferences
  giftManagement?: GiftManagement
  meetingPreferences?: MeetingPreferences
}

export interface ContactInfo {
  phone?: string
  mobile?: string
  email?: string
  wechat?: string
  linkedin?: string
  twitter?: string
  address?: string
  website?: string
  other?: Record<string, string>
}

export interface RelationshipInfo {
  type: RelationType
  strength: RelationshipStrength
  frequency: ContactFrequency
  quality: RelationshipQuality
  trustLevel: number // 0-100
  reciprocity: number // 0-100 互惠程度
  history: string
  status: RelationshipStatus
}

export enum RelationType {
  FAMILY = 'family',
  FRIEND = 'friend',
  COLLEAGUE = 'colleague',
  CLIENT = 'client',
  PARTNER = 'partner',
  MENTOR = 'mentor',
  MENTEE = 'mentee',
  ACQUAINTANCE = 'acquaintance',
  PROFESSIONAL = 'professional',
  OTHER = 'other'
}

export enum RelationshipStrength {
  VERY_CLOSE = 'very_close',
  CLOSE = 'close',
  MODERATE = 'moderate',
  WEAK = 'weak',
  VERY_WEAK = 'very_weak'
}

export enum ContactFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  RARELY = 'rarely'
}

export enum RelationshipQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  NEUTRAL = 'neutral',
  STRAINED = 'strained',
  DIFFICULT = 'difficult'
}

export enum RelationshipStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DORMANT = 'dormant',
  LOST = 'lost',
  POTENTIAL = 'potential'
}

export interface Interaction {
  id: string
  date: Date
  type: InteractionType
  channel: CommunicationChannel
  duration?: number // 分钟
  subject: string
  content?: string
  outcome?: string
  sentiment: Sentiment
  followUp?: FollowUp
  attachments?: string[]
  location?: string
  participants?: string[] // 其他参与者
}

export enum InteractionType {
  MEETING = 'meeting',
  CALL = 'call',
  EMAIL = 'email',
  MESSAGE = 'message',
  SOCIAL = 'social',
  EVENT = 'event',
  GIFT = 'gift',
  FAVOR = 'favor',
  COLLABORATION = 'collaboration'
}

export enum CommunicationChannel {
  IN_PERSON = 'in_person',
  PHONE = 'phone',
  VIDEO = 'video',
  EMAIL = 'email',
  WECHAT = 'wechat',
  LINKEDIN = 'linkedin',
  WHATSAPP = 'whatsapp',
  OTHER = 'other'
}

export enum Sentiment {
  VERY_POSITIVE = 'very_positive',
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  VERY_NEGATIVE = 'very_negative'
}

export interface FollowUp {
  required: boolean
  date?: Date
  action: string
  completed: boolean
}

export enum PersonCategory {
  VIP = 'vip',
  KEY_CONTACT = 'key_contact',
  REGULAR = 'regular',
  OCCASIONAL = 'occasional',
  ARCHIVED = 'archived'
}

export enum ImportanceLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal'
}

export interface InfluenceScore {
  professional: number // 0-100
  social: number // 0-100
  financial: number // 0-100
  knowledge: number // 0-100
  overall: number // 0-100
}

export interface PersonalityProfile {
  type?: string // MBTI, DISC等
  traits: string[]
  communicationStyle: CommunicationStyle
  workingStyle?: string
  values: string[]
  strengths: string[]
  weaknesses?: string[]
  motivations: string[]
}

export enum CommunicationStyle {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  FORMAL = 'formal',
  CASUAL = 'casual',
  ANALYTICAL = 'analytical',
  EMOTIONAL = 'emotional'
}

export interface Preferences {
  contactTime?: string // 最佳联系时间
  contactMethod?: CommunicationChannel
  topics: string[] // 喜欢的话题
  avoidTopics?: string[] // 避免的话题
  gifts?: string[] // 礼物偏好
  dietary?: string[] // 饮食偏好
  activities?: string[] // 活动偏好
}

export interface ImportantDate {
  id: string
  date: Date
  type: DateType
  description: string
  reminder: boolean
  reminderDays?: number // 提前提醒天数
  recurring: boolean
  recurringPattern?: string
}

export enum DateType {
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  MILESTONE = 'milestone',
  DEADLINE = 'deadline',
  CUSTOM = 'custom'
}

export interface Note {
  id: string
  date: Date
  content: string
  type: NoteType
  tags?: string[]
  private: boolean
}

export enum NoteType {
  GENERAL = 'general',
  MEETING = 'meeting',
  IDEA = 'idea',
  FEEDBACK = 'feedback',
  PERSONAL = 'personal',
  BUSINESS = 'business'
}

export interface PersonTask {
  id: string
  title: string
  description?: string
  dueDate?: Date
  priority: TaskPriority
  status: TaskStatus
  type: TaskType
  relatedInteraction?: string
}

export enum TaskPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TaskType {
  FOLLOW_UP = 'follow_up',
  REACH_OUT = 'reach_out',
  GIFT = 'gift',
  INTRODUCE = 'introduce',
  HELP = 'help',
  REMINDER = 'reminder'
}

export interface BusinessInfo {
  role?: string
  industry?: string
  expertise: string[]
  projects: Project[]
  deals: Deal[]
  revenue?: number
  potential?: BusinessPotential
}

export interface Project {
  id: string
  name: string
  status: string
  startDate?: Date
  endDate?: Date
  value?: number
  notes?: string
}

export interface Deal {
  id: string
  title: string
  amount?: number
  stage: string
  probability?: number
  closeDate?: Date
  notes?: string
}

export enum BusinessPotential {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none'
}

export interface SocialConnection {
  personId: string
  name: string
  relationship: string
  strength: number // 0-100
  mutual: boolean
}

// 关系管理策略
export interface RelationshipStrategy {
  personId: string
  goals: string[]
  approach: string
  touchpoints: TouchPoint[]
  milestones: Milestone[]
  risks: string[]
  opportunities: string[]
}

export interface TouchPoint {
  id: string
  date: Date
  type: string
  purpose: string
  plannedOutcome: string
  actualOutcome?: string
  effectiveness: number // 0-100
}

export interface Milestone {
  id: string
  title: string
  targetDate: Date
  achieved: boolean
  achievedDate?: Date
  impact: string
}

// 关系分析
export interface RelationshipAnalytics {
  personId: string
  
  // 互动统计
  interactionCount: number
  lastInteractionDays: number
  averageInteractionInterval: number
  interactionTrend: 'increasing' | 'stable' | 'decreasing'
  
  // 关系健康度
  healthScore: number // 0-100
  healthTrend: 'improving' | 'stable' | 'declining'
  healthFactors: HealthFactor[]
  
  // 价值分析
  valueProvided: number // 0-100
  valueReceived: number // 0-100
  valueBalance: number // -100 to 100
  
  // 风险评估
  churnRisk: number // 0-100
  riskFactors: string[]
  
  // 机会识别
  opportunities: Opportunity[]
  
  // 建议
  recommendations: Recommendation[]
}

export interface HealthFactor {
  factor: string
  score: number
  weight: number
  trend: 'up' | 'stable' | 'down'
}

export interface Opportunity {
  id: string
  type: string
  description: string
  potential: number // 0-100
  effort: number // 0-100
  timeframe: string
}

export interface Recommendation {
  id: string
  type: 'action' | 'warning' | 'insight'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  suggestedAction?: string
  deadline?: Date
}

// 群组管理
export interface PersonGroup {
  id: string
  name: string
  description?: string
  members: string[] // person IDs
  type: GroupType
  purpose?: string
  tags?: string[]
  createdAt: Date
}

export enum GroupType {
  TEAM = 'team',
  FAMILY = 'family',
  FRIENDS = 'friends',
  CLIENTS = 'clients',
  NETWORK = 'network',
  CUSTOM = 'custom'
}

// 搜索和过滤
export interface PersonSearchCriteria {
  query?: string
  categories?: PersonCategory[]
  relationTypes?: RelationType[]
  tags?: string[]
  importance?: ImportanceLevel[]
  lastContactedDays?: number
  hasUpcomingTasks?: boolean
  hasNotes?: boolean
  groups?: string[]
}

// 从关系管理模块迁移的新接口
export interface ContactPreferences {
  communication: {
    preferred: 'email' | 'phone' | 'wechat' | 'meeting' | 'message'
    bestTime: string // 例如 "9:00-11:00"
    style: 'formal' | 'casual' | 'friendly' | 'professional'
    language: 'chinese' | 'english' | 'bilingual'
    responseTime: 'immediate' | 'same_day' | 'next_day' | 'flexible'
  }
  availability: {
    weekdays: boolean[]
    timeZone: string
    vacationDates?: Date[]
    busyPeriods?: {start: Date, end: Date}[]
  }
  boundaries: {
    afterHours: boolean
    weekends: boolean
    holidays: boolean
    emergencyOnly: string[] // 紧急联系方式
  }
}

export interface MeetingPreferences {
  duration: {
    preferred: number // 分钟
    minimum: number
    maximum: number
  }
  location: {
    preferred: 'office' | 'remote' | 'coffee' | 'restaurant' | 'flexible'
    specificVenues?: string[]
  }
  preparation: {
    needsAgenda: boolean
    preparationTime: number // 分钟
    materialsInAdvance: boolean
    reminderTime: number // 提前多少分钟提醒
  }
  style: {
    formal: boolean
    recordingAllowed: boolean
    noteTaking: 'self' | 'assistant' | 'shared' | 'none'
  }
}

export interface GiftManagement {
  preferences: {
    likes: string[]
    dislikes: string[]
    allergies?: string[]
    interests: string[]
  }
  budget: {
    birthday: number
    holiday: number
    special: number
    business: number
  }
  history: GiftRecord[]
  occasions: {
    birthday: boolean
    newYear: boolean
    christmas: boolean
    custom: string[]
  }
}

export interface GiftRecord {
  id: string
  date: Date
  occasion: string
  item: string
  value?: number
  response?: 'loved' | 'liked' | 'neutral' | 'disliked'
  notes?: string
}

// 导入导出
export interface PersonCardExport {
  version: string
  exportDate: Date
  persons: PersonCard[]
  groups: PersonGroup[]
  metadata?: any
}