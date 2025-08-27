/**
 * What-If Simulator Types
 * 决策模拟器类型定义
 */

import { Event, EventCategory, Priority } from './event'
import { InboxItem } from './inbox'
import { TimeBudget, BudgetCategory } from './timebudget'

export interface WhatIfScenario {
  id: string
  name: string
  description: string
  createdAt: Date
  
  // 基础场景
  baselineState: SystemState
  
  // 模拟变更
  changes: ScenarioChange[]
  
  // 模拟结果
  simulatedState: SystemState
  
  // 影响分析
  impact: ImpactAnalysis
  
  // 决策建议
  recommendations: DecisionRecommendation[]
  
  // 评分
  score: ScenarioScore
  
  // 状态
  status: 'draft' | 'simulated' | 'applied' | 'archived'
  appliedAt?: Date
}

export interface SystemState {
  timestamp: Date
  events: Event[]
  tasks: InboxItem[]
  timeBudgets: TimeBudget[]
  
  // 统计指标
  metrics: SystemMetrics
  
  // 时间分布
  timeDistribution: TimeDistribution
  
  // 冲突列表
  conflicts: Conflict[]
  
  // 风险评估
  risks: Risk[]
}

export interface SystemMetrics {
  // 时间指标
  totalScheduledHours: number
  totalFreeHours: number
  utilizationRate: number
  
  // 任务指标
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  completionRate: number
  
  // 效率指标
  productivityScore: number
  focusTimeHours: number
  fragmentationIndex: number
  
  // 平衡指标
  workLifeBalance: number
  stressLevel: number
  energyBalance: number
}

export interface TimeDistribution {
  byCategory: Map<EventCategory, number>
  byPriority: Map<Priority, number>
  byTimeSlot: Map<string, number> // morning/afternoon/evening/night
  byWeekday: Map<string, number>
}

export interface ScenarioChange {
  id: string
  type: ChangeType
  target: ChangeTarget
  action: ChangeAction
  params: any
  
  // 变更描述
  description: string
  
  // 预期影响
  expectedImpact: string
  
  // 实际影响（模拟后）
  actualImpact?: ChangeImpact
}

export enum ChangeType {
  ADD = 'add',
  REMOVE = 'remove',
  MODIFY = 'modify',
  RESCHEDULE = 'reschedule',
  DELEGATE = 'delegate',
  SPLIT = 'split',
  MERGE = 'merge',
  AUTOMATE = 'automate'
}

export enum ChangeTarget {
  EVENT = 'event',
  TASK = 'task',
  TIME_BUDGET = 'time_budget',
  PRIORITY = 'priority',
  DURATION = 'duration',
  DEADLINE = 'deadline'
}

export interface ChangeAction {
  // 添加事件/任务
  add?: {
    item: Event | InboxItem
    suggestedTime?: Date
    duration?: number
  }
  
  // 删除事件/任务
  remove?: {
    itemId: string
    reason: string
  }
  
  // 修改属性
  modify?: {
    itemId: string
    field: string
    oldValue: any
    newValue: any
  }
  
  // 重新安排
  reschedule?: {
    itemId: string
    oldTime: Date
    newTime: Date
    affectedItems: string[]
  }
  
  // 委派任务
  delegate?: {
    itemId: string
    delegateTo: string
    notes: string
  }
  
  // 拆分任务
  split?: {
    itemId: string
    parts: Array<{
      title: string
      duration: number
      deadline?: Date
    }>
  }
  
  // 合并任务
  merge?: {
    itemIds: string[]
    mergedTitle: string
    mergedDuration: number
  }
  
  // 自动化
  automate?: {
    itemId: string
    automationType: 'recurring' | 'template' | 'ai'
    config: any
  }
}

export interface ChangeImpact {
  // 直接影响
  directEffects: Effect[]
  
  // 级联影响
  cascadeEffects: Effect[]
  
  // 影响范围
  scope: 'minimal' | 'moderate' | 'significant' | 'critical'
  
  // 影响评分
  impactScore: number
  
  // 风险等级
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface Effect {
  type: 'positive' | 'negative' | 'neutral'
  category: string
  description: string
  magnitude: number // 1-10
  affected: string[] // 受影响的实体ID
}

export interface ImpactAnalysis {
  // 时间影响
  timeImpact: {
    savedHours: number
    addedHours: number
    netChange: number
    efficiencyGain: number
  }
  
  // 冲突影响
  conflictImpact: {
    resolvedConflicts: number
    newConflicts: number
    netChange: number
  }
  
  // 生产力影响
  productivityImpact: {
    oldScore: number
    newScore: number
    change: number
    changePercent: number
  }
  
  // 压力影响
  stressImpact: {
    oldLevel: number
    newLevel: number
    change: number
    recommendation: string
  }
  
  // 目标影响
  goalImpact: {
    progressChange: number
    deadlineRisk: boolean
    achievability: number
  }
  
