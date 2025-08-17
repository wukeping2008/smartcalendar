'use client'

import { postAiSSE } from '../../llmApi'
import { Event, EventCategory } from '../../types/event'

/**
 * LLM集成服务 - 封装llmApi调用，提供统一的LLM接口
 * 功能：文案优化、智能对话、深度分析
 */

export interface LLMResponse {
  content: string
  tokens: number
  completed: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMStreamOptions {
  onData?: (chunk: string) => void
  onComplete?: (response: LLMResponse) => void
  onError?: (error: unknown) => void
}

// LLM请求的返回类型
interface LLMRequestResult {
  requestId: string
  cancel: () => void
}

// postAiSSE返回的实例类型
interface LLMInstance {
  cancel(): void
}

export class LLMIntegrationService {
  private static instance: LLMIntegrationService
  private cache: Map<string, LLMResponse> = new Map()
  private activeRequests: Map<string, LLMInstance> = new Map()

  private constructor() {}

  static getInstance(): LLMIntegrationService {
    if (!LLMIntegrationService.instance) {
      LLMIntegrationService.instance = new LLMIntegrationService()
    }
    return LLMIntegrationService.instance
  }

  /**
   * 智能对话功能
   */
  async chat(
    messages: ChatMessage[],
    options: LLMStreamOptions = {}
  ): Promise<LLMRequestResult> {
    const requestId = `chat_${Date.now()}`
    let fullResponse = ''
    let totalTokens = 0

    const llmInstance = postAiSSE({
      params: {
        modelName: 'volcesDeepseek',
        messages: messages,
        temperature: '0.7',
        maxTokens: 2048
      },
      onData: (chunk: string) => {
        fullResponse += chunk
        options.onData?.(chunk)
      },
      onError: (error: unknown) => {
        // LLM Chat Error occurred
        this.activeRequests.delete(requestId)
        options.onError?.(error)
      },
      onComplete: (tokens: number) => {
        totalTokens = tokens
        const response: LLMResponse = {
          content: fullResponse,
          tokens: totalTokens,
          completed: true
        }
        
        this.activeRequests.delete(requestId)
        options.onComplete?.(response)
      }
    })

    this.activeRequests.set(requestId, llmInstance)
    return {
      requestId,
      cancel: () => {
        llmInstance.cancel()
        this.activeRequests.delete(requestId)
      }
    }
  }

  /**
   * 增强AI建议文案
   */
  async enhanceRecommendation(
    originalRecommendation: string,
    eventContext: Event,
    options: LLMStreamOptions = {}
  ): Promise<LLMRequestResult> {
    const cacheKey = `enhance_${originalRecommendation.slice(0, 50)}_${eventContext.category}`
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      setTimeout(() => options.onComplete?.(cached), 0)
      return { requestId: cacheKey, cancel: () => {} }
    }

