/**
 * What-If Simulator Service
 * 决策模拟和影响分析服务
 */

import {
  WhatIfScenario,
  SystemState,
  ScenarioChange,
  ChangeType,
  ChangeTarget,
  ChangeImpact,
  ImpactAnalysis,
  DecisionRecommendation,
  ScenarioScore,
  SimulationConfig,
  SimulationResult,
  SimulationMode,
  Conflict,
  Risk,
  Effect,
  SystemMetrics,
  TimeDistribution,
  WhatIfPreset,
  ScenarioComparison,
  ComparisonDimension,
  VisualizationData
} from '../../types/whatif'
import { Event, EventCategory, Priority } from '../../types/event'
import { InboxItem } from '../../types/inbox'
import { useEventStore } from '../stores/event-store'
import InboxService from './InboxService'
import TimeBudgetService from './TimeBudgetService'
import { aiService } from './AIService'

class WhatIfSimulator {
  private static instance: WhatIfSimulator
  private scenarios: Map<string, WhatIfScenario> = new Map()
  private activeScenarioId: string | null = null
  private simulationConfig: SimulationConfig
  
  // 预设场景
  private readonly PRESETS: WhatIfPreset[] = [
    {
      id: 'focus_mode',
      name: '深度专注模式',
      description: '取消所有低优先级会议，专注于核心任务',
      icon: '🎯',
      category: 'productivity',
      changes: [],
      expectedOutcome: '提升50%深度工作时间',
      usageCount: 0,
      successRate: 0.85
    },
    {
      id: 'delegate_all',
      name: '全面委派',
      description: '将可委派的任务全部分配给团队',
      icon: '👥',
      category: 'optimization',
      changes: [],
      expectedOutcome: '释放30%个人时间',
      usageCount: 0,
      successRate: 0.75
    },
    {
      id: 'emergency_mode',
      name: '紧急模式',
      description: '推迟所有非紧急任务，处理危机',
      icon: '🚨',
      category: 'emergency',
      changes: [],
      expectedOutcome: '100%专注于紧急事项',
      usageCount: 0,
      successRate: 0.90
    },
    {
      id: 'work_life_balance',
      name: '工作生活平衡',
      description: '重新分配时间，确保个人生活质量',
      icon: '⚖️',
      category: 'balance',
      changes: [],
      expectedOutcome: '改善40%生活质量指数',
      usageCount: 0,
      successRate: 0.80
    }
  ]

  private constructor() {
    this.simulationConfig = this.getDefaultConfig()
    // What-If Simulator initialized
  }

  static getInstance(): WhatIfSimulator {
    if (!WhatIfSimulator.instance) {
      WhatIfSimulator.instance = new WhatIfSimulator()
    }
    return WhatIfSimulator.instance
  }

  /**
   * 创建新场景
   */
  async createScenario(
    name: string,
    description: string,
    changes?: ScenarioChange[]
  ): Promise<WhatIfScenario> {
    const baselineState = await this.captureCurrentState()
    
    const scenario: WhatIfScenario = {
      id: `scenario_${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      baselineState,
      changes: changes || [],
      simulatedState: baselineState, // 初始与基线相同
      impact: this.createEmptyImpact(),
      recommendations: [],
      score: this.createEmptyScore(),
      status: 'draft'
    }
    
    this.scenarios.set(scenario.id, scenario)
    this.activeScenarioId = scenario.id
    
    return scenario
  }

  /**
   * 添加变更到场景
   */
  addChange(
    scenarioId: string,
    change: ScenarioChange
  ): WhatIfScenario | null {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) return null
    
    scenario.changes.push(change)
    scenario.status = 'draft' // 重置为草稿状态
    
    return scenario
  }

  /**
   * 运行模拟
   */
  async runSimulation(
    scenarioId: string,
    mode: SimulationMode = SimulationMode.STANDARD
  ): Promise<SimulationResult> {
    const startTime = Date.now()
    const logs: any[] = []
    const warnings: string[] = []
    
    try {
      const scenario = this.scenarios.get(scenarioId)
      if (!scenario) {
        throw new Error('Scenario not found')
      }
      
      logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Starting ${mode} simulation for: ${scenario.name}`
      })
      
      // 根据模式选择模拟策略
      let simulatedState: SystemState
      
      switch (mode) {
        case SimulationMode.QUICK:
          simulatedState = await this.quickSimulation(scenario)
          break
        case SimulationMode.DEEP:
          simulatedState = await this.deepSimulation(scenario)
          break
        case SimulationMode.MONTE_CARLO:
          simulatedState = await this.monteCarloSimulation(scenario)
          break
        default:
          simulatedState = await this.standardSimulation(scenario)
      }
      
      // 更新场景
      scenario.simulatedState = simulatedState
      scenario.impact = await this.analyzeImpact(scenario)
      scenario.recommendations = await this.generateRecommendations(scenario)
      scenario.score = this.calculateScore(scenario)
      scenario.status = 'simulated'
      
      // 生成可视化数据
      const visualizations = this.generateVisualizations(scenario)
      
