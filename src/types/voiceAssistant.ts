// Voice Assistant 核心类型定义

export interface Message {
    id: string
    content: string
    type: 'text' | 'audio' | 'mixed'
    source?: 'user' | 'ai' | 'system'
    timestamp: number
    metadata?: MessageMetadata
}

export interface MessageMetadata {
    audioUrl?: string
    duration?: number
    confidence?: number
    language?: string
    [key: string]: any
}

export interface ChatMessage {
    content: string
    content_type: string
    role: 'user' | 'assistant' | 'system'
}

export interface AnalysisResult {
    analysis_type: string
    result?: any
    confidence?: number
    error?: string
    raw_result?: string
}

export interface ConversationAnalysis {
    analysis_type: string
    message_count: number
    time_range: {
        start: number
        end: number
    }
    result: AnalysisResult
}

export interface VoiceAssistantConfig {
    deviceId?: string
    botId?: string
    voiceId?: string
    autoPlay?: boolean
    autoSave?: boolean
}

export interface AudioDeviceInfo {
    audioInputs: MediaDeviceInfo[]
    audioOutputs: MediaDeviceInfo[]
}

export interface TranscriptionResult {
    id: string
    text: string
    confidence: number
    duration: number
    timestamp: number
    metadata?: any
}

export interface MessageFilter {
    type?: 'text' | 'audio' | 'mixed'
    source?: 'user' | 'ai' | 'system'
    startTime?: number
    endTime?: number
}

export interface SearchOptions {
    caseSensitive?: boolean
    wholeWord?: boolean
    regex?: boolean
    limit?: number
}

export interface AnalysisConfig {
    type: 'sentiment' | 'keywords' | 'summary' | 'custom'
    minTextLength: number
    customPrompt?: string
}

// 事件类型
export type VoiceAssistantEvent =
    | 'message:sent'
    | 'message:received'
    | 'transcription:update'
    | 'synthesis:start'
    | 'synthesis:end'
    | 'error'

// 消息队列项
export interface MessageQueueItem {
    message: Message
    priority: number
    timestamp: number
}

// 历史管理配置
export interface HistoryConfig {
    maxMessages: number
    autoSave: boolean
    saveInterval: number
    storageKey: string
}