    const contextInfo = this.buildEventContext(eventContext)
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的时间管理AI助手，擅长为用户提供个性化的时间安排建议。请根据事件上下文，将原始建议优化为更自然、更贴心的表达。

要求：
1. 保持建议的核心内容不变
2. 使用更自然、更人性化的表达
3. 结合事件的具体情况给出针对性建议
4. 语言简洁明了，避免过于冗长
5. 体现专业性和关怀性`
      },
      {
        role: 'user',
        content: `事件信息：${contextInfo}

原始建议：${originalRecommendation}

请优化这个建议，使其更加自然和个性化。`
      }
    ]

    return this.chat(messages, {
      ...options,
      onComplete: (response) => {
        // 缓存结果
        this.cache.set(cacheKey, response)
        options.onComplete?.(response)
      }
    })
  }

  /**
   * 生成智能洞察报告
   */
  async generateInsightReport(
    analysisData: {
      habitAnalysis: string
      productivityTips: string[]
      energyOptimization: string
      weeklyPattern: string
    },
    events: Event[],
    options: LLMStreamOptions = {}
  ): Promise<LLMRequestResult> {
    const eventSummary = this.buildEventsSummary(events)
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的时间管理分析师，擅长解读用户的时间使用数据并提供深入的洞察和建议。

请基于用户的时间数据分析，生成一份专业的时间管理洞察报告。报告应该：
1. 具有专业性和可读性
2. 提供具体可行的改进建议
3. 突出用户的优点和需要改进的地方
4. 使用友好和鼓励的语调
5. 结构清晰，条理分明`
      },
      {
        role: 'user',
        content: `用户时间数据分析：

习惯分析：${analysisData.habitAnalysis}

效率建议：
${analysisData.productivityTips.map(tip => `• ${tip}`).join('\n')}

精力优化：${analysisData.energyOptimization}

周模式：${analysisData.weeklyPattern}

事件概况：${eventSummary}

请生成一份专业的时间管理洞察报告，包含深入分析和改进建议。`
      }
    ]

    return this.chat(messages, options)
  }

  /**
   * 智能问答功能
   */
  async askQuestion(
    question: string,
    userEvents: Event[],
    options: LLMStreamOptions = {}
  ): Promise<LLMRequestResult> {
    const eventContext = this.buildEventsContext(userEvents)
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是用户的个人时间管理AI助手，名字叫小智。你可以访问用户的日程安排数据，并基于这些信息回答用户的问题。

特点：
1. 友好、专业、有用
2. 基于实际数据给出建议
3. 关注用户的时间管理和效率提升
4. 回答简洁明了，避免冗长
5. 适当使用emoji增加友好感

你可以帮助用户：
- 查询日程安排
- 分析时间使用情况
- 提供时间管理建议
- 解答效率相关问题`
      },
      {
        role: 'user',
        content: `我的日程信息：${eventContext}

我的问题：${question}`
      }
    ]

    return this.chat(messages, options)
  }

  /**
   * 语音指令增强理解
   */
  async enhanceVoiceCommand(
    voiceText: string,
    options: LLMStreamOptions = {}
  ): Promise<LLMRequestResult> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是语音指令解析助手，擅长理解和解析用户的自然语言时间安排指令。

任务：将用户的语音文本解析为结构化的事件信息。

返回格式（JSON）：
{
  "title": "事件标题",
  "description": "事件描述",
  "startTime": "开始时间（如：2024-01-01 14:00）",
  "duration": "时长（分钟）",
  "category": "事件类别",
  "priority": "优先级",
  "energyRequired": "精力需求",
  "tags": ["标签1", "标签2"],
  "reminders": [
    {
      "time": "提醒时间",
      "message": "提醒消息"
    }
  ],
  "confidence": "解析置信度（0-1）"
}

如果无法完全解析，请在对应字段使用null，并在description中说明需要用户补充的信息。`
      },
      {
        role: 'user',
        content: `请解析以下语音指令：

"${voiceText}"`
      }
    ]

    return this.chat(messages, options)
  }

  /**
   * 取消所有活跃请求
   */
  cancelAllRequests(): void {
    this.activeRequests.forEach((request: LLMInstance) => {
      request.cancel()
    })
    this.activeRequests.clear()
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  // 私有辅助方法

  private buildEventContext(event: Event): string {
    return `事件：${event.title}
类别：${event.category}
时间：${event.startTime.toLocaleString('zh-CN')}
时长：${event.estimatedDuration}分钟
优先级：${event.priority}
精力需求：${event.energyRequired}
描述：${event.description || '无'}`
  }

  private buildEventsContext(events: Event[]): string {
    if (events.length === 0) return '暂无日程安排'
    
    const today = new Date()
    const todayEvents = events.filter(e => 
      e.startTime.toDateString() === today.toDateString()
    )
    
    const upcomingEvents = events.filter(e => 
      e.startTime > today
    ).slice(0, 5)

    let context = `今日安排（${todayEvents.length}个）：\n`
    todayEvents.forEach(event => {
      context += `• ${event.startTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})} - ${event.title}\n`
    })

    if (upcomingEvents.length > 0) {
      context += `\n即将到来的安排：\n`
      upcomingEvents.forEach(event => {
        context += `• ${event.startTime.toLocaleDateString('zh-CN')} ${event.startTime.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})} - ${event.title}\n`
      })
    }

    return context
  }

  private buildEventsSummary(events: Event[]): string {
    const categoryCount = events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1
      return acc
    }, {} as Record<EventCategory, number>)

    const totalDuration = events.reduce((sum, event) => sum + event.estimatedDuration, 0)
    
    return `总事件：${events.length}个，总时长：${Math.round(totalDuration / 60)}小时
类别分布：${Object.entries(categoryCount).map(([cat, count]) => `${cat}(${count})`).join(', ')}`
  }
}

// 导出单例实例
export const llmService = LLMIntegrationService.getInstance()
export default LLMIntegrationService
