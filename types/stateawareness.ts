/**
 * State Awareness Types
 * 状态感知动态调整系统类型定义
 */

export interface UserState {
  id: string
  timestamp: Date
  
  // 生理状态
  physical: PhysicalState
  
  // 心理状态
  mental: MentalState
  
  // 环境状态
  environmental: EnvironmentalState
  
  // 工作状态
  work: WorkState
  
  // 社交状态
  social: SocialState
  
  // 综合评估
  overall: OverallState
  
  // 动态调整建议
  adjustments: StateAdjustment[]
}

export interface PhysicalState {
  energyLevel: EnergyLevel
  fatigue: FatigueLevel
  health: HealthStatus
  activity: ActivityLevel
  sleep: SleepQuality
  nutrition: NutritionStatus
  hydration: HydrationLevel
  exercise: ExerciseStatus
  biorhythm: BiorhythmPhase
}

export enum EnergyLevel {
  VERY_HIGH = 'very_high',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
  VERY_LOW = 'very_low'
}

export enum FatigueLevel {
  EXHAUSTED = 'exhausted',
  VERY_TIRED = 'very_tired',
  TIRED = 'tired',
  MODERATE = 'moderate',
  FRESH = 'fresh',
  ENERGETIC = 'energetic'
}

export enum HealthStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  SICK = 'sick'
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary',
  LIGHT = 'light',
  MODERATE = 'moderate',
  ACTIVE = 'active',
  VERY_ACTIVE = 'very_active'
}

export interface SleepQuality {
  duration: number // 小时
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  lastSleepTime: Date
  sleepDebt: number // 小时
  isWellRested: boolean
}

export interface NutritionStatus {
  lastMealTime: Date
  nutritionBalance: 'excellent' | 'good' | 'fair' | 'poor'
  bloodSugar: 'stable' | 'high' | 'low'
  needsFood: boolean
}

export enum HydrationLevel {
  WELL_HYDRATED = 'well_hydrated',
  NORMAL = 'normal',
  MILD_DEHYDRATION = 'mild_dehydration',
  DEHYDRATED = 'dehydrated'
}

export interface ExerciseStatus {
  lastExerciseTime: Date
  weeklyMinutes: number
  todayMinutes: number
  needsMovement: boolean
}

export enum BiorhythmPhase {
  PEAK = 'peak',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
  TROUGH = 'trough'
}

export interface MentalState {
  mood: MoodState
  stress: StressLevel
  focus: FocusLevel
  motivation: MotivationLevel
  creativity: CreativityLevel
  cognitiveLoad: CognitiveLoad
  emotionalState: EmotionalState
  mindfulness: MindfulnessLevel
}

export enum MoodState {
  ECSTATIC = 'ecstatic',
  HAPPY = 'happy',
  CONTENT = 'content',
  NEUTRAL = 'neutral',
  MELANCHOLY = 'melancholy',
  SAD = 'sad',
  ANXIOUS = 'anxious',
  ANGRY = 'angry'
}

export enum StressLevel {
  EXTREME = 'extreme',
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low',
  RELAXED = 'relaxed'
}

export enum FocusLevel {
  HYPER_FOCUSED = 'hyper_focused',
  FOCUSED = 'focused',
  NORMAL = 'normal',
  DISTRACTED = 'distracted',
  SCATTERED = 'scattered'
}

export enum MotivationLevel {
  HIGHLY_MOTIVATED = 'highly_motivated',
  MOTIVATED = 'motivated',
  NORMAL = 'normal',
  UNMOTIVATED = 'unmotivated',
  APATHETIC = 'apathetic'
}

export enum CreativityLevel {
  INSPIRED = 'inspired',
  CREATIVE = 'creative',
  NORMAL = 'normal',
  BLOCKED = 'blocked'
}

export enum CognitiveLoad {
  OVERLOADED = 'overloaded',
  HIGH = 'high',
  OPTIMAL = 'optimal',
  LOW = 'low',
  UNDERUTILIZED = 'underutilized'
}

export interface EmotionalState {
  primary: string
  secondary?: string
  intensity: number // 0-100
  stability: 'stable' | 'fluctuating' | 'volatile'
}

export enum MindfulnessLevel {
  VERY_PRESENT = 'very_present',
  PRESENT = 'present',
  AWARE = 'aware',
  DISTRACTED = 'distracted',
  ABSENT = 'absent'
}

export interface EnvironmentalState {
  location: LocationContext
  weather: WeatherContext
  noise: NoiseLevel
  lighting: LightingQuality
  temperature: TemperatureComfort
  airQuality: AirQuality
  distractions: DistractionLevel
  resources: ResourceAvailability
}

