import {
  UserState,
  PhysicalState,
  MentalState,
  EnvironmentalState,
  WorkState,
  SocialState,
  StateTransition,
  StatePattern,
  StateAdjustment,
  EnergyLevel,
  FatigueLevel,
  HydrationLevel,
  ActivityLevel,
  FocusLevel,
  StressLevel,
  NoiseLevel,
  WorkloadLevel
} from '../../types/stateawareness'

export class StateAwarenessService {
  private static instance: StateAwarenessService
  private currentState: UserState
  private stateHistory: StateTransition[] = []
  private patterns: StatePattern[] = []
  private predictor: any
  private optimizer: any
  private subscribers: ((state: UserState) => void)[] = []

  private constructor() {
    this.currentState = this.initializeState()
    this.predictor = this.initializePredictor()
    this.optimizer = this.initializeOptimizer()
    this.startStateMonitoring()
  }

  static getInstance(): StateAwarenessService {
    if (!StateAwarenessService.instance) {
      StateAwarenessService.instance = new StateAwarenessService()
    }
    return StateAwarenessService.instance
  }

  // 初始化状态
  private initializeState(): UserState {
    const now = new Date()
    const hour = now.getHours()
    
    return {
      id: `state-${Date.now()}`,
      timestamp: now,
      physical: this.getDefaultPhysicalState(hour),
      mental: this.getDefaultMentalState(hour),
      environmental: this.getDefaultEnvironmentalState(),
      work: this.getDefaultWorkState(),
      social: this.getDefaultSocialState(),
      overall: {
        wellbeing: 75,
        performance: 70,
        balance: 68,
        trajectory: 'stable' as const,
        needs: [],
        risks: [],
        opportunities: []
      },
      adjustments: []
    }
  }

  // 获取默认物理状态
  private getDefaultPhysicalState(hour: number): PhysicalState {
    const energyByHour: Record<number, EnergyLevel> = {
      6: EnergyLevel.LOW,
      7: EnergyLevel.NORMAL,
      8: EnergyLevel.NORMAL,
      9: EnergyLevel.HIGH,
      10: EnergyLevel.HIGH,
      11: EnergyLevel.HIGH,
      12: EnergyLevel.NORMAL,
      13: EnergyLevel.LOW,
      14: EnergyLevel.NORMAL,
      15: EnergyLevel.NORMAL,
      16: EnergyLevel.NORMAL,
      17: EnergyLevel.LOW,
      18: EnergyLevel.LOW,
      19: EnergyLevel.NORMAL,
      20: EnergyLevel.NORMAL,
      21: EnergyLevel.LOW,
      22: EnergyLevel.LOW,
      23: EnergyLevel.VERY_LOW
    }

    return {
      energyLevel: energyByHour[hour] || EnergyLevel.NORMAL,
      fatigue: hour > 20 ? FatigueLevel.TIRED : hour > 16 ? FatigueLevel.MODERATE : FatigueLevel.FRESH,
      health: 'good' as any,
      activity: ActivityLevel.MODERATE,
      sleep: {
        duration: 7,
        quality: 'good' as const,
        lastSleepTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
        sleepDebt: 0,
        isWellRested: true
      },
      nutrition: {
        lastMealTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        nutritionBalance: 'good' as const,
        bloodSugar: 'stable' as const,
        needsFood: hour === 12 || hour === 18
      },
      hydration: HydrationLevel.NORMAL,
      exercise: {
        lastExerciseTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        weeklyMinutes: 150,
        todayMinutes: 0,
        needsMovement: false
      },
      biorhythm: 'normal' as any
    } as PhysicalState
  }

