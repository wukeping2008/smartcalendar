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

// 语音识别类型定义
export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  grammars: any; // SpeechGrammarList
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onnomatch: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface ExtendedWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
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