export interface LocationContext {
  type: 'home' | 'office' | 'commute' | 'public' | 'outdoor' | 'other'
  name?: string
  coordinates?: { lat: number; lng: number }
  isFamiliar: boolean
  comfortLevel: number // 0-100
}

export interface WeatherContext {
  condition: string
  temperature: number
  humidity: number
  pressure: number
  affectsMood: boolean
  severity: 'pleasant' | 'neutral' | 'unpleasant'
}

export enum NoiseLevel {
  SILENT = 'silent',
  QUIET = 'quiet',
  MODERATE = 'moderate',
  NOISY = 'noisy',
  VERY_NOISY = 'very_noisy'
}

export enum LightingQuality {
  PERFECT = 'perfect',
  GOOD = 'good',
  ADEQUATE = 'adequate',
  POOR = 'poor',
  TERRIBLE = 'terrible'
}

export enum TemperatureComfort {
  TOO_HOT = 'too_hot',
  WARM = 'warm',
  COMFORTABLE = 'comfortable',
  COOL = 'cool',
  TOO_COLD = 'too_cold'
}

export enum AirQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  MODERATE = 'moderate',
  POOR = 'poor',
  HAZARDOUS = 'hazardous'
}

export enum DistractionLevel {
  NONE = 'none',
  MINIMAL = 'minimal',
  MODERATE = 'moderate',
  HIGH = 'high',
  OVERWHELMING = 'overwhelming'
}

export interface ResourceAvailability {
  devices: boolean
  internet: boolean
  tools: boolean
  materials: boolean
  support: boolean
}

export interface WorkState {
  mode: WorkMode
  productivity: ProductivityLevel
  workload: WorkloadLevel
  deadline: DeadlinePressure
  interruptions: InterruptionFrequency
  flow: FlowState
  progress: ProgressStatus
  satisfaction: SatisfactionLevel
}

export enum WorkMode {
  DEEP_WORK = 'deep_work',
  FOCUSED = 'focused',
  COLLABORATIVE = 'collaborative',
  ADMINISTRATIVE = 'administrative',
  CREATIVE = 'creative',
  BREAK = 'break',
  OFF = 'off'
}

export enum ProductivityLevel {
  PEAK = 'peak',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
  MINIMAL = 'minimal'
}

export enum WorkloadLevel {
  OVERWHELMING = 'overwhelming',
  HEAVY = 'heavy',
  MANAGEABLE = 'manageable',
  LIGHT = 'light',
  MINIMAL = 'minimal'
}

export enum DeadlinePressure {
  CRITICAL = 'critical',
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low',
  NONE = 'none'
}

export enum InterruptionFrequency {
  CONSTANT = 'constant',
  FREQUENT = 'frequent',
  OCCASIONAL = 'occasional',
  RARE = 'rare',
  NONE = 'none'
}

export interface FlowState {
  inFlow: boolean
  duration?: number // 分钟
  depth: 'shallow' | 'moderate' | 'deep'
  quality: number // 0-100
}

export interface ProgressStatus {
  onTrack: boolean
  ahead: boolean
  behind: boolean
  blocked: boolean
  momentum: 'accelerating' | 'steady' | 'slowing' | 'stalled'
}

export enum SatisfactionLevel {
  VERY_SATISFIED = 'very_satisfied',
  SATISFIED = 'satisfied',
  NEUTRAL = 'neutral',
  DISSATISFIED = 'dissatisfied',
  VERY_DISSATISFIED = 'very_dissatisfied'
}

export interface SocialState {
  interaction: SocialInteractionLevel
  connection: ConnectionQuality
  support: SupportLevel
  solitude: SolitudeNeed
  socialBattery: number // 0-100
  conflicts: ConflictLevel
}

export enum SocialInteractionLevel {
  OVERWHELMING = 'overwhelming',
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low',
  ISOLATED = 'isolated'
}

export enum ConnectionQuality {
  DEEP = 'deep',
  MEANINGFUL = 'meaningful',
  SURFACE = 'surface',
  STRAINED = 'strained',
  DISCONNECTED = 'disconnected'
}

export enum SupportLevel {
  STRONG = 'strong',
  ADEQUATE = 'adequate',
  LIMITED = 'limited',
  INSUFFICIENT = 'insufficient',
  NONE = 'none'
}

export enum SolitudeNeed {
  DESPERATE = 'desperate',
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low',
  NONE = 'none'
}

export enum ConflictLevel {
  SEVERE = 'severe',
  MODERATE = 'moderate',
  MINOR = 'minor',
  NONE = 'none'
}

