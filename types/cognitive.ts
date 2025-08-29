/**
 * 认知带宽管理相关类型定义
 * 基于客户需求：管理有限的认知资源，避免过载
 */

/**
 * 承诺类型枚举
 */
export enum CommitmentType {
  CORE = 'core',           // 核心承诺（必须记住）
  SOCIAL = 'social',       // 社交客套（可以忘记）
  FINANCIAL = 'financial', // 财务相关（帮人兜底等）
  SECRET = 'secret',       // 保密事项
  FAVOR = 'favor'         // 人情往来
}

/**
 * 承诺优先级
 */
export enum CommitmentPriority {
  CRITICAL = 'critical',   // 关键（Trading相关）
  HIGH = 'high',          // 高（直接收益相关）
  MEDIUM = 'medium',      // 中（合作伙伴相关）
  LOW = 'low'            // 低（社交往来）
}

/**
 * 承诺状态
 */
export enum CommitmentStatus {
  ACTIVE = 'active',           // 活跃
  PENDING = 'pending',         // 待处理
  ARCHIVED = 'archived',       // 已归档
  EXPIRED = 'expired',         // 已过期
  REJECTED = 'rejected',       // 已拒绝
  COMPLETED = 'completed'      // 已完成
}

/**
 * 承诺项
 */
export interface Commitment {
  id: string
  type: CommitmentType
  priority: CommitmentPriority
  status: CommitmentStatus
  content: string
  source: string              // 来源（谁的请求）
  createdAt: Date
  expiresAt?: Date           // 自动过期时间
  cognitiveLoad: number      // 占用认知负载（1-3）
  isAutoDismissible: boolean // 是否可自动忽略
  rejectionTemplate?: string  // 拒绝模板
  notes?: string
}

/**
 * 认知负载等级
 */
export enum CognitiveLoadLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  OVERLOAD = 'overload'
}

/**
 * 认知负载状态
 */
export interface CognitiveLoad {
  current: number            // 当前负载值
  max: number               // 最大容量（默认7）
  threshold: number         // 警告阈值（默认5）
  level: CognitiveLoadLevel  // 当前负载等级
  activeItems: CognitiveItem[]
  archivedItems: CognitiveItem[]
}

/**
 * 认知项（占用认知带宽的事项）
 */
export interface CognitiveItem {
  id: string
  type: 'commitment' | 'task' | 'decision' | 'secret'
  load: number              // 占用负载（1-3）
  title: string
  deadline?: Date
  source?: string
  canAutoArchive: boolean
  priority: CommitmentPriority
}

/**
 * Trading专注模式配置
 */
export interface TradingFocusMode {
  enabled: boolean
  startTime?: Date
  duration?: number         // 分钟
  blockAllInterruptions: boolean
  allowedContacts: string[] // 允许打扰的联系人（如野猪老师）
  decisionTimeLimit: number // 决策时限（默认1分钟）
}

/**
 * 专家评级
 */
export interface ExpertRating {
  expertise: string[]       // 专业领域
  emotionalStability: number // 情绪稳定度 (1-5)
  boundaryClarity: number    // 边界清晰度 (1-5)
  responseTime: number       // 平均响应时间（小时）
  reliability: number        // 可靠度 (1-5)
  lastContact?: Date
  preferredChannel: 'wechat' | 'email' | 'phone' | 'meeting'
}

/**
 * ROI（投资回报率）计算
 */
export interface ROICalculation {
  activity: string
  timeInvestment: number    // 小时
  expectedReturn: number    // 预期收益
  tradingOpportunityCost: number // Trading机会成本
  roi: number              // 计算得出的ROI
  recommendation: 'accept' | 'reject' | 'delegate'
  reason: string
}

/**
 * 认知带宽统计
 */
export interface CognitiveBandwidthStats {
  date: Date
  averageLoad: number
  peakLoad: number
  peakTime: Date
  overloadDuration: number  // 过载时长（分钟）
  rejectedCommitments: number
  completedCommitments: number
  tradingFocusTime: number  // Trading专注时长（分钟）
}

/**
 * 智能拒绝模板
 */
export interface RejectionTemplate {
  id: string
  type: CommitmentType      // 承诺类型
  message: string           // 拒绝消息内容
  tone?: 'polite' | 'firm' | 'friendly' | 'professional'  // 语气
  scenario?: string         // 场景描述
  usage?: number           // 使用次数
  effectiveness?: number   // 有效性评分
}

/**
 * 认知带宽预警
 */
export interface CognitiveAlert {
  id: string
  type: 'overload' | 'approaching_limit' | 'deadline' | 'expired' | 'info'
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: Date
  suggestedAction?: string
  relatedItems?: string[]  // 相关认知项ID
}