  // 获取默认心理状态
  private getDefaultMentalState(hour: number): MentalState {
    const focusByHour: Record<number, FocusLevel> = {
      9: FocusLevel.FOCUSED,
      10: FocusLevel.FOCUSED,
      11: FocusLevel.FOCUSED,
      14: FocusLevel.NORMAL,
      15: FocusLevel.FOCUSED,
      16: FocusLevel.NORMAL
    }

    return {
      focus: focusByHour[hour] || FocusLevel.NORMAL,
      mood: 'neutral' as any,
      stress: StressLevel.MODERATE,
      motivation: 'normal' as any,
      creativity: 'normal' as any,
      cognitiveLoad: 'optimal' as any,
      emotionalState: {
        primary: 'calm',
        intensity: 50,
        stability: 'stable' as const
      },
      mindfulness: 'aware' as any
    }
  }

  // 获取默认环境状态
  private getDefaultEnvironmentalState(): EnvironmentalState {
    return {
      location: {
        type: 'office' as const,
        name: '办公室',
        coordinates: { lat: 0, lng: 0 },
        isFamiliar: true,
        comfortLevel: 85
      },
      weather: {
        condition: 'clear',
        temperature: 22,
        humidity: 45,
        pressure: 1013,
        affectsMood: false,
        severity: 'pleasant' as const
      },
      noise: NoiseLevel.MODERATE,
      lighting: 'good' as any,
      temperature: 'comfortable' as any,
      airQuality: 'good' as any,
      distractions: 'minimal' as any,
      resources: {
        devices: true,
        internet: true,
        tools: true,
        materials: true,
        support: true
      }
    }
  }

  // 获取默认工作状态
  private getDefaultWorkState(): WorkState {
    return {
      mode: 'focused' as any,
      productivity: 'normal' as any,
      workload: WorkloadLevel.MANAGEABLE,
      deadline: 'moderate' as any,
      interruptions: 'occasional' as any,
      flow: {
        inFlow: false,
        depth: 'moderate' as const,
        quality: 70
      },
      progress: {
        onTrack: true,
        ahead: false,
        behind: false,
        blocked: false,
        momentum: 'steady' as const
      },
      satisfaction: 'neutral' as any
    } as WorkState
  }

  // 获取默认社交状态
  private getDefaultSocialState(): SocialState {
    return {
      interaction: 'moderate' as any,
      connection: 'meaningful' as any,
      support: 'adequate' as any,
      solitude: 'moderate' as any,
      socialBattery: 70,
      conflicts: 'none' as any
    } as SocialState
  }

  // 初始化预测器
  private initializePredictor(): any {
    return {
      id: 'predictor-1',
      model: 'lstm',
      accuracy: 75,
      features: ['time', 'activity', 'energy', 'workload'],
      predictions: [],
      confidence: 0.75,
      lastUpdate: new Date()
    }
  }

  // 初始化优化器
  private initializeOptimizer(): any {
    return {
      id: 'optimizer-1',
      strategies: ['energy_management', 'focus_optimization', 'break_scheduling'],
      goals: {
        productivity: 80,
        wellbeing: 85,
        balance: 75
      },
      constraints: {
        workHours: { start: 9, end: 18 },
        breakDuration: 15,
        maxConsecutiveWork: 90
      },
      recommendations: []
    }
  }

  // 开始状态监控
  private startStateMonitoring() {
    // 每5分钟更新一次状态
    setInterval(() => {
      this.updateState()
    }, 5 * 60 * 1000)

    // 每小时分析模式
    setInterval(() => {
      this.analyzePatterns()
    }, 60 * 60 * 1000)
  }

  // 更新状态
  private updateState() {
    const newState = this.calculateCurrentState()
    const transition: StateTransition = {
      from: this.currentState,
      to: newState,
      timestamp: new Date(),
      trigger: {
        type: 'automatic' as const,
        source: 'state_awareness_service',
        description: 'scheduled_update'
      },
      duration: 0,
      success: true
    }

    this.stateHistory.push(transition)
    this.currentState = newState
    this.notifySubscribers()
  }

