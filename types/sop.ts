/**
 * SOP (Standard Operating Procedure) 标准操作流程类型定义
 * v4.0 核心功能
 */

// ============ SOP 基础类型 ============

/**
 * SOP 类型枚举
 */
export enum SOPType {
  CHECKLIST = 'checklist',        // 检查清单
  STEP_BY_STEP = 'step_by_step',  // 分步指导
  FLOWCHART = 'flowchart'         // 流程图
}

/**
 * SOP 分类
 */
export enum SOPCategory {
  // 时间导向
  DAILY_ROUTINE = 'daily_routine',     // 日常例程
  WEEKLY_ROUTINE = 'weekly_routine',   // 周例程
  PERIODIC = 'periodic',               // 周期性任务
  
  // 事件触发
  EVENT_TRIGGERED = 'event_triggered', // 事件触发
  EMERGENCY = 'emergency',             // 紧急响应
  
  // 工作流程
  WORK_PROCESS = 'work_process',       // 工作流程
  MEETING = 'meeting',                 // 会议相关
  PROJECT = 'project',                 // 项目管理
  TRADING = 'trading',                 // 交易相关
  
  // 生活习惯
  HEALTH = 'health',                   // 健康管理
  TRAVEL = 'travel',                   // 出行准备
  PERSONAL = 'personal',               // 个人习惯
  SOCIAL = 'social'                    // 社交礼仪
}

/**
 * SOP 优先级
 */
export enum SOPPriority {
  CRITICAL = 'critical',   // 关键必做
  HIGH = 'high',          // 高优先级
  MEDIUM = 'medium',      // 中等优先级
  LOW = 'low',           // 低优先级
  OPTIONAL = 'optional'   // 可选
}

/**
 * SOP 步骤状态
 */
export enum StepStatus {
  PENDING = 'pending',       // 待执行
  IN_PROGRESS = 'in_progress', // 执行中
  COMPLETED = 'completed',   // 已完成
  SKIPPED = 'skipped',      // 已跳过
  FAILED = 'failed',        // 执行失败
  BLOCKED = 'blocked'       // 被阻塞
}

// ============ SOP 步骤定义 ============

/**
 * 基础步骤
 */
export interface SOPStep {
  id: string
  title: string
  description?: string
  
  // 执行信息
  estimatedDuration: number // 预计时长（秒）
  actualDuration?: number   // 实际时长（秒）
  
  // 状态
  status: StepStatus
  startedAt?: Date
  completedAt?: Date
  
  // 依赖关系
  dependsOn?: string[]      // 依赖的步骤ID
  blocks?: string[]         // 阻塞的步骤ID
  
  // 验证
  validation?: {
    type: 'manual' | 'automatic' | 'photo' | 'location' | 'data'
    criteria?: string
    validator?: (context: any) => boolean
  }
  
  // 资源
  resources?: {
    tools?: string[]        // 需要的工具
    documents?: string[]    // 相关文档
    people?: string[]       // 涉及人员
    links?: Array<{ title: string; url: string }>
  }
  
  // 提醒
  reminder?: {
    beforeStart?: number    // 开始前提醒（秒）
    message?: string
  }
  
  // 可选性
  optional?: boolean
  skipCondition?: (context: any) => boolean
  
  // 替代方案
  alternatives?: SOPStep[]
  
  // 标签
  tags?: string[]
  
  // 自定义数据
  metadata?: Record<string, any>
}

/**
 * 检查清单项
 */
export interface ChecklistItem extends SOPStep {
  checked: boolean
  checkType: 'checkbox' | 'toggle' | 'radio'
  group?: string // 分组名称
  required?: boolean
}

/**
 * 流程图节点
 */
export interface FlowchartNode extends SOPStep {
  type: 'start' | 'end' | 'process' | 'decision' | 'parallel' | 'loop'
  position: { x: number; y: number }
  
  // 决策节点
  decision?: {
    question: string
    options: Array<{
      label: string
      value: any
      nextNodeId: string
    }>
  }
  
  // 循环节点
  loop?: {
    condition: string
    maxIterations?: number
    currentIteration?: number
  }
  
  // 并行节点
  parallel?: {
    branches: string[][] // 并行分支的步骤ID
    joinType: 'all' | 'any' | 'custom'
  }
  
  // 连接
  connections: Array<{
    targetId: string
    label?: string
    condition?: string
  }>
}

// ============ SOP 主体定义 ============

/**
 * SOP 基础信息
 */
export interface SOPBase {
  id: string
  name: string
  description?: string
  category: SOPCategory
  type: SOPType
  priority: SOPPriority
  
  // 版本控制
  version: string
  isActive: boolean
  isDraft?: boolean
  
  // 触发条件
  triggers: SOPTrigger[]
  
  // 执行统计
  stats: {
    totalExecutions: number
    successRate: number
    averageDuration: number
    lastExecuted?: Date
    lastModified: Date
  }
  
  // 标签和搜索
  tags: string[]
  keywords?: string[]
  
  // 创建信息
  createdBy: string
  createdAt: Date
  updatedAt: Date
  
  // 共享设置
  visibility: 'private' | 'shared' | 'public'
  sharedWith?: string[]
  
  // 自定义属性
  customFields?: Record<string, any>
}

/**
 * 检查清单型SOP
 */
