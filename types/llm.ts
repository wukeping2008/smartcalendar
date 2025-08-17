// LLM服务相关类型定义

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequestParams {
  modelName?: string;
  messages?: LLMMessage[];
  temperature?: string;
  maxTokens?: number;
}

export interface LLMRequestCallbacks {
  onData?: (data: string) => void;
  onError?: (error: Error) => void;
  onComplete?: (tokens: number) => void;
}

export interface LLMInstance {
  cancel: () => void;
}

export interface LLMResponse {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
  }>;
  content?: string;
  data?: string | object;
  text?: string;
}

export interface ParsedCommand {
  intent: string;
  entities: Record<string, unknown>;
  confidence: number;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI?: string;
  localService?: boolean;
  default?: boolean;
}

// Speech Recognition类型扩展
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface ExtendedWindow extends Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

// AI服务响应类型
export interface AIAnalysis {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
}

export interface AIScheduleOptimization {
  originalEvents: Array<{ id: string; startTime: Date; endTime: Date }>;
  optimizedEvents: Array<{ id: string; startTime: Date; endTime: Date; reason: string }>;
  improvements: string[];
  estimatedProductivityGain: number;
}