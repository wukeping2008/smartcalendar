// 语音系统类型定义

export interface VoiceEngine {
  // 语音识别
  startListening(): Promise<void>
  stopListening(): void
  isListening: boolean
  
  // 语音合成
  speak(text: string, options?: SpeechOptions): Promise<void>
  stopSpeaking(): void
  isSpeaking: boolean
  
  // 语音命令
  registerCommand(pattern: string, handler: VoiceCommandHandler): void
  unregisterCommand(pattern: string): void
  processCommand(text: string): Promise<CommandResult>
  
  // 事件处理
  onSpeechResult(callback: (text: string) => void): void
  onSpeechError(callback: (error: Error) => void): void
  onCommandRecognized(callback: (command: VoiceCommand) => void): void
}

export interface SpeechOptions {
  voice?: SpeechSynthesisVoice
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

export interface VoiceCommand {
  id: string
  pattern: string
  text: string
  confidence: number
  parameters: Record<string, string>
  timestamp: Date
}

export type VoiceCommandHandler = (params: Record<string, string>) => Promise<CommandResult>

export interface CommandResult {
  success: boolean
  message: string
  data?: unknown
  followUpQuestion?: string
}

// AI对话系统
export interface AIConversation {
  id: string
  messages: AIMessage[]
  context: ConversationContext
  status: ConversationStatus
  createdAt: Date
  updatedAt: Date
}

export interface AIMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface MessageMetadata {
  confidence?: number
  intent?: string
  entities?: Record<string, string>
  audioUrl?: string
}

export interface ConversationContext {
  userId: string
  sessionId: string
  currentTopic?: string
  recentEvents: string[]
  userPreferences: UserPreferences
  emotionalState?: EmotionalState
}

export enum ConversationStatus {
  ACTIVE = 'active',
  WAITING = 'waiting',
  ENDED = 'ended',
  ERROR = 'error'
}

// 语音UI状态
export interface VoiceUIState {
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  currentWaveform: number[]
  recognitionText: string
  responseText: string
  confidence: number
  error: string | null
}

// 语音命令定义
export interface VoiceCommandSet {
  // 事件管理
  createEvent: VoiceCommandConfig
  updateEvent: VoiceCommandConfig
  deleteEvent: VoiceCommandConfig
  findEvent: VoiceCommandConfig
  
  // 时间查询
  todaySchedule: VoiceCommandConfig
  tomorrowSchedule: VoiceCommandConfig
  weekSchedule: VoiceCommandConfig
  freeTime: VoiceCommandConfig
  
  // 时间流控制
  playTimeFlow: VoiceCommandConfig
  pauseTimeFlow: VoiceCommandConfig
  zoomTimeFlow: VoiceCommandConfig
  centerOnTime: VoiceCommandConfig
  
  // AI助手
  askQuestion: VoiceCommandConfig
  getAdvice: VoiceCommandConfig
  analyzeTime: VoiceCommandConfig
  optimizeSchedule: VoiceCommandConfig
}

export interface VoiceCommandConfig {
  patterns: string[]
  description: string
  examples: string[]
  parameters: ParameterConfig[]
  handler: VoiceCommandHandler
}

export interface ParameterConfig {
  name: string
  type: ParameterType
  required: boolean
  description: string
  validation?: (value: string) => boolean
}

export enum ParameterType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  TIME = 'time',
  DURATION = 'duration',
  CATEGORY = 'category',
  PRIORITY = 'priority'
}

// 用户偏好设置
export interface UserPreferences {
  language: string
  voiceSettings: VoiceSettings
  commandShortcuts: Record<string, string>
  autoConfirm: boolean
  verboseResponses: boolean
}

export interface VoiceSettings {
  preferredVoice: string
  speechRate: number
  speechPitch: number
  speechVolume: number
  recognitionLanguage: string
}

// 情绪状态
export interface EmotionalState {
  energy: number // 0-100
  stress: number // 0-100
  focus: number // 0-100
  mood: MoodType
  timestamp: Date
}

export enum MoodType {
  EXCITED = 'excited',
  HAPPY = 'happy',
  NEUTRAL = 'neutral',
  TIRED = 'tired',
  STRESSED = 'stressed',
  FRUSTRATED = 'frustrated'
}

// 语音分析结果
export interface VoiceAnalysis {
  transcript: string
  confidence: number
  intent: IntentResult
  entities: EntityResult[]
  sentiment: SentimentResult
  audioFeatures: AudioFeatures
}

export interface IntentResult {
  name: string
  confidence: number
  parameters: Record<string, string>
}

export interface EntityResult {
  type: string
  value: string
  confidence: number
  startIndex: number
  endIndex: number
}

export interface SentimentResult {
  polarity: number // -1 to 1
  magnitude: number // 0 to 1
  label: SentimentLabel
}

export enum SentimentLabel {
  VERY_POSITIVE = 'very_positive',
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  VERY_NEGATIVE = 'very_negative'
}

export interface AudioFeatures {
  volume: number
  pitch: number
  speed: number
  clarity: number
  backgroundNoise: number
}

// 语音事件
export interface VoiceEvent {
  type: VoiceEventType
  timestamp: Date
  data: unknown
}

export enum VoiceEventType {
  // 识别事件
  RECOGNITION_START = 'recognition_start',
  RECOGNITION_RESULT = 'recognition_result',
  RECOGNITION_END = 'recognition_end',
  RECOGNITION_ERROR = 'recognition_error',
  
  // 合成事件
  SYNTHESIS_START = 'synthesis_start',
  SYNTHESIS_END = 'synthesis_end',
  SYNTHESIS_ERROR = 'synthesis_error',
  
  // 命令事件
  COMMAND_RECOGNIZED = 'command_recognized',
  COMMAND_EXECUTED = 'command_executed',
  COMMAND_FAILED = 'command_failed',
  
  // 对话事件
  CONVERSATION_START = 'conversation_start',
  CONVERSATION_END = 'conversation_end',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received'
}

// 语音服务配置
export interface VoiceServiceConfig {
  recognition: {
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    language: string
  }
  
  synthesis: {
    voice: string
    rate: number
    pitch: number
    volume: number
  }
  
  ai: {
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
  }
  
  commands: {
    enabled: boolean
    confidenceThreshold: number
    timeoutMs: number
  }
}