export interface OverallState {
  wellbeing: number // 0-100
  performance: number // 0-100
  balance: number // 0-100
  trajectory: 'improving' | 'stable' | 'declining'
  needs: StateNeed[]
  risks: StateRisk[]
  opportunities: StateOpportunity[]
}

export interface StateNeed {
  type: NeedType
  urgency: 'immediate' | 'soon' | 'later'
  description: string
  solution?: string
}

export enum NeedType {
  REST = 'rest',
  FOOD = 'food',
  WATER = 'water',
  EXERCISE = 'exercise',
  SOCIAL = 'social',
  SOLITUDE = 'solitude',
  FOCUS = 'focus',
  BREAK = 'break',
  SUPPORT = 'support',
  MEDICAL = 'medical'
}

export interface StateRisk {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  probability: number // 0-1
  impact: string
  mitigation?: string
}

export interface StateOpportunity {
  type: string
  window: 'now' | 'soon' | 'later'
  benefit: string
  action: string
}

export interface StateAdjustment {
  id: string
  type: AdjustmentType
  category: AdjustmentCategory
  priority: 'critical' | 'high' | 'medium' | 'low'
  
  // 调整内容
  target: string
  current: any
  suggested: any
  reason: string
  
  // 预期效果
  expectedImpact: {
    wellbeing?: number // 变化值
    performance?: number
    balance?: number
    specific?: string
  }
  
  // 实施建议
  implementation: {
    immediate: boolean
    duration?: number // 分钟
    steps?: string[]
    requirements?: string[]
  }
  
  // 用户响应
  userResponse?: {
    accepted: boolean
    timestamp: Date
    feedback?: string
  }
}

export enum AdjustmentType {
  SCHEDULE = 'schedule',
  TASK = 'task',
  BREAK = 'break',
  ENVIRONMENT = 'environment',
  ACTIVITY = 'activity',
  SOCIAL = 'social',
  HEALTH = 'health',
  MINDSET = 'mindset'
}

export enum AdjustmentCategory {
  URGENT = 'urgent',
  PERFORMANCE = 'performance',
  WELLBEING = 'wellbeing',
  PREVENTIVE = 'preventive',
  OPTIMIZATION = 'optimization'
}

// 状态转换
export interface StateTransition {
  from: UserState
  to: UserState
  trigger: TransitionTrigger
  timestamp: Date
  duration: number // 分钟
  success: boolean
}

export interface TransitionTrigger {
  type: 'time' | 'event' | 'manual' | 'automatic'
  source: string
  description: string
}

// 状态模式
export interface StatePattern {
  id: string
  name: string
  description: string
  
  // 模式条件
  conditions: PatternCondition[]
  
  // 状态特征
  characteristics: {
    typical: Partial<UserState>
    optimal: Partial<UserState>
  }
  
  // 优化策略
  optimizations: StateAdjustment[]
  
  // 历史表现
  performance: {
    occurrences: number
    averageDuration: number
    successRate: number
  }
}

export interface PatternCondition {
  field: string
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'between'
  value: any
}

// 状态预测
export interface StatePrediction {
  timestamp: Date
  horizon: number // 预测时长（分钟）
  
  // 预测状态
  predicted: Partial<UserState>
  
  // 置信度
  confidence: number // 0-100
  
  // 影响因素
  factors: PredictionFactor[]
  
  // 干预建议
  interventions?: StateAdjustment[]
}

export interface PredictionFactor {
  name: string
  impact: 'positive' | 'negative' | 'neutral'
  weight: number // 0-1
  description: string
}

// 状态历史
export interface StateHistory {
  userId: string
  states: UserState[]
  transitions: StateTransition[]
  patterns: StatePattern[]
  
  // 统计分析
  analytics: StateAnalytics
}

export interface StateAnalytics {
  // 时间分布
  timeDistribution: {
    byHour: Map<number, AggregatedState>
    byDay: Map<string, AggregatedState>
    byActivity: Map<string, AggregatedState>
  }
  
  // 性能指标
  performance: {
    peakHours: number[]
    lowHours: number[]
    averageProductivity: number
    productivityTrend: 'improving' | 'stable' | 'declining'
  }
  
  // 健康指标
  wellbeing: {
    averageScore: number
    trend: 'improving' | 'stable' | 'declining'
    stressPatterns: Array<{time: string, level: number}>
    recoveryTime: number // 平均恢复时间（分钟）
  }
  
  // 优化建议
  recommendations: {
    scheduleOptimizations: string[]
    habitSuggestions: string[]
    environmentalChanges: string[]
  }
}

export interface AggregatedState {
  count: number
  averageWellbeing: number
  averagePerformance: number
  dominantMood: string
  dominantEnergyLevel: string
}