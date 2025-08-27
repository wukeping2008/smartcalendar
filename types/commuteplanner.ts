/**
 * Commute & Wait Time Planner Types
 * 通勤和等待时间规划器类型定义
 */

export interface CommuteSession {
  id: string
  type: SessionType
  startTime: Date
  endTime?: Date
  duration: number // 分钟
  
  // 位置信息
  location: LocationInfo
  
  // 交通信息
  transport: TransportInfo
  
  // 活动规划
  activities: PlannedActivity[]
  
  // 环境条件
  conditions: EnvironmentConditions
  
  // 生产力评估
  productivity: ProductivityAssessment
  
  // 用户反馈
  feedback?: SessionFeedback
}

export enum SessionType {
  COMMUTE = 'commute',
  WAITING = 'waiting',
  TRANSIT = 'transit',
  BREAK = 'break',
  IDLE = 'idle'
}

export interface LocationInfo {
  start?: {
    name: string
    coordinates?: { lat: number; lng: number }
  }
  end?: {
    name: string
    coordinates?: { lat: number; lng: number }
  }
  current?: {
    name: string
    coordinates?: { lat: number; lng: number }
  }
  type: LocationType
}

export enum LocationType {
  HOME_TO_WORK = 'home_to_work',
  WORK_TO_HOME = 'work_to_home',
  BUSINESS_TRAVEL = 'business_travel',
  PERSONAL_TRAVEL = 'personal_travel',
  WAITING_ROOM = 'waiting_room',
  PUBLIC_SPACE = 'public_space',
  TRANSIT_STATION = 'transit_station',
  OTHER = 'other'
}

export interface TransportInfo {
  mode: TransportMode
  vehicle?: string
  route?: string
  isDriver: boolean
  hasInternet: boolean
  hasTable: boolean
  hasPower: boolean
  noiseLevel: NoiseLevel
  crowdedness: CrowdLevel
  stability: StabilityLevel // 稳定性（用于书写/打字）
}

export enum TransportMode {
  WALKING = 'walking',
  DRIVING = 'driving',
  BUS = 'bus',
  SUBWAY = 'subway',
  TRAIN = 'train',
  PLANE = 'plane',
  TAXI = 'taxi',
  BIKE = 'bike',
  WAITING = 'waiting',
  OTHER = 'other'
}

export enum NoiseLevel {
  QUIET = 'quiet',
  MODERATE = 'moderate',
  NOISY = 'noisy',
  VERY_NOISY = 'very_noisy'
}

export enum CrowdLevel {
  EMPTY = 'empty',
  SPARSE = 'sparse',
  MODERATE = 'moderate',
  CROWDED = 'crowded',
  PACKED = 'packed'
}

export enum StabilityLevel {
  VERY_STABLE = 'very_stable',
  STABLE = 'stable',
  SLIGHTLY_MOVING = 'slightly_moving',
  BUMPY = 'bumpy',
  VERY_BUMPY = 'very_bumpy'
}

export interface PlannedActivity {
  id: string
  type: ActivityType
  category: ActivityCategory
  title: string
  description?: string
  
  // 时间安排
  plannedDuration: number // 分钟
  actualDuration?: number
  startTime?: Date
  endTime?: Date
  
  // 适合度评估
  suitability: SuitabilityScore
  
  // 所需资源
  requirements: ActivityRequirements
  
  // 完成状态
  status: ActivityStatus
  progress?: number // 0-100
  
  // 产出
  output?: ActivityOutput
}

export enum ActivityType {
  READING = 'reading',
  LISTENING = 'listening',
  WATCHING = 'watching',
  WRITING = 'writing',
  THINKING = 'thinking',
  PLANNING = 'planning',
  CALLING = 'calling',
  MESSAGING = 'messaging',
  LEARNING = 'learning',
  REVIEWING = 'reviewing',
  CREATING = 'creating',
  ORGANIZING = 'organizing',
  EXERCISING = 'exercising',
  MEDITATING = 'meditating',
  RESTING = 'resting',
  SOCIALIZING = 'socializing'
}

export enum ActivityCategory {
  WORK = 'work',
  LEARNING = 'learning',
  PERSONAL = 'personal',
  HEALTH = 'health',
  ENTERTAINMENT = 'entertainment',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  ADMINISTRATIVE = 'administrative'
}

export interface SuitabilityScore {
  overall: number // 0-100
  factors: {
    environment: number
    resources: number
    focus: number
    safety: number
    comfort: number
  }
  reasoning: string
}

export interface ActivityRequirements {
  focus: FocusRequirement
  tools: string[]
  internet: boolean
  quiet: boolean
  privacy: boolean
  power: boolean
  stable: boolean
  handsFrequency // 需要手的程度
}

export enum FocusRequirement {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  DEEP = 'deep'
}

export enum HandsRequirement {
  HANDS_FREE = 'hands_free',
  ONE_HAND = 'one_hand',
  TWO_HANDS = 'two_hands',
  INTERMITTENT = 'intermittent'
}

export enum ActivityStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed'
}

export interface ActivityOutput {
  type: 'note' | 'task' | 'idea' | 'decision' | 'content' | 'progress'
  content: any
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  value: number // 0-100 价值评估
}