  // 计算当前状态
  private calculateCurrentState(): UserState {
    const now = new Date()
    const hour = now.getHours()
    
    // 基于时间和历史模式计算新状态
    const physical = this.updatePhysicalState(hour)
    const mental = this.updateMentalState(hour)
    const environmental = this.currentState.environmental // 保持不变除非有外部更新
    const work = this.updateWorkState()
    const social = this.currentState.social // 保持不变除非有外部更新

    return {
      id: `state-${Date.now()}`,
      timestamp: now,
      physical,
      mental,
      environmental,
      work,
      social,
      overall: this.calculateOverallState(physical, mental, environmental, work, social) as any,
      adjustments: []
    }
  }

  // 更新物理状态
  private updatePhysicalState(hour: number): PhysicalState {
    const current = this.currentState.physical
    const timeSinceLastUpdate = 5 // 分钟

    return {
      ...current,
      energyLevel: this.calculateEnergy(hour, (current as any).energy || (current as any).energyLevel) as any,
      fatigue: (current as any).fatigue || FatigueLevel.MODERATE,
      health: (current as any).health || 'good' as any,
      activity: (current as any).activity || ActivityLevel.MODERATE
    } as PhysicalState
  }

  // 更新心理状态
  private updateMentalState(hour: number): MentalState {
    const current = this.currentState.mental
    const workload = this.currentState.work.workload

    return {
      ...current,
      focus: this.calculateFocus(hour, workload) as any,
      stress: this.calculateStress(workload, current.stress) as any,
      motivation: 'normal' as any
    } as MentalState
  }

  // 更新工作状态
  private updateWorkState(): WorkState {
    return this.getDefaultWorkState()
  }

  // 计算能量水平
  private calculateEnergy(hour: number, currentEnergy: EnergyLevel): EnergyLevel {
    if (hour >= 9 && hour <= 11) return EnergyLevel.HIGH
    if (hour >= 13 && hour <= 14) return EnergyLevel.LOW
    if (hour >= 15 && hour <= 16) return EnergyLevel.NORMAL
    if (hour >= 21) return EnergyLevel.VERY_LOW
    return currentEnergy
  }

  // 计算专注度
  private calculateFocus(hour: number, workload: WorkloadLevel): FocusLevel {
    if (workload === WorkloadLevel.OVERWHELMING) return FocusLevel.DISTRACTED
    if (hour >= 9 && hour <= 11) return FocusLevel.FOCUSED
    if (hour >= 14 && hour <= 16) return FocusLevel.FOCUSED
    return FocusLevel.NORMAL
  }

  // 计算压力水平
  private calculateStress(workload: WorkloadLevel, currentStress: StressLevel): StressLevel {
    const stressMap: Record<WorkloadLevel, StressLevel> = {
      [WorkloadLevel.MINIMAL]: StressLevel.RELAXED,
      [WorkloadLevel.LIGHT]: StressLevel.LOW,
      [WorkloadLevel.MANAGEABLE]: StressLevel.MODERATE,
      [WorkloadLevel.HEAVY]: StressLevel.HIGH,
      [WorkloadLevel.OVERWHELMING]: StressLevel.EXTREME
    }
    return stressMap[workload] || currentStress
  }

  // 计算效率
  private calculateEfficiency(): number {
    const energy = this.energyToNumber(this.currentState.physical.energyLevel)
    const focus = this.focusToNumber(this.currentState.mental.focus)
    const stress = 100 - this.stressToNumber(this.currentState.mental.stress)
    
    return Math.round((energy + focus + stress) / 3)
  }

  // 计算整体状态
  private calculateOverallState(
    physical: PhysicalState,
    mental: MentalState,
    environmental: EnvironmentalState,
    work: WorkState,
    social: SocialState
  ) {
    const productivity = (this.focusToNumber(mental.focus) + (work as any).efficiency || 70) / 2
    const wellbeing = (this.energyToNumber(physical.energyLevel) + ((mental.mood as any) === 'positive' ? 80 : 60)) / 2
    const effectiveness = (work as any).efficiency || 70
    const balance = (productivity + wellbeing) / 2

    return {
      productivity: Math.round(productivity),
      wellbeing: Math.round(wellbeing),
      effectiveness: Math.round(effectiveness),
      balance: Math.round(balance)
    }
  }