      return {
        scenario,
        success: true,
        logs,
        warnings,
        executionTime: Date.now() - startTime,
        visualizations
      }
    } catch (error) {
      return {
        scenario: this.scenarios.get(scenarioId)!,
        success: false,
        logs,
        warnings,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        executionTime: Date.now() - startTime,
        visualizations: this.createEmptyVisualizations()
      }
    }
  }

  /**
   * 标准模拟
   */
  private async standardSimulation(scenario: WhatIfScenario): Promise<SystemState> {
    let state = this.cloneState(scenario.baselineState)
    
    // 应用每个变更
    for (const change of scenario.changes) {
      state = await this.applyChange(state, change)
      
      // 计算实际影响
      change.actualImpact = this.calculateChangeImpact(
        scenario.baselineState,
        state,
        change
      )
    }
    
    // 检测冲突
    state.conflicts = this.detectConflicts(state)
    
    // 评估风险
    state.risks = this.assessRisks(state)
    
    // 更新指标
    state.metrics = this.calculateMetrics(state)
    state.timeDistribution = this.calculateTimeDistribution(state)
    
    return state
  }

  /**
   * 快速模拟
   */
  private async quickSimulation(scenario: WhatIfScenario): Promise<SystemState> {
    // 简化版本，只做基本检查
    let state = this.cloneState(scenario.baselineState)
    
    for (const change of scenario.changes) {
      state = await this.applyChangeQuick(state, change)
    }
    
    state.conflicts = this.detectConflictsQuick(state)
    state.metrics = this.calculateMetricsQuick(state)
    
    return state
  }

  /**
   * 深度模拟（包含AI建议）
   */
  private async deepSimulation(scenario: WhatIfScenario): Promise<SystemState> {
    // 先执行标准模拟
    let state = await this.standardSimulation(scenario)
    
    // AI优化建议
    const aiSuggestions = await this.getAISuggestions(scenario, state)
    
    // 应用AI建议
    for (const suggestion of aiSuggestions) {
      state = await this.applyChange(state, suggestion)
    }
    
    // 重新评估
    state.conflicts = this.detectConflicts(state)
    state.risks = this.assessRisks(state)
    state.metrics = this.calculateMetrics(state)
    
    return state
  }

  /**
   * 蒙特卡洛模拟
   */
  private async monteCarloSimulation(
    scenario: WhatIfScenario,
    iterations: number = 100
  ): Promise<SystemState> {
    const results: SystemState[] = []
    
    for (let i = 0; i < iterations; i++) {
      // 添加随机扰动
      const perturbedScenario = this.addRandomPerturbation(scenario)
      const state = await this.standardSimulation(perturbedScenario)
      results.push(state)
    }
    
    // 聚合结果
    return this.aggregateMonteCarloResults(results)
  }

  /**
   * 应用变更
   */
  private async applyChange(
    state: SystemState,
    change: ScenarioChange
  ): Promise<SystemState> {
    const newState = this.cloneState(state)
    
    switch (change.type) {
      case ChangeType.ADD:
        if (change.action.add) {
          if ('startTime' in change.action.add.item) {
            newState.events.push(change.action.add.item as Event)
          } else {
            newState.tasks.push(change.action.add.item as InboxItem)
          }
        }
        break
        
      case ChangeType.REMOVE:
        if (change.action.remove) {
          newState.events = newState.events.filter(
            e => e.id !== change.action.remove!.itemId
          )
          newState.tasks = newState.tasks.filter(
            t => t.id !== change.action.remove!.itemId
          )
        }
        break
        
      case ChangeType.MODIFY:
        if (change.action.modify) {
          const event = newState.events.find(e => e.id === change.action.modify!.itemId)
          if (event) {
            (event as any)[change.action.modify.field] = change.action.modify.newValue
          }
          const task = newState.tasks.find(t => t.id === change.action.modify!.itemId)
          if (task) {
            (task as any)[change.action.modify.field] = change.action.modify.newValue
          }
        }
        break
        
      case ChangeType.RESCHEDULE:
        if (change.action.reschedule) {
          const event = newState.events.find(e => e.id === change.action.reschedule!.itemId)
          if (event) {
            const duration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime()
            event.startTime = change.action.reschedule.newTime
            event.endTime = new Date(change.action.reschedule.newTime.getTime() + duration)
          }
        }
        break
        
      // 其他变更类型...
    }
    
    return newState
  }

  /**
   * 快速应用变更
   */
  private async applyChangeQuick(
    state: SystemState,
    change: ScenarioChange
  ): Promise<SystemState> {
    // 简化版本，不做深度检查
    return this.applyChange(state, change)
  }

  /**
   * 检测冲突
   */
  private detectConflicts(state: SystemState): Conflict[] {
    const conflicts: Conflict[] = []
    
    // 时间冲突检测
    for (let i = 0; i < state.events.length; i++) {
      for (let j = i + 1; j < state.events.length; j++) {
        if (this.hasTimeOverlap(state.events[i], state.events[j])) {
          conflicts.push({
            id: `conflict_${i}_${j}`,
            type: 'time',
            severity: this.getConflictSeverity(state.events[i], state.events[j]),
            items: [state.events[i].id, state.events[j].id],
            description: `时间冲突: ${state.events[i].title} 与 ${state.events[j].title}`,
            suggestedResolution: this.suggestConflictResolution(state.events[i], state.events[j])
          })
        }
      }
    }
    
    // 资源冲突检测
    // 优先级冲突检测
    // 依赖冲突检测
    
    return conflicts
  }

  /**
   * 快速冲突检测
   */
  private detectConflictsQuick(state: SystemState): Conflict[] {
    // 只检测明显的时间冲突
    const conflicts: Conflict[] = []
    const events = state.events.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    for (let i = 0; i < events.length - 1; i++) {
      if (new Date(events[i].endTime) > new Date(events[i + 1].startTime)) {
        conflicts.push({
          id: `conflict_${i}`,
          type: 'time',
          severity: 'high',
          items: [events[i].id, events[i + 1].id],
          description: `时间冲突`,
          suggestedResolution: '调整时间'
        })
      }
    }
    
    return conflicts
  }

  /**
   * 评估风险
   */
  private assessRisks(state: SystemState): Risk[] {
    const risks: Risk[] = []
    
    // 截止日期风险
    const overdueTasks = state.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    )
    
    if (overdueTasks.length > 0) {
      risks.push({
        id: 'deadline_risk',
        category: 'deadline',
        probability: 0.8,
        impact: 8,
        score: 6.4,
        description: `${overdueTasks.length}项任务已逾期`,
        mitigation: '立即处理逾期任务或重新协商截止日期'
      })
    }
    
    // 过载风险
    if (state.metrics.totalScheduledHours > this.simulationConfig.constraints.maxDailyHours) {
      risks.push({
        id: 'overload_risk',
        category: 'overload',
        probability: 0.9,
        impact: 7,
        score: 6.3,
        description: '日程安排超过最大工作时间',
        mitigation: '减少任务或延长完成时间'
      })
    }
    
    // 健康风险
    if (state.metrics.stressLevel > 7) {
      risks.push({
        id: 'health_risk',
        category: 'health',
        probability: 0.7,
        impact: 9,
        score: 6.3,
        description: '压力水平过高，可能影响健康',
        mitigation: '增加休息时间，考虑委派部分任务'
      })
    }
    
    return risks
  }

  /**
   * 计算指标
   */
  private calculateMetrics(state: SystemState): SystemMetrics {
    const events = state.events
    const tasks = state.tasks
    
    // 时间指标
    const totalScheduledHours = events.reduce((sum, event) => {
      const duration = (new Date(event.endTime).getTime() - 
                       new Date(event.startTime).getTime()) / (1000 * 60 * 60)
      return sum + duration
    }, 0)
    
    const totalFreeHours = 24 - totalScheduledHours
    const utilizationRate = (totalScheduledHours / 24) * 100
    
    // 任务指标
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const pendingTasks = tasks.filter(t => t.status === 'pending').length
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    // 效率指标
    const productivityScore = this.calculateProductivityScore(state)
    const focusTimeHours = this.calculateFocusTime(events)
    const fragmentationIndex = this.calculateFragmentation(events)
    
    // 平衡指标
    const workLifeBalance = this.calculateWorkLifeBalance(events)
    const stressLevel = this.calculateStressLevel(state)
    const energyBalance = this.calculateEnergyBalance(state)
    
    return {
      totalScheduledHours,
      totalFreeHours,
      utilizationRate,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      productivityScore,
      focusTimeHours,
      fragmentationIndex,
      workLifeBalance,
      stressLevel,
      energyBalance
    }
  }

  /**
   * 快速计算指标
   */
  private calculateMetricsQuick(state: SystemState): SystemMetrics {
    // 简化计算
    const totalTasks = state.tasks.length
    const completedTasks = state.tasks.filter(t => t.status === 'completed').length
    
    return {
      totalScheduledHours: state.events.length * 1.5,
      totalFreeHours: 24 - state.events.length * 1.5,
      utilizationRate: (state.events.length * 1.5 / 24) * 100,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks: 0,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      productivityScore: 50,
      focusTimeHours: 4,
      fragmentationIndex: 0.5,
      workLifeBalance: 50,
      stressLevel: 5,
      energyBalance: 50
    }
  }

  /**
   * 计算时间分布
   */
  private calculateTimeDistribution(state: SystemState): TimeDistribution {
    const byCategory = new Map<EventCategory, number>()
    const byPriority = new Map<Priority, number>()
    const byTimeSlot = new Map<string, number>()
    const byWeekday = new Map<string, number>()
    
    state.events.forEach(event => {
      const duration = (new Date(event.endTime).getTime() - 
                       new Date(event.startTime).getTime()) / (1000 * 60 * 60)
      
      // 按类别
      const currentCategory = byCategory.get(event.category) || 0
      byCategory.set(event.category, currentCategory + duration)
      
      // 按优先级
      const currentPriority = byPriority.get(event.priority) || 0
      byPriority.set(event.priority, currentPriority + duration)
      
      // 按时段
      const hour = new Date(event.startTime).getHours()
      const slot = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
      const currentSlot = byTimeSlot.get(slot) || 0
      byTimeSlot.set(slot, currentSlot + duration)
      
      // 按星期
      const weekday = new Date(event.startTime).toLocaleDateString('en-US', { weekday: 'long' })
      const currentWeekday = byWeekday.get(weekday) || 0
      byWeekday.set(weekday, currentWeekday + duration)
    })
    
    return {
      byCategory,
      byPriority,
      byTimeSlot,
      byWeekday
    }
  }

  /**
   * 分析影响
   */
  private async analyzeImpact(scenario: WhatIfScenario): Promise<ImpactAnalysis> {
    const baseline = scenario.baselineState
    const simulated = scenario.simulatedState
    
    // 时间影响
    const timeImpact = {
      savedHours: Math.max(0, baseline.metrics.totalScheduledHours - simulated.metrics.totalScheduledHours),
      addedHours: Math.max(0, simulated.metrics.totalScheduledHours - baseline.metrics.totalScheduledHours),
      netChange: simulated.metrics.totalScheduledHours - baseline.metrics.totalScheduledHours,
      efficiencyGain: ((simulated.metrics.productivityScore - baseline.metrics.productivityScore) / 
                       baseline.metrics.productivityScore) * 100
    }
    
    // 冲突影响
    const conflictImpact = {
      resolvedConflicts: Math.max(0, baseline.conflicts.length - simulated.conflicts.length),
      newConflicts: Math.max(0, simulated.conflicts.length - baseline.conflicts.length),
      netChange: simulated.conflicts.length - baseline.conflicts.length
    }
    
    // 生产力影响
    const productivityImpact = {
      oldScore: baseline.metrics.productivityScore,
      newScore: simulated.metrics.productivityScore,
      change: simulated.metrics.productivityScore - baseline.metrics.productivityScore,
      changePercent: ((simulated.metrics.productivityScore - baseline.metrics.productivityScore) / 
                      baseline.metrics.productivityScore) * 100
    }
    
    // 压力影响
    const stressImpact = {
      oldLevel: baseline.metrics.stressLevel,
      newLevel: simulated.metrics.stressLevel,
      change: simulated.metrics.stressLevel - baseline.metrics.stressLevel,
      recommendation: simulated.metrics.stressLevel > 7 ? '需要减压' : 
                     simulated.metrics.stressLevel > 5 ? '压力适中' : '压力较低'
    }
    
    // 目标影响
    const goalImpact = {
      progressChange: simulated.metrics.completionRate - baseline.metrics.completionRate,
      deadlineRisk: simulated.metrics.overdueTasks > baseline.metrics.overdueTasks,
      achievability: 100 - (simulated.metrics.overdueTasks / simulated.metrics.totalTasks) * 100
    }
    
    // 总体评估
    const score = this.calculateImpactScore(timeImpact, conflictImpact, productivityImpact, stressImpact)
    const overallAssessment = {
      recommendation: score > 80 ? 'strongly_recommend' as const :
                     score > 60 ? 'recommend' as const :
                     score > 40 ? 'neutral' as const :
                     score > 20 ? 'not_recommend' as const : 'strongly_against' as const,
      confidence: Math.min(95, 50 + score / 2),
      reasoning: this.generateImpactReasoning(score, timeImpact, productivityImpact)
    }
    
    return {
      timeImpact,
      conflictImpact,
      productivityImpact,
      stressImpact,
      goalImpact,
      overallAssessment
    }
  }

  /**
   * 生成建议
   */
  private async generateRecommendations(
    scenario: WhatIfScenario
  ): Promise<DecisionRecommendation[]> {
    const recommendations: DecisionRecommendation[] = []
    const impact = scenario.impact
    
    // 基于冲突的建议
    if (scenario.simulatedState.conflicts.length > 0) {
      recommendations.push({
        id: 'resolve_conflicts',
        priority: 'high',
        type: 'warning',
        title: '解决时间冲突',
        description: `发现${scenario.simulatedState.conflicts.length}个时间冲突需要解决`,
        expectedBenefit: '避免日程混乱，提高执行效率',
        difficulty: 'moderate',
        timeRequired: 30
      })
    }
    
    // 基于压力的建议
    if (scenario.simulatedState.metrics.stressLevel > 7) {
      recommendations.push({
        id: 'reduce_stress',
        priority: 'high',
        type: 'warning',
        title: '降低压力水平',
        description: '当前压力水平过高，建议减少工作量或增加休息',
        expectedBenefit: '保护身心健康，维持长期生产力',
        difficulty: 'easy',
        timeRequired: 60
      })
    }
    
    // 基于效率的建议
    if (impact.productivityImpact.changePercent < -10) {
      recommendations.push({
        id: 'improve_productivity',
        priority: 'medium',
        type: 'suggestion',
        title: '提升生产效率',
        description: '模拟显示生产力下降，考虑优化任务安排',
        expectedBenefit: '提高20-30%的工作效率',
        difficulty: 'moderate',
        timeRequired: 45
      })
    }
    
    // 基于目标的建议
    if (impact.goalImpact.deadlineRisk) {
      recommendations.push({
        id: 'deadline_management',
        priority: 'high',
        type: 'action',
        title: '管理截止日期风险',
        description: '多项任务面临截止日期风险，需要立即调整',
        expectedBenefit: '确保按时完成关键任务',
        difficulty: 'hard',
        timeRequired: 90
      })
    }
    
    // AI增强建议
    if (this.simulationConfig.enableAISuggestions) {
      const aiRecommendations = await this.getAIRecommendations(scenario)
      recommendations.push(...aiRecommendations)
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * 计算场景评分
   */
  private calculateScore(scenario: WhatIfScenario): ScenarioScore {
    const baseline = scenario.baselineState.metrics
    const simulated = scenario.simulatedState.metrics
    
    // 效率得分
    const efficiency = Math.min(100, Math.max(0,
      50 + (simulated.productivityScore - baseline.productivityScore)
    ))
    
    // 平衡得分
    const balance = Math.min(100, Math.max(0,
      50 + (simulated.workLifeBalance - baseline.workLifeBalance)
    ))
    
    // 可行性得分
    const feasibility = Math.min(100, Math.max(0,
      100 - scenario.simulatedState.conflicts.length * 10 - 
      scenario.simulatedState.risks.length * 5
    ))
    
    // 可持续性得分
    const sustainability = Math.min(100, Math.max(0,
      100 - simulated.stressLevel * 10
    ))
    
    // 目标对齐得分
    const goalAlignment = Math.min(100, Math.max(0,
      simulated.completionRate
    ))
    
    // 综合得分
    const overall = (
      efficiency * 0.3 +
      balance * 0.2 +
      feasibility * 0.2 +
      sustainability * 0.15 +
      goalAlignment * 0.15
    )
    
    // 改进幅度
    const improvement = overall - 50 // 假设基线为50分
    
    // 评级
    const grade = overall >= 90 ? 'A' :
                 overall >= 80 ? 'B' :
                 overall >= 70 ? 'C' :
                 overall >= 60 ? 'D' : 'F'
    
    return {
      efficiency,
      balance,
      feasibility,
      sustainability,
      goalAlignment,
      overall,
      improvement,
      grade
    }
  }

  /**
   * 生成可视化数据
   */
  private generateVisualizations(scenario: WhatIfScenario): VisualizationData {
    // 时间线数据
    const timeline = {
      before: this.extractTimelineData(scenario.baselineState),
      after: this.extractTimelineData(scenario.simulatedState)
    }
    
    // 指标对比
    const metrics = {
      labels: ['生产力', '平衡度', '压力', '完成率', '效率'],
      before: [
        scenario.baselineState.metrics.productivityScore,
        scenario.baselineState.metrics.workLifeBalance,
        100 - scenario.baselineState.metrics.stressLevel * 10,
        scenario.baselineState.metrics.completionRate,
        scenario.baselineState.metrics.utilizationRate
      ],
      after: [
        scenario.simulatedState.metrics.productivityScore,
        scenario.simulatedState.metrics.workLifeBalance,
        100 - scenario.simulatedState.metrics.stressLevel * 10,
        scenario.simulatedState.metrics.completionRate,
        scenario.simulatedState.metrics.utilizationRate
      ]
    }
    
    // 分布图
    const distribution = {
      categories: Array.from(scenario.baselineState.timeDistribution.byCategory.keys()),
      before: Array.from(scenario.baselineState.timeDistribution.byCategory.values()),
      after: Array.from(scenario.simulatedState.timeDistribution.byCategory.values())
    }
    
    // 冲突热图
    const conflictHeatmap = this.generateConflictHeatmap(scenario.simulatedState)
    
    return {
      timeline,
      metrics,
      distribution,
      conflictHeatmap
    }
  }

  /**
   * 比较多个场景
   */
  async compareScenarios(
    scenarioIds: string[]
  ): Promise<ScenarioComparison> {
    const scenarios = scenarioIds
      .map(id => this.scenarios.get(id))
      .filter(s => s !== undefined) as WhatIfScenario[]
    
    if (scenarios.length < 2) {
      throw new Error('Need at least 2 scenarios to compare')
    }
    
    // 定义比较维度
    const dimensions: ComparisonDimension[] = [
      {
        name: '效率',
        weight: 0.3,
        scores: new Map(),
        winner: ''
      },
      {
        name: '平衡',
        weight: 0.2,
        scores: new Map(),
        winner: ''
      },
      {
        name: '可行性',
        weight: 0.2,
        scores: new Map(),
        winner: ''
      },
      {
        name: '压力管理',
        weight: 0.15,
        scores: new Map(),
        winner: ''
      },
      {
        name: '目标达成',
        weight: 0.15,
        scores: new Map(),
        winner: ''
      }
    ]
    
    // 计算各维度得分
    scenarios.forEach(scenario => {
      dimensions[0].scores.set(scenario.id, scenario.score.efficiency)
      dimensions[1].scores.set(scenario.id, scenario.score.balance)
      dimensions[2].scores.set(scenario.id, scenario.score.feasibility)
      dimensions[3].scores.set(scenario.id, 100 - scenario.simulatedState.metrics.stressLevel * 10)
      dimensions[4].scores.set(scenario.id, scenario.score.goalAlignment)
    })
    
    // 确定各维度获胜者
    dimensions.forEach(dim => {
      let maxScore = 0
      let winner = ''
      dim.scores.forEach((score, id) => {
        if (score > maxScore) {
          maxScore = score
          winner = id
        }
      })
      dim.winner = winner
    })
    
    // 计算总体获胜者
    const totalScores = new Map<string, number>()
    scenarios.forEach(scenario => {
      let total = 0
      dimensions.forEach(dim => {
        total += (dim.scores.get(scenario.id) || 0) * dim.weight
      })
      totalScores.set(scenario.id, total)
    })
    
    let winner = scenarios[0]
    let maxTotal = 0
    totalScores.forEach((score, id) => {
      if (score > maxTotal) {
        maxTotal = score
        winner = scenarios.find(s => s.id === id)!
      }
    })
    
    // 生成决策矩阵
    const decisionMatrix = this.generateDecisionMatrix(scenarios, dimensions)
    
    // 敏感性分析
    const sensitivityAnalysis = this.performSensitivityAnalysis(scenarios, dimensions)
    
    return {
      scenarios,
      dimensions,
      winner,
      decisionMatrix,
      sensitivityAnalysis
    }
  }

  /**
   * 应用场景到实际
   */
  async applyScenario(scenarioId: string): Promise<boolean> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario || scenario.status !== 'simulated') {
      return false
    }
    
    try {
      // 应用所有变更
      for (const change of scenario.changes) {
        await this.applyChangeToReal(change)
      }
      
      scenario.status = 'applied'
      scenario.appliedAt = new Date()
      
      return true
    } catch (error) {
      // Failed to apply scenario
      return false
    }
  }

  /**
   * 获取预设场景
   */
  getPresets(): WhatIfPreset[] {
    return this.PRESETS
  }

  /**
   * 应用预设
   */
  async applyPreset(presetId: string): Promise<WhatIfScenario> {
    const preset = this.PRESETS.find(p => p.id === presetId)
    if (!preset) {
      throw new Error('Preset not found')
    }
    
    // 根据预设生成变更
    const changes = await this.generatePresetChanges(preset)
    
    // 创建场景
    const scenario = await this.createScenario(
      preset.name,
      preset.description,
      changes
    )
    
    // 更新使用统计
    preset.usageCount++
    
    return scenario
  }

  // === 辅助方法 ===

  /**
   * 捕获当前状态
   */
  private async captureCurrentState(): Promise<SystemState> {
    const events = useEventStore.getState().events
    const tasks: any[] = [] // TODO: 需要InboxService提供获取所有任务的方法
    const timeBudgets = await TimeBudgetService.getAllBudgets()
    
    const state: SystemState = {
      timestamp: new Date(),
      events,
      tasks,
      timeBudgets,
      metrics: this.calculateMetrics({ 
        timestamp: new Date(), 
        events, 
        tasks, 
        timeBudgets, 
        metrics: {} as any,
        timeDistribution: {} as any,
        conflicts: [],
        risks: []
      }),
      timeDistribution: this.calculateTimeDistribution({ 
        timestamp: new Date(), 
        events, 
        tasks, 
        timeBudgets,
        metrics: {} as any,
        timeDistribution: {} as any,
        conflicts: [],
        risks: []
      }),
      conflicts: [],
      risks: []
    }
    
    state.conflicts = this.detectConflicts(state)
    state.risks = this.assessRisks(state)
    
    return state
  }

  /**
   * 克隆状态
   */
  private cloneState(state: SystemState): SystemState {
    return JSON.parse(JSON.stringify(state))
  }

  /**
   * 检查时间重叠
   */
  private hasTimeOverlap(event1: Event, event2: Event): boolean {
    const start1 = new Date(event1.startTime).getTime()
    const end1 = new Date(event1.endTime).getTime()
    const start2 = new Date(event2.startTime).getTime()
    const end2 = new Date(event2.endTime).getTime()
    
    return (start1 < end2 && end1 > start2)
  }

  /**
   * 获取冲突严重程度
   */
  private getConflictSeverity(event1: Event, event2: Event): 'low' | 'medium' | 'high' | 'critical' {
    if (event1.priority === Priority.URGENT || event2.priority === Priority.URGENT) {
      return 'critical'
    }
    if (event1.priority === Priority.HIGH || event2.priority === Priority.HIGH) {
      return 'high'
    }
    if (event1.priority === Priority.MEDIUM || event2.priority === Priority.MEDIUM) {
      return 'medium'
    }
    return 'low'
  }

  /**
   * 建议冲突解决方案
   */
  private suggestConflictResolution(event1: Event, event2: Event): string {
    if (event1.priority > event2.priority) {
      return `推迟"${event2.title}"或寻找其他时间段`
    } else if (event2.priority > event1.priority) {
      return `推迟"${event1.title}"或寻找其他时间段`
    } else {
      return '考虑合并会议或选择一个推迟'
    }
  }

  /**
   * 计算生产力得分
   */
  private calculateProductivityScore(state: SystemState): number {
    const completionRate = state.metrics?.completionRate || 0
    const focusTime = this.calculateFocusTime(state.events)
    const efficiency = 100 - (state.conflicts.length * 5)
    
    return Math.min(100, (completionRate * 0.4 + focusTime * 10 + efficiency * 0.3))
  }

  /**
   * 计算专注时间
   */
  private calculateFocusTime(events: Event[]): number {
    return events
      .filter(e => e.category === EventCategory.WORK || e.category === EventCategory.LEARNING)
      .reduce((sum, e) => {
        const duration = (new Date(e.endTime).getTime() - 
                         new Date(e.startTime).getTime()) / (1000 * 60 * 60)
        return sum + (duration >= 1.5 ? duration : 0) // 只计算超过1.5小时的深度工作
      }, 0)
  }

  /**
   * 计算碎片化指数
   */
  private calculateFragmentation(events: Event[]): number {
    if (events.length === 0) return 0
    
    const gaps: number[] = []
    const sorted = events.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = (new Date(sorted[i + 1].startTime).getTime() - 
                   new Date(sorted[i].endTime).getTime()) / (1000 * 60)
      if (gap > 0 && gap < 30) { // 小于30分钟的间隙算作碎片
        gaps.push(gap)
      }
    }
    
    return gaps.length / events.length
  }

  /**
   * 计算工作生活平衡
   */
  private calculateWorkLifeBalance(events: Event[]): number {
    const workHours = events
      .filter(e => e.category === EventCategory.WORK || e.category === EventCategory.MEETING)
      .reduce((sum, e) => {
        const duration = (new Date(e.endTime).getTime() - 
                         new Date(e.startTime).getTime()) / (1000 * 60 * 60)
        return sum + duration
      }, 0)
    
    const personalHours = events
      .filter(e => e.category === EventCategory.PERSONAL || e.category === EventCategory.HEALTH)
      .reduce((sum, e) => {
        const duration = (new Date(e.endTime).getTime() - 
                         new Date(e.startTime).getTime()) / (1000 * 60 * 60)
        return sum + duration
      }, 0)
    
    const ratio = personalHours / (workHours + personalHours + 0.01)
    return Math.min(100, ratio * 200) // 理想比例是50%
  }

  /**
   * 计算压力水平
   */
  private calculateStressLevel(state: SystemState): number {
    let stress = 0
    
    // 基于任务数量
    stress += Math.min(3, state.tasks.length / 10)
    
    // 基于冲突
    stress += Math.min(2, state.conflicts.length * 0.5)
    
    // 基于逾期任务
    stress += Math.min(2, state.metrics?.overdueTasks || 0)
    
    // 基于工作时长
    if (state.metrics?.totalScheduledHours > 10) stress += 2
    
    // 基于碎片化
    stress += state.metrics?.fragmentationIndex || 0
    
    return Math.min(10, stress)
  }

  /**
   * 计算能量平衡
   */
  private calculateEnergyBalance(state: SystemState): number {
    // 简化计算：基于休息时间和工作强度
    const restHours = 24 - (state.metrics?.totalScheduledHours || 0)
    const intensity = state.metrics?.stressLevel || 5
    
    return Math.max(0, Math.min(100, (restHours * 10) - (intensity * 5)))
  }

  /**
   * 计算变更影响
   */
  private calculateChangeImpact(
    baseline: SystemState,
    current: SystemState,
    change: ScenarioChange
  ): ChangeImpact {
    const directEffects: Effect[] = []
    const cascadeEffects: Effect[] = []
    
    // 分析直接影响
    if (change.type === ChangeType.REMOVE) {
      directEffects.push({
        type: 'positive',
        category: 'time',
        description: '释放时间',
        magnitude: 5,
        affected: [change.action.remove?.itemId || '']
      })
    }
    
    // 分析级联影响
    const conflictChange = current.conflicts.length - baseline.conflicts.length
    if (conflictChange !== 0) {
      cascadeEffects.push({
        type: conflictChange > 0 ? 'negative' : 'positive',
        category: 'conflict',
        description: conflictChange > 0 ? '增加冲突' : '减少冲突',
        magnitude: Math.abs(conflictChange) * 2,
        affected: current.conflicts.map(c => c.id)
      })
    }
    
    // 计算影响范围
    const totalEffects = directEffects.length + cascadeEffects.length
    const scope = totalEffects > 5 ? 'critical' :
                 totalEffects > 3 ? 'significant' :
                 totalEffects > 1 ? 'moderate' : 'minimal'
    
    // 计算影响得分
    const impactScore = directEffects.reduce((sum, e) => sum + e.magnitude, 0) +
                       cascadeEffects.reduce((sum, e) => sum + e.magnitude, 0)
    
    // 评估风险等级
    const negativeEffects = [...directEffects, ...cascadeEffects].filter(e => e.type === 'negative')
    const riskLevel = negativeEffects.length > 3 ? 'critical' :
                      negativeEffects.length > 2 ? 'high' :
                      negativeEffects.length > 1 ? 'medium' : 'low'
    
    return {
      directEffects,
      cascadeEffects,
      scope: scope as 'minimal' | 'moderate' | 'significant' | 'critical',
      impactScore,
      riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical'
    }
  }

  /**
   * 获取AI建议
   */
  private async getAISuggestions(
    scenario: WhatIfScenario,
    state: SystemState
  ): Promise<ScenarioChange[]> {
    // 这里应该调用AI服务获取建议
    // 暂时返回模拟数据
    return []
  }

  /**
   * 获取AI推荐
   */
  private async getAIRecommendations(
    scenario: WhatIfScenario
  ): Promise<DecisionRecommendation[]> {
    // 这里应该调用AI服务
    // 暂时返回模拟数据
    return []
  }

  /**
   * 添加随机扰动（用于蒙特卡洛）
   */
  private addRandomPerturbation(scenario: WhatIfScenario): WhatIfScenario {
    const perturbed = this.cloneState(scenario) as any
    
    // 随机调整任务持续时间 ±20%
    perturbed.baselineState.events.forEach((event: Event) => {
      const duration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime()
      const perturbation = (Math.random() - 0.5) * 0.4 * duration
      event.endTime = new Date(new Date(event.endTime).getTime() + perturbation)
    })
    
    return perturbed
  }

  /**
   * 聚合蒙特卡洛结果
   */
  private aggregateMonteCarloResults(results: SystemState[]): SystemState {
    // 取平均值或中位数
    const aggregated = this.cloneState(results[0])
    
    // 聚合指标
    const metrics = results.map(r => r.metrics)
    aggregated.metrics = {
      totalScheduledHours: this.average(metrics.map(m => m.totalScheduledHours)),
      totalFreeHours: this.average(metrics.map(m => m.totalFreeHours)),
      utilizationRate: this.average(metrics.map(m => m.utilizationRate)),
      totalTasks: Math.round(this.average(metrics.map(m => m.totalTasks))),
      completedTasks: Math.round(this.average(metrics.map(m => m.completedTasks))),
      pendingTasks: Math.round(this.average(metrics.map(m => m.pendingTasks))),
      overdueTasks: Math.round(this.average(metrics.map(m => m.overdueTasks))),
      completionRate: this.average(metrics.map(m => m.completionRate)),
      productivityScore: this.average(metrics.map(m => m.productivityScore)),
      focusTimeHours: this.average(metrics.map(m => m.focusTimeHours)),
      fragmentationIndex: this.average(metrics.map(m => m.fragmentationIndex)),
      workLifeBalance: this.average(metrics.map(m => m.workLifeBalance)),
      stressLevel: this.average(metrics.map(m => m.stressLevel)),
      energyBalance: this.average(metrics.map(m => m.energyBalance))
    }
    
    return aggregated
  }

  /**
   * 计算平均值
   */
  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }

  /**
   * 计算影响得分
   */
  private calculateImpactScore(
    timeImpact: any,
    conflictImpact: any,
    productivityImpact: any,
    stressImpact: any
  ): number {
    let score = 50 // 基础分
    
    // 时间影响
    if (timeImpact.savedHours > 0) score += timeImpact.savedHours * 5
    if (timeImpact.addedHours > 0) score -= timeImpact.addedHours * 3
    
    // 冲突影响
    score += conflictImpact.resolvedConflicts * 10
    score -= conflictImpact.newConflicts * 15
    
    // 生产力影响
    score += productivityImpact.changePercent
    
    // 压力影响
    score -= stressImpact.change * 5
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * 生成影响理由
   */
  private generateImpactReasoning(
    score: number,
    timeImpact: any,
    productivityImpact: any
  ): string {
    if (score > 80) {
      return `显著改善：节省${timeImpact.savedHours.toFixed(1)}小时，生产力提升${productivityImpact.changePercent.toFixed(1)}%`
    } else if (score > 60) {
      return `中度改善：时间利用优化，生产力有所提升`
    } else if (score > 40) {
      return `轻微改善：部分指标有所改进，但整体影响有限`
    } else {
      return `需要重新考虑：当前方案可能带来负面影响`
    }
  }

  /**
   * 提取时间线数据
   */
  private extractTimelineData(state: SystemState): any {
    return {
      events: state.events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.startTime,
        end: e.endTime,
        category: e.category,
        priority: e.priority,
        isConflict: state.conflicts.some(c => c.items.includes(e.id))
      })),
      freeSlots: this.calculateFreeSlots(state.events)
    }
  }

  /**
   * 计算空闲时段
   */
  private calculateFreeSlots(events: Event[]): any[] {
    const slots: any[] = []
    const sorted = events.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    const dayStart = new Date()
    dayStart.setHours(8, 0, 0, 0)
    const dayEnd = new Date()
    dayEnd.setHours(22, 0, 0, 0)
    
    // 检查第一个事件前
    if (sorted.length > 0 && new Date(sorted[0].startTime) > dayStart) {
      slots.push({
        start: dayStart,
        end: new Date(sorted[0].startTime),
        duration: (new Date(sorted[0].startTime).getTime() - dayStart.getTime()) / (1000 * 60)
      })
    }
    
    // 检查事件之间
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = new Date(sorted[i + 1].startTime).getTime() - 
                  new Date(sorted[i].endTime).getTime()
      if (gap > 30 * 60 * 1000) { // 超过30分钟
        slots.push({
          start: new Date(sorted[i].endTime),
          end: new Date(sorted[i + 1].startTime),
          duration: gap / (1000 * 60)
        })
      }
    }
    
    // 检查最后一个事件后
    if (sorted.length > 0 && new Date(sorted[sorted.length - 1].endTime) < dayEnd) {
      slots.push({
        start: new Date(sorted[sorted.length - 1].endTime),
        end: dayEnd,
        duration: (dayEnd.getTime() - new Date(sorted[sorted.length - 1].endTime).getTime()) / (1000 * 60)
      })
    }
    
    return slots
  }

  /**
   * 生成冲突热图
   */
  private generateConflictHeatmap(state: SystemState): any {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const intensity: number[][] = Array(7).fill(null).map(() => Array(24).fill(0))
    
    // 计算每个时段的冲突强度
    state.conflicts.forEach(conflict => {
      conflict.items.forEach(itemId => {
        const event = state.events.find(e => e.id === itemId)
        if (event) {
          const day = new Date(event.startTime).getDay()
          const hour = new Date(event.startTime).getHours()
          intensity[day][hour]++
        }
      })
    })
    
    return {
      days,
      hours,
      intensity
    }
  }

  /**
   * 生成决策矩阵
   */
  private generateDecisionMatrix(
    scenarios: WhatIfScenario[],
    dimensions: ComparisonDimension[]
  ): any {
    const criteria = dimensions.map(d => d.name)
    const alternatives = scenarios.map(s => s.name)
    const weights = dimensions.map(d => d.weight)
    
    const scores: number[][] = []
    scenarios.forEach(scenario => {
      const row: number[] = []
      dimensions.forEach(dim => {
        row.push(dim.scores.get(scenario.id) || 0)
      })
      scores.push(row)
    })
    
    const weightedScores = scores.map(row => 
      row.reduce((sum, score, i) => sum + score * weights[i], 0)
    )
    
    const ranking = alternatives
      .map((name, i) => ({ name, score: weightedScores[i] }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.name)
    
    return {
      criteria,
      alternatives,
      scores,
      weights,
      weightedScores,
      ranking
    }
  }

  /**
   * 执行敏感性分析
   */
  private performSensitivityAnalysis(
    scenarios: WhatIfScenario[],
    dimensions: ComparisonDimension[]
  ): any {
    // 简化的敏感性分析
    return {
      criticalFactors: [
        {
          factor: '任务完成率',
          impact: 8,
          threshold: 70,
          recommendation: '保持70%以上的完成率'
        },
        {
          factor: '压力水平',
          impact: 7,
          threshold: 6,
          recommendation: '压力不应超过6级'
        }
      ],
      breakEvenPoints: [
        {
          variable: '工作时长',
          currentValue: 8,
          breakEvenValue: 10,
          margin: 2
        }
      ],
      riskTolerance: {
        acceptable: true,
        maxRisk: 7,
        currentRisk: 5,
        buffer: 2
      }
    }
  }

  /**
   * 生成预设变更
   */
  private async generatePresetChanges(preset: WhatIfPreset): Promise<ScenarioChange[]> {
    const changes: ScenarioChange[] = []
    
    switch (preset.id) {
      case 'focus_mode':
        // 取消低优先级会议
        const events = useEventStore.getState().events
        events
          .filter(e => e.category === EventCategory.MEETING && e.priority === Priority.LOW)
          .forEach(event => {
            changes.push({
              id: `change_${Date.now()}_${event.id}`,
              type: ChangeType.REMOVE,
              target: ChangeTarget.EVENT,
              action: {
                remove: {
                  itemId: event.id,
                  reason: '深度专注模式：取消低优先级会议'
                }
              },
              params: {},
              description: `取消会议: ${event.title}`,
              expectedImpact: '释放时间用于深度工作'
            })
          })
        break
        
      case 'delegate_all':
        // 委派可委派任务
        const tasks: any[] = [] // TODO: 需要InboxService提供获取所有任务的方法
        tasks
          .filter(t => t.canDelegate && t.status !== 'completed')
          .forEach(task => {
            changes.push({
              id: `change_${Date.now()}_${task.id}`,
              type: ChangeType.DELEGATE,
              target: ChangeTarget.TASK,
              action: {
                delegate: {
                  itemId: task.id,
                  delegateTo: 'team',
                  notes: '委派给团队处理'
                }
              },
              params: {},
              description: `委派任务: ${task.title}`,
              expectedImpact: '释放个人时间'
            })
          })
        break
        
      // 其他预设...
    }
    
    return changes
  }

  /**
   * 应用变更到实际系统
   */
  private async applyChangeToReal(change: ScenarioChange): Promise<void> {
    switch (change.type) {
      case ChangeType.REMOVE:
        if (change.action.remove) {
          useEventStore.getState().deleteEvent(change.action.remove.itemId)
        }
        break
        
      case ChangeType.MODIFY:
        if (change.action.modify) {
          useEventStore.getState().updateEvent(
            change.action.modify.itemId,
            { [change.action.modify.field]: change.action.modify.newValue }
          )
        }
        break
        
      // 其他变更类型...
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): SimulationConfig {
    return {
      timeHorizon: 7,
      includeWeekends: false,
      workingHours: {
        start: 9,
        end: 18
      },
      constraints: {
        maxDailyHours: 10,
        minBreakTime: 30,
        maxConsecutiveHours: 4,
        requiredSleepHours: 7
      },
      optimizationGoals: {
        maximizeProductivity: true,
        minimizeStress: true,
        balanceWorkLife: true,
        meetDeadlines: true
      },
      enableAISuggestions: true,
      suggestionLevel: 'moderate'
    }
  }

  /**
   * 创建空的影响分析
   */
  private createEmptyImpact(): ImpactAnalysis {
    return {
      timeImpact: {
        savedHours: 0,
        addedHours: 0,
        netChange: 0,
        efficiencyGain: 0
      },
      conflictImpact: {
        resolvedConflicts: 0,
        newConflicts: 0,
        netChange: 0
      },
      productivityImpact: {
        oldScore: 0,
        newScore: 0,
        change: 0,
        changePercent: 0
      },
      stressImpact: {
        oldLevel: 0,
        newLevel: 0,
        change: 0,
        recommendation: ''
      },
      goalImpact: {
        progressChange: 0,
        deadlineRisk: false,
        achievability: 0
      },
      overallAssessment: {
        recommendation: 'neutral',
        confidence: 0,
        reasoning: ''
      }
    }
  }

  /**
   * 创建空的评分
   */
  private createEmptyScore(): ScenarioScore {
    return {
      efficiency: 0,
      balance: 0,
      feasibility: 0,
      sustainability: 0,
      goalAlignment: 0,
      overall: 0,
      improvement: 0,
      grade: 'F'
    }
  }

  /**
   * 创建空的可视化数据
   */
  private createEmptyVisualizations(): VisualizationData {
    return {
      timeline: {
        before: { events: [], freeSlots: [] },
        after: { events: [], freeSlots: [] }
      },
      metrics: {
        labels: [],
        before: [],
        after: []
      },
      distribution: {
        categories: [],
        before: [],
        after: []
      },
      conflictHeatmap: {
        days: [],
        hours: [],
        intensity: []
      }
    }
  }

  /**
   * 获取活动场景
   */
  getActiveScenario(): WhatIfScenario | null {
    return this.activeScenarioId ? this.scenarios.get(this.activeScenarioId) || null : null
  }

  /**
   * 获取所有场景
   */
  getAllScenarios(): WhatIfScenario[] {
    return Array.from(this.scenarios.values())
  }

  /**
   * 删除场景
   */
  deleteScenario(scenarioId: string): boolean {
    if (this.activeScenarioId === scenarioId) {
      this.activeScenarioId = null
    }
    return this.scenarios.delete(scenarioId)
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.scenarios.clear()
    this.activeScenarioId = null
  }
}

// 导出单例
export const whatIfSimulator = WhatIfSimulator.getInstance()
export default WhatIfSimulator