export interface ChecklistSOP extends SOPBase {
  type: SOPType.CHECKLIST
  items: ChecklistItem[]
  
  // 分组
  groups?: Array<{
    id: string
    name: string
    description?: string
    order: number
  }>
  
  // 完成条件
  completionCriteria: {
    requiredItems: string[] // 必须完成的项目ID
    minimumCompletion?: number // 最低完成百分比
  }
}

/**
 * 分步指导型SOP
 */
export interface StepByStepSOP extends SOPBase {
  type: SOPType.STEP_BY_STEP
  steps: SOPStep[]
  
  // 执行模式
  executionMode: 'sequential' | 'flexible' | 'parallel'
  
  // 进度跟踪
  progress: {
    currentStepId?: string
    completedSteps: string[]
    totalSteps: number
    percentComplete: number
  }
  
  // 引导设置
  guidance: {
    showTimer: boolean
    showProgress: boolean
    allowSkip: boolean
    allowReorder: boolean
    voiceGuidance?: boolean
  }
}

/**
 * 流程图型SOP
 */
export interface FlowchartSOP extends SOPBase {
  type: SOPType.FLOWCHART
  nodes: FlowchartNode[]
  
  // 流程控制
  flow: {
    startNodeId: string
    currentNodeId?: string
    visitedNodes: string[]
    decisionHistory: Array<{
      nodeId: string
      decision: any
      timestamp: Date
    }>
  }
  
  // 可视化设置
  visualization: {
    layout: 'horizontal' | 'vertical' | 'free'
    theme?: string
    showMinimap?: boolean
    zoomLevel?: number
  }
}

/**
 * 统一的SOP类型
 */
export type SOP = ChecklistSOP | StepByStepSOP | FlowchartSOP

// ============ SOP 触发器 ============

/**
 * SOP 触发器
 */
export interface SOPTrigger {
  id: string
  type: 'time' | 'event' | 'context' | 'manual' | 'api'
  enabled: boolean
  
  // 时间触发
  time?: {
    type: 'fixed' | 'relative' | 'recurring'
    value: string // cron表达式或时间字符串
    timezone?: string
  }
  
  // 事件触发
  event?: {
    eventType: string
    eventFilter?: Record<string, any>
  }
  
  // 情境触发
  context?: {
    contextRuleId: string
    minConfidence?: number
  }
  
  // 条件
  conditions?: Array<{
    field: string
    operator: string
    value: any
  }>
  
  // 触发参数
  parameters?: Record<string, any>
}

// ============ SOP 执行相关 ============

/**
 * SOP 执行实例
 */
export interface SOPExecution {
  id: string
  sopId: string
  sopName: string
  
  // 执行状态
  status: 'preparing' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed'
  
  // 时间信息
  startedAt: Date
  completedAt?: Date
  pausedAt?: Date
  estimatedEndTime?: Date
  
  // 执行进度
  progress: {
    totalSteps: number
    completedSteps: number
    currentStep?: string
    percentComplete: number
  }
  
  // 执行上下文
  context: {
    triggeredBy: 'manual' | 'automatic' | 'scheduled'
    triggerSource?: string
    executor: string
    environment?: Record<string, any>
  }
  
  // 步骤记录
  stepRecords: Array<{
    stepId: string
    status: StepStatus
    startedAt?: Date
    completedAt?: Date
    duration?: number
    notes?: string
    errors?: string[]
  }>
  
  // 中断和恢复
  interruptions: Array<{
    timestamp: Date
    reason: string
    resumedAt?: Date
  }>
  
  // 结果
  result?: {
    success: boolean
    completionRate: number
    skippedSteps: string[]
    failedSteps: string[]
    feedback?: string
    rating?: number
  }
}

/**
 * SOP 执行选项
 */
export interface SOPExecutionOptions {
  // 执行模式
  mode: 'normal' | 'practice' | 'emergency'
  
  // 界面选项
  ui: {
    showInModal?: boolean
    showNotifications?: boolean
    enableVoice?: boolean
    enableHaptic?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }
  
  // 行为选项
  behavior: {
    allowSkip?: boolean
    allowPause?: boolean
    autoAdvance?: boolean
    confirmEachStep?: boolean
    saveProgress?: boolean
  }
  
  // 时间选项
  timing: {
    startDelay?: number // 延迟开始（秒）
    stepTimeout?: number // 步骤超时（秒）
    totalTimeout?: number // 总超时（秒）
  }
  
  // 回调
  callbacks?: {
    onStart?: () => void
    onStepComplete?: (stepId: string) => void
    onComplete?: (result: any) => void
    onError?: (error: any) => void
    onPause?: () => void
    onResume?: () => void
  }
}

// ============ SOP 模板 ============

/**
 * SOP 模板
 */
export interface SOPTemplate {
  id: string
  name: string
  description: string
  category: SOPCategory
  type: SOPType
  
  // 模板内容
  template: Partial<SOP>
  
  // 变量定义
  variables?: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'date' | 'select'
    required?: boolean
    default?: any
    options?: any[]
  }>
  
  // 使用统计
  usage: {
    count: number
    rating: number
    lastUsed?: Date
  }
  
  // 标签
  tags: string[]
  
  // 来源
  source: 'system' | 'user' | 'community'
  author?: string
}