  // 转换函数
  private energyToNumber(energy: EnergyLevel): number {
    const map: Record<EnergyLevel, number> = {
      [EnergyLevel.VERY_LOW]: 20,
      [EnergyLevel.LOW]: 40,
      [EnergyLevel.NORMAL]: 60,
      [EnergyLevel.HIGH]: 80,
      [EnergyLevel.VERY_HIGH]: 100
    }
    return map[energy] || 50
  }

  private focusToNumber(focus: FocusLevel): number {
    const map: Record<FocusLevel, number> = {
      [FocusLevel.SCATTERED]: 0,
      [FocusLevel.DISTRACTED]: 25,
      [FocusLevel.NORMAL]: 50,
      [FocusLevel.FOCUSED]: 75,
      [FocusLevel.HYPER_FOCUSED]: 100
    }
    return map[focus] || 50
  }

  private stressToNumber(stress: StressLevel): number {
    const map: Record<StressLevel, number> = {
      [StressLevel.RELAXED]: 20,
      [StressLevel.LOW]: 40,
      [StressLevel.MODERATE]: 60,
      [StressLevel.HIGH]: 80,
      [StressLevel.EXTREME]: 100
    }
    return map[stress] || 50
  }

  // 计算影响
  private calculateImpact(from: UserState, to: UserState): number {
    const performanceChange = Math.abs(to.overall.performance - from.overall.performance)
    const wellbeingChange = Math.abs(to.overall.wellbeing - from.overall.wellbeing)
    return (performanceChange + wellbeingChange) / 2
  }

  // 分析模式
  private analyzePatterns() {
    // 分析状态历史，识别模式
    if (this.stateHistory.length < 10) return

    const recentStates = this.stateHistory.slice(-20)
    const patterns = this.identifyPatterns(recentStates)
    this.patterns = patterns
  }

  // 识别模式
  private identifyPatterns(transitions: StateTransition[]): StatePattern[] {
    const patterns: StatePattern[] = []
    
    // 示例：识别能量低谷模式
    const lowEnergyTimes = transitions.filter(t => 
      t.to.physical.energyLevel === EnergyLevel.LOW || 
      t.to.physical.energyLevel === EnergyLevel.VERY_LOW
    )
    
    if (lowEnergyTimes.length > 0) {
      patterns.push({
        id: 'pattern-low-energy',
        name: 'Energy Dip Pattern',
        description: '下午能量低谷',
        conditions: [],
        characteristics: {
          typical: {},
          optimal: {}
        },
        optimizations: [],
        performance: {
          occurrences: 1,
          averageDuration: 120,
          successRate: 0.8
        }
      } as StatePattern)
    }

    return patterns
  }

  // 获取时间段
  private getTimeOfDay(hour: number): any {
    if (hour >= 5 && hour < 9) return 'morning'
    if (hour >= 9 && hour < 12) return 'late_morning'
    if (hour >= 12 && hour < 14) return 'noon'
    if (hour >= 14 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 20) return 'evening'
    if (hour >= 20 && hour < 23) return 'night'
    return 'late_night'
  }

