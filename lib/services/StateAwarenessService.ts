import {
  UserState,
  StateType,
  PhysicalState,
  MentalState,
  EnvironmentalState,
  WorkState,
  SocialState,
  StateTransition,
  StatePattern,
  StateAdjustment,
  StatePredictor,
  StateOptimizer,
  TimeOfDay,
  EnergyLevel,
  FocusLevel,
  MoodType,
  StressLevel,
  EnvironmentType,
  NoiseLevel,
  WorkloadLevel,
  SocialMode
} from '../../types/stateawareness'

export class StateAwarenessService {
  private static instance: StateAwarenessService
  private currentState: UserState
  private stateHistory: StateTransition[] = []
  private patterns: StatePattern[] = []
  private predictor: StatePredictor
  private optimizer: StateOptimizer
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
        productivity: 70,
        wellbeing: 75,
        effectiveness: 72,
        balance: 68
      },
      context: {
        timeOfDay: this.getTimeOfDay(hour),
        dayOfWeek: this.getDayOfWeek(),
        location: 'office',
        currentActivity: 'working',
        upcomingEvents: [],
        recentActivities: []
      }
    }
  }

  // 获取默认物理状态
  private getDefaultPhysicalState(hour: number): PhysicalState {
    const energyByHour: Record<number, EnergyLevel> = {
      6: EnergyLevel.LOW,
      7: EnergyLevel.MEDIUM,
      8: EnergyLevel.MEDIUM,
      9: EnergyLevel.HIGH,
      10: EnergyLevel.HIGH,
      11: EnergyLevel.HIGH,
      12: EnergyLevel.MEDIUM,
      13: EnergyLevel.LOW,
      14: EnergyLevel.MEDIUM,
      15: EnergyLevel.MEDIUM,
      16: EnergyLevel.MEDIUM,
      17: EnergyLevel.LOW,
      18: EnergyLevel.LOW,
      19: EnergyLevel.MEDIUM,
      20: EnergyLevel.MEDIUM,
      21: EnergyLevel.LOW,
      22: EnergyLevel.LOW,
      23: EnergyLevel.VERY_LOW
    }

    return {
      energy: energyByHour[hour] || EnergyLevel.MEDIUM,
      fatigue: hour > 20 ? 70 : hour > 16 ? 50 : 30,
      hunger: hour === 12 || hour === 18 ? 80 : 40,
      hydration: 70,
      exercise: 30,
      sleep: {
        quality: 75,
        duration: 7,
        lastSleepTime: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      health: {
        overall: 85,
        symptoms: [],
        medications: [],
        conditions: []
      }
    }
  }

  // 获取默认心理状态
  private getDefaultMentalState(hour: number): MentalState {
    const focusByHour: Record<number, FocusLevel> = {
      9: FocusLevel.DEEP,
      10: FocusLevel.DEEP,
      11: FocusLevel.HIGH,
      14: FocusLevel.MEDIUM,
      15: FocusLevel.HIGH,
      16: FocusLevel.MEDIUM
    }

    return {
      focus: focusByHour[hour] || FocusLevel.MEDIUM,
      mood: MoodType.NEUTRAL,
      stress: StressLevel.MEDIUM,
      motivation: 70,
      creativity: 65,
      clarity: 75,
      emotions: {
        primary: 'calm',
        intensity: 50,
        stability: 75
      },
      cognitive: {
        processing: 80,
        memory: 75,
        problemSolving: 70,
        decisionMaking: 75
      }
    }
  }

  // 获取默认环境状态
  private getDefaultEnvironmentalState(): EnvironmentalState {
    return {
      location: {
        type: EnvironmentType.OFFICE,
        name: '办公室',
        coordinates: { lat: 0, lng: 0 }
      },
      conditions: {
        temperature: 22,
        humidity: 45,
        lighting: 'bright',
        airQuality: 'good',
        noise: NoiseLevel.MODERATE
      },
      devices: {
        computer: true,
        phone: true,
        tablet: false,
        wearable: false
      },
      connectivity: {
        internet: true,
        speed: 'fast',
        vpn: false
      },
      distractions: {
        level: 40,
        sources: ['colleagues', 'notifications'],
        mitigation: ['headphones', 'focus_mode']
      }
    }
  }

  // 获取默认工作状态
  private getDefaultWorkState(): WorkState {
    return {
      workload: WorkloadLevel.MEDIUM,
      progress: 65,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      efficiency: 70,
      quality: 75,
      tasks: {
        pending: 5,
        inProgress: 2,
        completed: 8,
        overdue: 1
      },
      interruptions: {
        count: 3,
        averageDuration: 5,
        impact: 25
      },
      flow: {
        current: false,
        duration: 0,
        depth: 0,
        lastFlowState: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    }
  }

  // 获取默认社交状态
  private getDefaultSocialState(): SocialState {
    return {
      mode: SocialMode.COLLABORATIVE,
      availability: 'busy',
      interactions: {
        recent: 3,
        quality: 70,
        energy: 60
      },
      relationships: {
        activeConnections: 5,
        pendingMessages: 2,
        scheduledMeetings: 1
      },
      communication: {
        preference: 'async',
        responsiveness: 70,
        channels: ['email', 'slack']
      }
    }
  }

  // 初始化预测器
  private initializePredictor(): StatePredictor {
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
  private initializeOptimizer(): StateOptimizer {
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
      id: `transition-${Date.now()}`,
      from: this.currentState,
      to: newState,
      timestamp: new Date(),
      trigger: 'automatic',
      reason: 'scheduled_update',
      impact: this.calculateImpact(this.currentState, newState)
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
      overall: this.calculateOverallState(physical, mental, environmental, work, social),
      context: {
        timeOfDay: this.getTimeOfDay(hour),
        dayOfWeek: this.getDayOfWeek(),
        location: this.currentState.context.location,
        currentActivity: this.currentState.context.currentActivity,
        upcomingEvents: [],
        recentActivities: []
      }
    }
  }

  // 更新物理状态
  private updatePhysicalState(hour: number): PhysicalState {
    const current = this.currentState.physical
    const timeSinceLastUpdate = 5 // 分钟

    return {
      ...current,
      energy: this.calculateEnergy(hour, current.energy),
      fatigue: Math.min(100, current.fatigue + timeSinceLastUpdate * 0.5),
      hunger: Math.min(100, current.hunger + timeSinceLastUpdate * 0.3),
      hydration: Math.max(0, current.hydration - timeSinceLastUpdate * 0.2)
    }
  }

  // 更新心理状态
  private updateMentalState(hour: number): MentalState {
    const current = this.currentState.mental
    const workload = this.currentState.work.workload

    return {
      ...current,
      focus: this.calculateFocus(hour, workload),
      stress: this.calculateStress(workload, current.stress),
      motivation: Math.max(0, Math.min(100, current.motivation - 1))
    }
  }

  // 更新工作状态
  private updateWorkState(): WorkState {
    const current = this.currentState.work
    
    return {
      ...current,
      efficiency: this.calculateEfficiency(),
      interruptions: {
        ...current.interruptions,
        count: current.interruptions.count
      }
    }
  }

  // 计算能量水平
  private calculateEnergy(hour: number, currentEnergy: EnergyLevel): EnergyLevel {
    if (hour >= 9 && hour <= 11) return EnergyLevel.HIGH
    if (hour >= 13 && hour <= 14) return EnergyLevel.LOW
    if (hour >= 15 && hour <= 16) return EnergyLevel.MEDIUM
    if (hour >= 21) return EnergyLevel.VERY_LOW
    return currentEnergy
  }

  // 计算专注度
  private calculateFocus(hour: number, workload: WorkloadLevel): FocusLevel {
    if (workload === WorkloadLevel.VERY_HIGH) return FocusLevel.LOW
    if (hour >= 9 && hour <= 11) return FocusLevel.DEEP
    if (hour >= 14 && hour <= 16) return FocusLevel.HIGH
    return FocusLevel.MEDIUM
  }

  // 计算压力水平
  private calculateStress(workload: WorkloadLevel, currentStress: StressLevel): StressLevel {
    const stressMap: Record<WorkloadLevel, StressLevel> = {
      [WorkloadLevel.VERY_LOW]: StressLevel.LOW,
      [WorkloadLevel.LOW]: StressLevel.LOW,
      [WorkloadLevel.MEDIUM]: StressLevel.MEDIUM,
      [WorkloadLevel.HIGH]: StressLevel.HIGH,
      [WorkloadLevel.VERY_HIGH]: StressLevel.VERY_HIGH
    }
    return stressMap[workload] || currentStress
  }

  // 计算效率
  private calculateEfficiency(): number {
    const energy = this.energyToNumber(this.currentState.physical.energy)
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
    const productivity = (this.focusToNumber(mental.focus) + work.efficiency) / 2
    const wellbeing = (this.energyToNumber(physical.energy) + mental.mood === MoodType.POSITIVE ? 80 : 60) / 2
    const effectiveness = work.efficiency
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
      [EnergyLevel.MEDIUM]: 60,
      [EnergyLevel.HIGH]: 80,
      [EnergyLevel.VERY_HIGH]: 100
    }
    return map[energy] || 50
  }

  private focusToNumber(focus: FocusLevel): number {
    const map: Record<FocusLevel, number> = {
      [FocusLevel.NONE]: 0,
      [FocusLevel.LOW]: 25,
      [FocusLevel.MEDIUM]: 50,
      [FocusLevel.HIGH]: 75,
      [FocusLevel.DEEP]: 100
    }
    return map[focus] || 50
  }

  private stressToNumber(stress: StressLevel): number {
    const map: Record<StressLevel, number> = {
      [StressLevel.VERY_LOW]: 20,
      [StressLevel.LOW]: 40,
      [StressLevel.MEDIUM]: 60,
      [StressLevel.HIGH]: 80,
      [StressLevel.VERY_HIGH]: 100
    }
    return map[stress] || 50
  }

  // 计算影响
  private calculateImpact(from: UserState, to: UserState): number {
    const productivityChange = Math.abs(to.overall.productivity - from.overall.productivity)
    const wellbeingChange = Math.abs(to.overall.wellbeing - from.overall.wellbeing)
    return (productivityChange + wellbeingChange) / 2
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
      t.to.physical.energy === EnergyLevel.LOW || 
      t.to.physical.energy === EnergyLevel.VERY_LOW
    )
    
    if (lowEnergyTimes.length > 0) {
      patterns.push({
        id: 'pattern-low-energy',
        type: 'energy_dip',
        frequency: 'daily',
        triggers: ['afternoon', 'post_lunch'],
        impact: 30,
        description: '下午能量低谷',
        recommendations: ['short_break', 'light_snack', 'walk']
      })
    }

    return patterns
  }

  // 获取时间段
  private getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 9) return TimeOfDay.MORNING
    if (hour >= 9 && hour < 12) return TimeOfDay.LATE_MORNING
    if (hour >= 12 && hour < 14) return TimeOfDay.NOON
    if (hour >= 14 && hour < 17) return TimeOfDay.AFTERNOON
    if (hour >= 17 && hour < 20) return TimeOfDay.EVENING
    if (hour >= 20 && hour < 23) return TimeOfDay.NIGHT
    return TimeOfDay.LATE_NIGHT
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
        context: {
          ...baseState.context,
          timeOfDay: this.getTimeOfDay(hour)
        }
      })
    }
    
    return predictions
  }

  // 获取状态调整建议
  getAdjustments(): StateAdjustment[] {
    const adjustments: StateAdjustment[] = []
    const state = this.currentState

    // 能量管理建议
    if (state.physical.energy <= EnergyLevel.LOW) {
      adjustments.push({
        id: 'adj-energy',
        type: StateType.PHYSICAL,
        target: 'energy',
        currentValue: state.physical.energy,
        targetValue: EnergyLevel.MEDIUM,
        action: 'take_break',
        description: '建议休息15分钟，补充能量',
        priority: 'high',
        estimatedImpact: 25,
        duration: 15
      })
    }

    // 专注度管理建议
    if (state.mental.focus <= FocusLevel.LOW && state.work.workload >= WorkloadLevel.HIGH) {
      adjustments.push({
        id: 'adj-focus',
        type: StateType.MENTAL,
        target: 'focus',
        currentValue: state.mental.focus,
        targetValue: FocusLevel.HIGH,
        action: 'focus_session',
        description: '启动专注模式，关闭干扰源',
        priority: 'high',
        estimatedImpact: 30,
        duration: 45
      })
    }

    // 压力管理建议
    if (state.mental.stress >= StressLevel.HIGH) {
      adjustments.push({
        id: 'adj-stress',
        type: StateType.MENTAL,
        target: 'stress',
        currentValue: state.mental.stress,
        targetValue: StressLevel.MEDIUM,
        action: 'relaxation',
        description: '进行5分钟呼吸练习或冥想',
        priority: 'medium',
        estimatedImpact: 20,
        duration: 5
      })
    }

    return adjustments
  }

  // 应用状态调整
  applyAdjustment(adjustment: StateAdjustment) {
    const newState = { ...this.currentState }
    
    switch (adjustment.type) {
      case StateType.PHYSICAL:
        if (adjustment.target === 'energy') {
          newState.physical.energy = adjustment.targetValue as EnergyLevel
        }
        break
      case StateType.MENTAL:
        if (adjustment.target === 'focus') {
          newState.mental.focus = adjustment.targetValue as FocusLevel
        } else if (adjustment.target === 'stress') {
          newState.mental.stress = adjustment.targetValue as StressLevel
        }
        break
    }

    const transition: StateTransition = {
      id: `transition-${Date.now()}`,
      from: this.currentState,
      to: newState,
      timestamp: new Date(),
      trigger: 'manual',
      reason: adjustment.description,
      impact: adjustment.estimatedImpact
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
        energy: state.physical.energy,
        focus: state.mental.focus,
        stress: state.mental.stress,
        workload: state.work.workload
      },
      patterns: patterns.map(p => ({
        type: p.type,
        description: p.description,
        recommendations: p.recommendations
      })),
      adjustments: adjustments.map(a => ({
        action: a.action,
        description: a.description,
        priority: a.priority,
        duration: a.duration
      })),
      predictions: predictions.map(p => ({
        time: p.timestamp,
        productivity: p.overall.productivity,
        wellbeing: p.overall.wellbeing
      }))
    }
  }
}

export const stateAwarenessService = StateAwarenessService.getInstance()