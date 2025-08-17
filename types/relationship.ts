/**
 * 人际关系管理系统类型定义
 * 支持执行秘书功能：下属管理、重要日期跟踪、人情世故提醒
 */

import { Priority } from './event'

// 联系人核心信息
export interface ExecutiveContact {
  id: string
  name: string
  title: string
  department?: string
  company?: string
  
  // 关系类型
  relationship: RelationshipType
  reportingLevel: number // 汇报层级：-1(直接下属), 0(平级), 1(上级), 2(高层)
  importanceLevel: number // 重要程度 1-10
  
  // 联系信息
  email?: string
  phone?: string
  wechat?: string
  office?: string
  
  // 个人信息
  personalInfo: PersonalInfo
  
  // 互动历史
  lastInteraction: Date
  interactionFrequency: InteractionFrequency
  totalInteractions: number
  
  // 偏好和备注
  preferences: ContactPreferences
  notes: string[]
  tags: string[]
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export enum RelationshipType {
  DIRECT_REPORT = 'direct_report',    // 直接下属
  SKIP_LEVEL = 'skip_level',          // 跨级下属
  PEER = 'peer',                      // 同级同事
  MANAGER = 'manager',                // 直接上级
  SENIOR_LEADER = 'senior_leader',    // 高层领导
  CLIENT = 'client',                  // 客户
  VENDOR = 'vendor',                  // 供应商
  PARTNER = 'partner',                // 合作伙伴
  STAKEHOLDER = 'stakeholder',        // 利益相关者
  OTHER = 'other'                     // 其他
}

export enum InteractionFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ADHOC = 'adhoc'
}

// 个人信息
export interface PersonalInfo {
  birthday?: Date
  spouse?: string
  children?: Array<{
    name: string
    birthday?: Date
    age?: number
  }>
  hobbies?: string[]
  dietaryRestrictions?: string[]
  personalMilestones: PersonalMilestone[]
}

export interface PersonalMilestone {
  id: string
  type: MilestoneType
  date: Date
  description: string
  isRecurring: boolean
  priority: Priority
  reminderDays: number[] // 提前几天提醒：[7, 3, 1]
}

export enum MilestoneType {
  BIRTHDAY = 'birthday',
  WORK_ANNIVERSARY = 'work_anniversary',
  WEDDING_ANNIVERSARY = 'wedding_anniversary',
  CHILD_BIRTH = 'child_birth',
  PROMOTION = 'promotion',
  GRADUATION = 'graduation',
  RETIREMENT = 'retirement',
  OTHER = 'other'
}

// 联系偏好
export interface ContactPreferences {
  preferredCommunicationMethod: 'email' | 'phone' | 'wechat' | 'in_person'
  bestTimeToContact: string // "9:00-11:00, 14:00-17:00"
  meetingPreferences: {
    preferredDuration: number // 分钟
    preferredLocation: 'office' | 'conference_room' | 'video_call' | 'coffee_shop'
    needsPreparationTime: number // 分钟
  }
  communicationStyle: 'formal' | 'informal' | 'direct' | 'collaborative'
  languagePreference: 'chinese' | 'english' | 'bilingual'
}

// 周期性事务
export interface PeriodicEvent {
  id: string
  contactId: string
  type: PeriodicEventType
  title: string
  description?: string
  
  // 周期设置
  frequency: RecurrenceFrequency
  interval: number // 间隔：每1周、每2周等
  dayOfWeek?: number // 周几：0(周日)-6(周六)
  dayOfMonth?: number // 每月几号
  
  // 时间设置
  duration: number // 持续时间（分钟）
  preferredTimeSlots: string[] // ["9:00-10:00", "14:00-15:00"]
  
  // 会议设置
  location?: string
  isVirtualMeeting: boolean
  meetingLink?: string
  
  // 准备工作
  preparationTasks: PreparationTask[]
  
  // 状态
  isActive: boolean
  nextOccurrence?: Date
  lastOccurrence?: Date
  
  createdAt: Date
  updatedAt: Date
}

export enum PeriodicEventType {
  ONE_ON_ONE = 'one_on_one',           // 1:1会议
  TEAM_MEETING = 'team_meeting',       // 团队会议
  STATUS_UPDATE = 'status_update',     // 状态汇报
  PERFORMANCE_REVIEW = 'performance_review', // 绩效评估
  CAREER_DISCUSSION = 'career_discussion',   // 职业发展讨论
  FEEDBACK_SESSION = 'feedback_session',     // 反馈会议
  SOCIAL_INTERACTION = 'social_interaction', // 社交互动
  CHECK_IN = 'check_in',               // 常规检查
  OTHER = 'other'
}

export enum RecurrenceFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly', 
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  CUSTOM = 'custom'
}

export interface PreparationTask {
  id: string
  title: string
  description?: string
  dueMinutesBefore: number // 会议前多少分钟完成
  isCompleted: boolean
  assignee?: string // 负责人
}