  // 获取星期几
  private getDayOfWeek(): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[new Date().getDay()]
  }

  // 通知订阅者
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.currentState))
  }

  // 公共方法

  // 获取当前状态
  getCurrentState(): UserState {
    return this.currentState
  }

  // 获取状态历史
  getStateHistory(limit: number = 100): StateTransition[] {
    return this.stateHistory.slice(-limit)
  }

  // 获取状态预测
  getPredictions(horizon: number = 4): UserState[] {
    const predictions: UserState[] = []
    const baseState = this.currentState
    
    for (let i = 1; i <= horizon; i++) {
      const futureTime = new Date(Date.now() + i * 60 * 60 * 1000)
      const hour = futureTime.getHours()
      
      predictions.push({
        ...baseState,
        id: `prediction-${i}`,
        timestamp: futureTime,
        adjustments: []
      })
    }
    
    return predictions
  }

  // 获取状态调整建议
  getAdjustments(): StateAdjustment[] {
    const adjustments: StateAdjustment[] = []
    const state = this.currentState

    // 能量管理建议
    if (state.physical.energyLevel <= EnergyLevel.LOW) {
      adjustments.push({
        id: 'adj-energy',
        type: 'health' as any,
        category: 'urgent' as any,
        priority: 'high' as const,
        target: 'energy',
        current: state.physical.energyLevel,
        suggested: EnergyLevel.NORMAL,
        reason: '建议休息15分钟，补充能量',
        expectedImpact: {
          wellbeing: 25,
          performance: 15
        },
        implementation: {
          immediate: true,
          duration: 15,
          steps: ['take_break']
        }
      } as StateAdjustment)
    }

    // 专注度管理建议
    if (state.mental.focus <= FocusLevel.DISTRACTED && state.work.workload >= WorkloadLevel.HEAVY) {
      adjustments.push({
        id: 'adj-focus',
        type: 'mindset' as any,
        category: 'performance' as any,
        priority: 'high' as const,
        target: 'focus',
        current: state.mental.focus,
        suggested: FocusLevel.FOCUSED,
        reason: '启动专注模式，关闭干扰源',
        expectedImpact: {
          performance: 30
        },
        implementation: {
          immediate: true,
          duration: 45,
          steps: ['focus_session']
        }
      } as StateAdjustment)
    }

    // 压力管理建议
    if (state.mental.stress >= StressLevel.HIGH) {
      adjustments.push({
        id: 'adj-stress',
        type: 'health' as any,
        category: 'wellbeing' as any,
        priority: 'medium' as const,
        target: 'stress',
        current: state.mental.stress,
        suggested: StressLevel.MODERATE,
        reason: '进行5分钟呼吸练习或冥想',
        expectedImpact: {
          wellbeing: 20
        },
        implementation: {
          immediate: true,
          duration: 5,
          steps: ['relaxation']
        }
      } as StateAdjustment)
    }

    return adjustments
  }

  // 应用状态调整
  applyAdjustment(adjustment: StateAdjustment) {
    const newState = { ...this.currentState }
    
    switch (adjustment.type) {
      case 'physical' as any:
        if (adjustment.target === 'energy') {
          newState.physical.energyLevel = adjustment.suggested as EnergyLevel
        }
        break
      case 'mental' as any:
        if (adjustment.target === 'focus') {
          newState.mental.focus = adjustment.suggested as FocusLevel
        } else if (adjustment.target === 'stress') {
          newState.mental.stress = adjustment.suggested as StressLevel
        }
        break
    }

    const transition: StateTransition = {
      from: this.currentState,
      to: newState,
      timestamp: new Date(),
      trigger: {
        type: 'manual' as const,
        source: 'user_adjustment',
        description: adjustment.reason
      },
      duration: adjustment.implementation.duration || 0,
      success: true
    }

    this.stateHistory.push(transition)
    this.currentState = newState
    this.notifySubscribers()
  }

  // 订阅状态变化
  subscribe(callback: (state: UserState) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  // 获取状态报告
  getStateReport() {
    const state = this.currentState
    const patterns = this.patterns
    const adjustments = this.getAdjustments()
    const predictions = this.getPredictions(4)

    return {
      current: {
        overall: state.overall,
        energy: state.physical.energyLevel,
        focus: state.mental.focus,
        stress: state.mental.stress,
        workload: state.work.workload
      },
      patterns: patterns.map(p => ({
        name: p.name,
        description: p.description,
        performance: p.performance
      })),
      adjustments: adjustments.map(a => ({
        target: a.target,
        reason: a.reason,
        priority: a.priority,
        implementation: a.implementation
      })),
      predictions: predictions.map(p => ({
        time: p.timestamp,
        performance: p.overall.performance,
        wellbeing: p.overall.wellbeing
      }))
    }
  }
}

export const stateAwarenessService = StateAwarenessService.getInstance()