export interface EnvironmentConditions {
  lighting: 'bright' | 'adequate' | 'dim' | 'dark'
  temperature: 'hot' | 'warm' | 'comfortable' | 'cool' | 'cold'
  weather?: string
  seating: 'comfortable' | 'adequate' | 'uncomfortable' | 'standing'
  privacy: 'private' | 'semi-private' | 'public'
  connectivity: ConnectivityStatus
}

export interface ConnectivityStatus {
  cellular: 'excellent' | 'good' | 'poor' | 'none'
  wifi: 'available' | 'unavailable'
  speed?: number // Mbps
  stability: 'stable' | 'intermittent' | 'unstable'
}

export interface ProductivityAssessment {
  score: number // 0-100
  utilization: number // 0-100 时间利用率
  focusQuality: number // 0-100
  outputValue: number // 0-100
  
  // 影响因素
  positiveFactors: string[]
  negativeFactors: string[]
  
  // 改进建议
  improvements: string[]
}

export interface SessionFeedback {
  satisfaction: number // 1-5
  wouldRepeat: boolean
  actualVsPlanned: 'better' | 'as_expected' | 'worse'
  comments?: string
  highlights?: string[]
  challenges?: string[]
}

// 活动推荐
export interface ActivityRecommendation {
  activity: PlannedActivity
  score: number // 0-100
  reasons: string[]
  alternativeIf: {
    condition: string
    alternative: PlannedActivity
  }[]
}

// 通勤模式
export interface CommutePattern {
  id: string
  name: string
  
  // 模式特征
  typical: {
    duration: number
    transport: TransportMode
    timeOfDay: string[]
    frequency: 'daily' | 'weekly' | 'occasional'
  }
  
  // 历史表现
  history: {
    sessions: number
    averageProductivity: number
    preferredActivities: ActivityType[]
    successfulActivities: PlannedActivity[]
  }
  
  // 优化策略
  optimizations: OptimizationStrategy[]
}

export interface OptimizationStrategy {
  id: string
  name: string
  description: string
  
  // 适用条件
  conditions: {
    minDuration?: number
    maxDuration?: number
    transport?: TransportMode[]
    timeOfDay?: string[]
  }
  
  // 推荐活动序列
  activitySequence: ActivityTemplate[]
  
  // 预期效果
  expectedBenefit: {
    productivity: number
    wellbeing: number
    learning: number
    description: string
  }
}

export interface ActivityTemplate {
  type: ActivityType
  duration: number // 分钟
  priority: 'must' | 'should' | 'nice'
  
  // 内容建议
  suggestions: ContentSuggestion[]
  
  // 备选方案
  alternatives?: ActivityTemplate[]
}

export interface ContentSuggestion {
  id: string
  type: 'article' | 'podcast' | 'video' | 'audiobook' | 'course' | 'task'
  title: string
  source?: string
  duration: number
  url?: string
  offline: boolean
  tags: string[]
}

// 等待时间特殊处理
export interface WaitTimeScenario {
  id: string
  type: WaitType
  location: string
  expectedDuration: number
  uncertainty: 'high' | 'medium' | 'low'
  
  // 活动建议
  recommendations: {
    short: PlannedActivity[] // < 5分钟
    medium: PlannedActivity[] // 5-15分钟
    long: PlannedActivity[] // > 15分钟
  }
  
  // 中断处理
  interruptionStrategy: {
    checkInterval: number // 检查间隔（分钟）
    quickSave: boolean // 支持快速保存
    resumable: boolean // 支持恢复
  }
}

export enum WaitType {
  APPOINTMENT = 'appointment',
  QUEUE = 'queue',
  DELAY = 'delay',
  LAYOVER = 'layover',
  CHARGING = 'charging', // 电动车充电等待
  OTHER = 'other'
}

// 统计分析
export interface CommuteStatistics {
  // 时间统计
  totalMinutes: number
  dailyAverage: number
  weeklyTotal: number
  monthlyTotal: number
  
  // 生产力统计
  productiveMinutes: number
  utilizationRate: number
  averageProductivity: number
  
  // 活动统计
  activitiesCompleted: number
  mostFrequentActivities: Array<{
    type: ActivityType
    count: number
    totalMinutes: number
    averageProductivity: number
  }>
  
  // 内容消费
  contentConsumed: {
    articles: number
    podcasts: number
    videos: number
    books: number
    courses: number
  }
  
  // 健康影响
  wellbeingImpact: {
    stressReduction: number
    learningGains: number
    socialConnections: number
    physicalActivity: number
  }
}

// 预设方案
export interface CommutePreset {
  id: string
  name: string
  description: string
  icon: string
  
  // 适用场景
  scenarios: {
    transport: TransportMode[]
    duration: { min: number; max: number }
    frequency: string[]
  }
  
  // 活动组合
  activities: ActivityTemplate[]
  
  // 用户评价
  rating: number
  usage: number
  feedback: string[]
}

// 智能建议
export interface SmartSuggestion {
  id: string
  type: 'activity' | 'content' | 'optimization' | 'habit'
  priority: 'high' | 'medium' | 'low'
  
  title: string
  description: string
  
  // 建议内容
  suggestion: {
    what: string
    why: string
    how: string
    when: string
  }
  
  // 预期收益
  benefit: {
    time: number // 节省的分钟
    productivity: number // 提升百分比
    specific: string
  }
  
  // 实施难度
  difficulty: 'easy' | 'medium' | 'hard'
  
  // 相关资源
  resources?: ContentSuggestion[]
}