// 人情世故任务
export interface RelationshipTask {
  id: string
  contactId: string
  type: RelationshipTaskType
  title: string
  description: string
  
  // 优先级和时间
  priority: Priority
  dueDate?: Date
  completionDate?: Date
  status: RelationshipTaskStatus
  
  // 执行细节
  suggestedActions: string[]
  budget?: number // 预算（如买礼物）
  vendor?: string // 供应商（如花店）
  
  // 触发条件
  triggeredBy?: {
    milestoneId?: string
    eventType?: string
    automaticDetection?: boolean
  }
  
  // 跟进
  followUpRequired: boolean
  followUpDate?: Date
  
  createdAt: Date
  updatedAt: Date
}

export enum RelationshipTaskType {
  CONGRATULATIONS = 'congratulations',     // 祝贺
  CONDOLENCES = 'condolences',            // 慰问
  GET_WELL_WISHES = 'get_well_wishes',    // 慰问病人
  WELCOME_GIFT = 'welcome_gift',          // 欢迎礼物
  FAREWELL = 'farewell',                  // 送别
  HOLIDAY_GREETINGS = 'holiday_greetings', // 节日问候
  APPRECIATION = 'appreciation',          // 表示感谢
  BIRTHDAY_WISHES = 'birthday_wishes',    // 生日祝福
  WORK_ANNIVERSARY = 'work_anniversary',  // 工作纪念日
  TEAM_BUILDING = 'team_building',        // 团建活动
  NETWORKING = 'networking',              // 社交联络
  OTHER = 'other'
}

export enum RelationshipTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

// 关系管理洞察
export interface RelationshipInsight {
  id: string
  type: InsightType
  title: string
  description: string
  
  // 数据支持
  dataPoints: string[]
  affectedContacts: string[] // 相关联系人ID
  
  // 建议行动
  recommendedActions: Array<{
    action: string
    priority: Priority
    timeline: string
    effort: 'low' | 'medium' | 'high'
  }>
  
  // 评估
  impact: 'low' | 'medium' | 'high'
  urgency: 'low' | 'medium' | 'high'
  confidence: number // 0-1
  
  generatedAt: Date
  expiresAt?: Date
}

export enum InsightType {
  OVERDUE_INTERACTION = 'overdue_interaction',       // 互动过期
  UPCOMING_MILESTONE = 'upcoming_milestone',         // 即将到来的里程碑
  RELATIONSHIP_NEGLECT = 'relationship_neglect',     // 关系疏忽
  FREQUENCY_IMBALANCE = 'frequency_imbalance',       // 频率不平衡
  PREPARATION_REMINDER = 'preparation_reminder',     // 准备提醒
  FOLLOW_UP_REQUIRED = 'follow_up_required',         // 需要跟进
  TEAM_DYNAMICS = 'team_dynamics',                   // 团队动态
  NETWORKING_OPPORTUNITY = 'networking_opportunity'   // 社交机会
}

// 关系管理统计
export interface RelationshipMetrics {
  totalContacts: number
  activeContacts: number
  
  // 按类型统计
  contactsByRelationship: Record<RelationshipType, number>
  contactsByImportance: Record<string, number> // '1-3': low, '4-6': medium, '7-10': high
  
  // 互动统计
  interactionsThisWeek: number
  interactionsThisMonth: number
  averageInteractionFrequency: number
  
  // 任务统计
  pendingTasks: number
  overdueTasks: number
  completedTasksThisMonth: number
  
  // 即将到来的事件
  upcomingMilestones: number
  upcomingPeriodicEvents: number
  
  // 关系健康度评分
  overallRelationshipHealth: number // 0-100
  
  calculatedAt: Date
}

// 自动化规则
export interface RelationshipRule {
  id: string
  name: string
  description: string
  
  // 触发条件
  triggers: RuleTrigger[]
  
  // 执行动作
  actions: RuleAction[]
  
  // 设置
  isActive: boolean
  priority: number
  
  createdAt: Date
  updatedAt: Date
}

// 规则触发条件类型
export type RuleTriggerConditions = {
  milestoneType?: MilestoneType[]
  importanceLevel?: { min?: number; max?: number }
  relationshipType?: RelationshipType[]
  daysSinceLastInteraction?: number
  contactIds?: string[]
} & Record<string, unknown>

// 规则动作参数类型
export type RuleActionParameters = {
  taskType?: RelationshipTaskType
  reminderMessage?: string
  meetingDuration?: number
  noteContent?: string
  priority?: Priority
  reminderDays?: number[]
} & Record<string, unknown>

export interface RuleTrigger {
  type: 'milestone_approaching' | 'interaction_overdue' | 'new_contact' | 'task_created'
  conditions: RuleTriggerConditions
  daysBefore?: number
}

export interface RuleAction {
  type: 'create_task' | 'send_reminder' | 'schedule_meeting' | 'add_note'
  parameters: RuleActionParameters
}