  // 总体评估
  overallAssessment: {
    recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommend' | 'strongly_against'
    confidence: number
    reasoning: string
  }
}

export interface Conflict {
  id: string
  type: 'time' | 'resource' | 'priority' | 'dependency'
  severity: 'low' | 'medium' | 'high' | 'critical'
  items: string[] // 涉及的事件/任务ID
  description: string
  suggestedResolution?: string
}

export interface Risk {
  id: string
  category: 'deadline' | 'overload' | 'quality' | 'health' | 'relationship'
  probability: number // 0-1
  impact: number // 1-10
  score: number // probability * impact
  description: string
  mitigation?: string
}

export interface DecisionRecommendation {
  id: string
  priority: 'high' | 'medium' | 'low'
  type: 'action' | 'warning' | 'suggestion'
  title: string
  description: string
  
  // 建议的行动
  suggestedAction?: ScenarioChange
  
  // 预期收益
  expectedBenefit: string
  
  // 实施难度
  difficulty: 'easy' | 'moderate' | 'hard'
  
  // 时间要求
  timeRequired: number // 分钟
  
  // 依赖条件
  dependencies?: string[]
}

export interface ScenarioScore {
  // 各维度得分 (0-100)
  efficiency: number
  balance: number
  feasibility: number
  sustainability: number
  goalAlignment: number
  
  // 综合得分
  overall: number
  
  // 对比基线的改进
  improvement: number
  
  // 评级
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface SimulationConfig {
  // 模拟参数
  timeHorizon: number // 天数
  includeWeekends: boolean
  workingHours: {
    start: number
    end: number
  }
  
  // 约束条件
  constraints: {
    maxDailyHours: number
    minBreakTime: number
    maxConsecutiveHours: number
    requiredSleepHours: number
  }
  
  // 优化目标
  optimizationGoals: {
    maximizeProductivity: boolean
    minimizeStress: boolean
    balanceWorkLife: boolean
    meetDeadlines: boolean
  }
  
  // AI建议
  enableAISuggestions: boolean
  suggestionLevel: 'conservative' | 'moderate' | 'aggressive'
}

export interface ScenarioComparison {
  scenarios: WhatIfScenario[]
  
  // 对比维度
  dimensions: ComparisonDimension[]
  
  // 获胜场景
  winner: WhatIfScenario
  
  // 决策矩阵
  decisionMatrix: DecisionMatrix
  
  // 敏感性分析
  sensitivityAnalysis: SensitivityAnalysis
}

export interface ComparisonDimension {
  name: string
  weight: number // 权重
  scores: Map<string, number> // scenarioId -> score
  winner: string // scenarioId
}

export interface DecisionMatrix {
  criteria: string[]
  alternatives: string[]
  scores: number[][]
  weights: number[]
  weightedScores: number[]
  ranking: string[]
}

export interface SensitivityAnalysis {
  criticalFactors: Array<{
    factor: string
    impact: number
    threshold: number
    recommendation: string
  }>
  
  breakEvenPoints: Array<{
    variable: string
    currentValue: number
    breakEvenValue: number
    margin: number
  }>
  
  riskTolerance: {
    acceptable: boolean
    maxRisk: number
    currentRisk: number
    buffer: number
  }
}

export interface SimulationResult {
  scenario: WhatIfScenario
  success: boolean
  
  // 模拟日志
  logs: SimulationLog[]
  
  // 警告信息
  warnings: string[]
  
  // 错误信息
  errors?: string[]
  
  // 执行时间
  executionTime: number
  
  // 可视化数据
  visualizations: VisualizationData
}

export interface SimulationLog {
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  message: string
  data?: any
}

export interface VisualizationData {
  // 时间线对比
  timeline: {
    before: TimelineData
    after: TimelineData
  }
  
  // 指标对比
  metrics: {
    labels: string[]
    before: number[]
    after: number[]
  }
  
  // 分布图
  distribution: {
    categories: string[]
    before: number[]
    after: number[]
  }
  
  // 冲突热图
  conflictHeatmap: {
    days: string[]
    hours: number[]
    intensity: number[][]
  }
}

export interface TimelineData {
  events: Array<{
    id: string
    title: string
    start: Date
    end: Date
    category: string
    priority: string
    isConflict: boolean
  }>
  
  freeSlots: Array<{
    start: Date
    end: Date
    duration: number
  }>
}

export enum SimulationMode {
  QUICK = 'quick',      // 快速模拟，基本检查
  STANDARD = 'standard', // 标准模拟，完整分析
  DEEP = 'deep',        // 深度模拟，包含AI建议
  MONTE_CARLO = 'monte_carlo' // 蒙特卡洛模拟，多次随机
}

export interface WhatIfPreset {
  id: string
  name: string
  description: string
  icon: string
  category: 'productivity' | 'balance' | 'emergency' | 'optimization'
  
  // 预设的变更
  changes: ScenarioChange[]
  
  // 适用条件
  conditions?: {
    minTasks?: number
    maxTasks?: number
    timeRange?: string
    userType?: string
  }
  
  // 预期效果
  expectedOutcome: string
  
  // 使用次数
  usageCount: number
  
  // 成功率
  successRate: number
}