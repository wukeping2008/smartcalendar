'use client'

import { Event, EventCategory, Priority, EnergyLevel } from '../../types/event'
import { llmService, ChatMessage } from './LLMIntegrationService'

/**
 * AI服务 - 智能日程管理核心引擎 v3.0
 * 使用LLMIntegrationService实现真实AI功能
 * 包含：智能推荐、习惯学习、冲突解决、自然语言处理
 */

// AI学习的用户习惯数据
interface UserHabits {
  // 时间偏好
  preferredWorkingHours: { start: number; end: number }
  peakEnergyHours: number[]
  lowEnergyHours: number[]
  
  // 类别偏好
  categoryFrequency: Record<EventCategory, number>
  categoryDurations: Record<EventCategory, number>
  categoryPriorities: Record<EventCategory, Priority>
  
  // 行为模式
  averageEventDuration: number
  bufferTimePreference: number // 事件间隔偏好
  multitaskingCapability: number // 多任务处理能力评分
  
  // 灵活性
  reschedulingPatterns: {
    category: EventCategory
    flexibility: number
    frequentChanges: boolean
  }[]
}

// AI分析结果
interface AIAnalysis {
  habitScore: number // 习惯匹配度
  energyAlignment: number // 精力匹配度
  conflictRisk: number // 冲突风险
  optimizationScore: number // 优化得分
  recommendations: AIRecommendation[]
}

// AI推荐
export interface AIRecommendation {
  type: 'time_adjustment' | 'energy_optimization' | 'conflict_resolution' | 'habit_improvement'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  action?: string
}

// 解析的命令
interface ParsedCommand {
  intent: 'create_event' | 'modify_event' | 'query_schedule' | 'set_goal' | 'other'
  entities: {
    title?: string
    dateTime?: string
    duration?: number
    category?: EventCategory
    priority?: Priority
    location?: string
  }
  confidence: number
  suggestedAction: {
    type: string
    data: Record<string, unknown>
    alternatives?: Array<Record<string, unknown>>
  }
}

// 子任务
interface SubTask {
  title: string
  estimatedHours: number
  energyLevel: EnergyLevel
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening'
  dependencies: string[]
  category: EventCategory
}

// 市场状态
interface MarketStatus {
  isOpen: boolean
  volatility: 'low' | 'medium' | 'high' | 'extreme'
  alerts: Array<{
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

// 用户偏好
interface UserPreferences {
  workingHours: { start: number; end: number }
  energyPattern: Record<string, EnergyLevel>
  tradingFocus: boolean
  deepWorkPreference: 'morning' | 'afternoon' | 'evening'
  breakFrequency: number
}

class AIService {
  private static instance: AIService
  private userHabits: UserHabits | null = null
  private lastAnalysis: AIAnalysis | null = null
  private activeRequests: Map<string, () => void> = new Map()

  private constructor() {
    this.initializeDefaultHabits()
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  private initializeDefaultHabits() {
    this.userHabits = {
      preferredWorkingHours: { start: 9, end: 18 },
      peakEnergyHours: [10, 11, 14, 15],
      lowEnergyHours: [13, 17, 18],
      categoryFrequency: {} as Record<EventCategory, number>,
      categoryDurations: {} as Record<EventCategory, number>,
      categoryPriorities: {} as Record<EventCategory, Priority>,
      averageEventDuration: 60,
      bufferTimePreference: 15,
      multitaskingCapability: 0.7,
      reschedulingPatterns: []
    }
  }

  /**
   * 生成智能推荐 - 使用真实LLM
   */
  async generateRecommendations(events: Event[]): Promise<AIRecommendation[]> {
    const eventContext = this.buildEventContext(events)
    const recommendations: AIRecommendation[] = []
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的时间管理AI助手。基于用户的日程安排，提供智能优化建议。
        
请分析用户的日程并生成3-5个具体的优化建议。每个建议应包含：
1. 建议类型（时间调整/精力优化/冲突解决/习惯改进）
2. 具体内容
3. 预期影响（高/中/低）
4. 实施方案

返回JSON格式的建议数组。`
      },
      {
        role: 'user',
        content: `请分析以下日程安排并提供优化建议：\n${eventContext}`
      }
    ]

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          try {
            // 解析LLM返回的JSON
            const parsed = JSON.parse(response.content)
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                recommendations.push({
                  type: item.type || 'habit_improvement',
                  title: item.title || '优化建议',
                  description: item.description || item.content || '建议内容',
                  impact: item.impact || 'medium',
                  confidence: item.confidence || 0.8,
                  action: item.action
                })
              })
            }
          } catch (error) {
            // 如果解析失败，生成默认建议
            recommendations.push({
              type: 'habit_improvement',
              title: '智能优化建议',
              description: response.content,
              impact: 'medium',
              confidence: 0.7
            })
          }
          resolve(recommendations)
        },
        onError: () => {
          // 返回默认建议
          resolve(this.generateDefaultRecommendations(events))
        }
      })
    })
  }

  /**
   * 分析用户习惯 - 使用真实LLM
   */
  async analyzeUserHabits(events: Event[]): Promise<string> {
    const eventSummary = this.buildEventSummary(events)
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是一个时间管理分析专家，擅长分析用户的时间使用习惯和模式。'
      },
      {
        role: 'user',
        content: `请分析以下事件数据，总结用户的时间管理习惯：\n${eventSummary}`
      }
    ]

    return new Promise((resolve) => {
      let analysis = ''
      llmService.chat(messages, {
        onData: (chunk) => {
          analysis += chunk
        },
        onComplete: () => {
          resolve(analysis || '正在分析您的时间使用习惯...')
        },
        onError: () => {
          resolve('基于您的日程安排，您倾向于在上午处理重要任务，下午进行协作性工作。')
        }
      })
    })
  }

  /**
   * 生成效率提示 - 使用真实LLM
   */
  async generateProductivityTips(events: Event[]): Promise<string[]> {
    const context = this.buildProductivityContext(events)
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是效率专家，提供简洁实用的生产力提升建议。每个建议不超过20个字。'
      },
      {
        role: 'user',
        content: `基于以下日程，给出3个提升效率的建议：\n${context}`
      }
    ]

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          const tips = response.content.split('\n')
            .filter(tip => tip.trim())
            .slice(0, 3)
          resolve(tips.length > 0 ? tips : this.getDefaultProductivityTips())
        },
        onError: () => {
          resolve(this.getDefaultProductivityTips())
        }
      })
    })
  }

  /**
   * 解析自然语言命令 - 使用真实LLM
   */
  async parseNaturalLanguageCommand(text: string): Promise<ParsedCommand> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个自然语言解析助手，将用户的语音指令转换为结构化数据。
        
返回JSON格式：
{
  "intent": "create_event/modify_event/query_schedule/set_goal/other",
  "entities": {
    "title": "事件标题",
    "dateTime": "YYYY-MM-DD HH:mm",
    "duration": 分钟数,
    "category": "事件类别",
    "priority": "urgent/high/medium/low",
    "location": "地点"
  },
  "confidence": 0-1的置信度
}`
      },
      {
        role: 'user',
        content: text
      }
    ]

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          try {
            const parsed = JSON.parse(response.content)
            resolve({
              intent: parsed.intent || 'other',
              entities: parsed.entities || {},
              confidence: parsed.confidence || 0.5,
              suggestedAction: {
                type: parsed.intent || 'unknown',
                data: parsed.entities || {}
              }
            })
          } catch {
            // 解析失败时的默认响应
            resolve({
              intent: 'create_event',
              entities: { title: text },
              confidence: 0.3,
              suggestedAction: { type: 'create', data: { title: text } }
            })
          }
        },
        onError: () => {
          resolve({
            intent: 'other',
            entities: {},
            confidence: 0,
            suggestedAction: { type: 'unknown', data: {} }
          })
        }
      })
    })
  }

  /**
   * 智能任务分解 - 使用真实LLM
   */
  async breakdownTask(
    taskDescription: string,
    estimatedHours: number,
    deadline: Date
  ): Promise<SubTask[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是任务分解专家。将大任务分解为可执行的子任务。
        
返回JSON数组，每个子任务包含：
- title: 子任务名称
- estimatedHours: 预计时长
- energyLevel: low/medium/high/peak
- preferredTimeOfDay: morning/afternoon/evening
- category: 任务类别`
      },
      {
        role: 'user',
        content: `请将以下任务分解：
任务：${taskDescription}
总时长：${estimatedHours}小时
截止日期：${deadline.toLocaleDateString()}`
      }
    ]

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          try {
            const subtasks = JSON.parse(response.content)
            resolve(Array.isArray(subtasks) ? subtasks : [])
          } catch {
            resolve(this.generateDefaultSubtasks(taskDescription, estimatedHours))
          }
        },
        onError: () => {
          resolve(this.generateDefaultSubtasks(taskDescription, estimatedHours))
        }
      })
    })
  }

  /**
   * 生成情境感知建议 - 使用真实LLM
   */
  async generateContextAwareSuggestion(
    currentContext: {
      time: Date
      location?: string
      recentEvents: Event[]
      energyLevel: EnergyLevel
      marketStatus?: MarketStatus
    }
  ): Promise<string> {
    const contextDescription = this.buildContextDescription(currentContext)
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是一个情境感知的AI助手，基于用户当前状态提供个性化建议。'
      },
      {
        role: 'user',
        content: `当前情境：${contextDescription}\n请给出一个简短的建议。`
      }
    ]

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          resolve(response.content || '保持专注，合理安排时间。')
        },
        onError: () => {
          resolve('建议您保持当前的工作节奏，注意适时休息。')
        }
      })
    })
  }

  /**
   * 优化日程安排
   */
  async optimizeSchedule(
    events: Event[],
    preferences: UserPreferences
  ): Promise<Event[]> {
    // 构建优化上下文
    const optimizationContext = this.buildOptimizationContext(events, preferences)
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是日程优化专家。基于用户偏好和精力曲线优化日程安排。
        
考虑因素：
1. 精力匹配：高精力时段安排重要任务
2. 时间块：相似任务集中处理
3. 缓冲时间：避免连续高强度任务
4. 市场时段：保护交易时间

返回优化后的时间建议。`
      },
      {
        role: 'user',
        content: optimizationContext
      }
    ]

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          // 解析优化建议并应用到事件
          const optimizedEvents = this.applyOptimizationSuggestions(events, response.content)
          resolve(optimizedEvents)
        },
        onError: () => {
          resolve(events) // 返回原始事件
        }
      })
    })
  }

  /**
   * 分析冲突并提供解决方案
   */
  async resolveConflicts(conflictingEvents: Event[]): Promise<{
    conflicts: Array<{
      events: Event[]
      severity: 'high' | 'medium' | 'low'
      resolution: string
    }>
  }> {
    const conflictContext = this.buildConflictContext(conflictingEvents)
    
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: '你是冲突解决专家。分析日程冲突并提供解决方案。'
      },
      {
        role: 'user',
        content: `请分析以下冲突事件并提供解决方案：\n${conflictContext}`
      }
    ]

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          resolve({
            conflicts: [{
              events: conflictingEvents,
              severity: 'medium',
              resolution: response.content
            }]
          })
        },
        onError: () => {
          resolve({
            conflicts: [{
              events: conflictingEvents,
              severity: 'medium',
              resolution: '建议重新安排其中一个事件，或考虑合并相关任务。'
            }]
          })
        }
      })
    })
  }

  /**
   * 取消所有活动的AI请求
   */
  cancelAllRequests(): void {
    llmService.cancelAllRequests()
    this.activeRequests.forEach(cancel => cancel())
    this.activeRequests.clear()
  }

  // ========== 辅助方法 ==========

  private buildEventContext(events: Event[]): string {
    if (events.length === 0) return '暂无日程安排'
    
    const categorized = events.reduce((acc, event) => {
      const category = event.category
      if (!acc[category]) acc[category] = []
      acc[category].push(event)
      return acc
    }, {} as Record<EventCategory, Event[]>)

    let context = `用户有${events.length}个日程：\n`
    
    Object.entries(categorized).forEach(([category, catEvents]) => {
      context += `\n${category}（${catEvents.length}个）：\n`
      catEvents.slice(0, 3).forEach(event => {
        context += `- ${event.title}（${event.startTime.toLocaleString()}，${event.estimatedDuration}分钟）\n`
      })
    })

    // 分析模式
    const workEvents = events.filter(e => e.category === EventCategory.WORK)
    const meetingEvents = events.filter(e => e.category === EventCategory.MEETING)
    
    if (workEvents.length > 5) {
      context += '\n工作任务较多，需要注意工作生活平衡。'
    }
    if (meetingEvents.length > 3) {
      context += '\n会议较多，建议预留专注工作时间。'
    }

    return context
  }

  private buildEventSummary(events: Event[]): string {
    const totalHours = events.reduce((sum, e) => sum + e.estimatedDuration, 0) / 60
    const categories = [...new Set(events.map(e => e.category))]
    
    return `
总计${events.length}个事件，约${totalHours.toFixed(1)}小时
涵盖类别：${categories.join('、')}
时间分布：${this.getTimeDistribution(events)}
`
  }

  private buildProductivityContext(events: Event[]): string {
    const highPriorityCount = events.filter(e => e.priority === Priority.URGENT || e.priority === Priority.HIGH).length
    const longEvents = events.filter(e => e.estimatedDuration > 120)
    
    return `
高优先级任务：${highPriorityCount}个
长时间任务：${longEvents.length}个
平均任务时长：${(events.reduce((sum, e) => sum + e.estimatedDuration, 0) / events.length).toFixed(0)}分钟
`
  }

  private buildContextDescription(context: any): string {
    return `
当前时间：${context.time.toLocaleString()}
精力水平：${context.energyLevel}
最近完成：${context.recentEvents.slice(0, 2).map((e: any) => e.title).join('、')}
${context.marketStatus ? `市场状态：${context.marketStatus.volatility}波动` : ''}
`
  }

  private buildOptimizationContext(events: Event[], preferences: UserPreferences): string {
    return `
事件列表：
${events.map(e => `- ${e.title}（${e.startTime.toLocaleTimeString()}，${e.estimatedDuration}分钟，${e.energyRequired}精力）`).join('\n')}

用户偏好：
- 工作时间：${preferences.workingHours.start}:00-${preferences.workingHours.end}:00
- 深度工作偏好：${preferences.deepWorkPreference}
- 休息频率：每${preferences.breakFrequency}小时
${preferences.tradingFocus ? '- 需要保护交易时间' : ''}
`
  }

  private buildConflictContext(events: Event[]): string {
    return events.map(e => 
      `${e.title}：${e.startTime.toLocaleString()} - ${new Date(e.startTime.getTime() + e.estimatedDuration * 60000).toLocaleTimeString()}`
    ).join('\n')
  }

  private getTimeDistribution(events: Event[]): string {
    const morning = events.filter(e => e.startTime.getHours() < 12).length
    const afternoon = events.filter(e => e.startTime.getHours() >= 12 && e.startTime.getHours() < 18).length
    const evening = events.filter(e => e.startTime.getHours() >= 18).length
    
    return `上午${morning}个，下午${afternoon}个，晚上${evening}个`
  }

  private applyOptimizationSuggestions(events: Event[], suggestions: string): Event[] {
    // 暂时返回原始事件，后续可以解析建议并应用
    return events
  }

  private generateDefaultRecommendations(events: Event[]): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []
    
    // 检查工作生活平衡
    const workEvents = events.filter(e => e.category === EventCategory.WORK)
    if (workEvents.length > events.length * 0.7) {
      recommendations.push({
        type: 'habit_improvement',
        title: '改善工作生活平衡',
        description: '您的工作任务占比较高，建议增加一些个人时间和休息活动。',
        impact: 'high',
        confidence: 0.85
      })
    }

    // 检查会议密度
    const meetings = events.filter(e => e.category === EventCategory.MEETING)
    if (meetings.length > 3) {
      recommendations.push({
        type: 'time_adjustment',
        title: '优化会议安排',
        description: '会议较为密集，建议合并相关会议或预留专注时间。',
        impact: 'medium',
        confidence: 0.75
      })
    }

    // 精力管理建议
    const highEnergyTasks = events.filter(e => e.energyRequired === EnergyLevel.PEAK || e.energyRequired === EnergyLevel.HIGH)
    if (highEnergyTasks.length > 2) {
      recommendations.push({
        type: 'energy_optimization',
        title: '优化精力分配',
        description: '高精力需求任务较多，建议分散到不同时段，避免精力耗竭。',
        impact: 'high',
        confidence: 0.8
      })
    }

    return recommendations
  }

  private generateDefaultSubtasks(description: string, hours: number): SubTask[] {
    const subtaskCount = Math.max(2, Math.min(5, Math.ceil(hours / 2)))
    const subtasks: SubTask[] = []
    
    for (let i = 0; i < subtaskCount; i++) {
      subtasks.push({
        title: `${description} - 步骤 ${i + 1}`,
        estimatedHours: hours / subtaskCount,
        energyLevel: i === 0 ? EnergyLevel.HIGH : EnergyLevel.MEDIUM,
        preferredTimeOfDay: i < subtaskCount / 2 ? 'morning' : 'afternoon',
        dependencies: i > 0 ? [`步骤 ${i}`] : [],
        category: EventCategory.WORK
      })
    }
    
    return subtasks
  }

  private getDefaultProductivityTips(): string[] {
    return [
      '📌 集中处理同类任务',
      '⏰ 为重要任务预留黄金时间',
      '🎯 每天设定3个关键目标'
    ]
  }

  /**
   * 与Claude进行对话
   */
  async chatWithClaude(message: string, context?: any): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个智能日历助手，帮助用户管理时间和任务。你可以：
1. 解答日程管理问题
2. 提供生产力建议
3. 分析时间安排
4. 协助事件创建和修改

请用简洁、友好的语调回答问题。${context ? `\n\n当前上下文：${JSON.stringify(context, null, 2)}` : ''}`
      },
      {
        role: 'user',
        content: message
      }
    ];

    return new Promise((resolve, reject) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          resolve(response.content);
        },
        onError: (error) => {
          console.error('Claude chat error:', error);
          reject(new Error('Claude服务暂时不可用，请稍后再试'));
        }
      });
    });
  }

  /**
   * 解析面板控制相关的自然语言命令
   */
  async parsePanelCommand(text: string): Promise<{ intent: string; panelType?: string; entities: any }> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个UI控制助手，将用户的语音指令转换为面板控制命令。
        
面板列表: AI_ASSISTANT, CALENDAR, MARKET_STATUS, TIME_FLOW, VOICE_INPUT, INBOX, TIME_BUDGET, DAILY_BRIEFING, WHAT_IF, PERSON_CARD, COMMUTE_PLANNER, GTD_INBOX

返回JSON格式:
{
  "intent": "open_panel | close_panel | unknown",
  "panelType": "面板ID，来自列表",
  "entities": {}
}`
      },
      {
        role: 'user',
        content: `解析指令: "${text}"`
      }
    ];

    return new Promise((resolve) => {
      llmService.chat(messages, {
        onComplete: (response) => {
          try {
            const parsed = JSON.parse(response.content);
            resolve({
              intent: parsed.intent || 'unknown',
              panelType: parsed.panelType,
              entities: parsed.entities || {}
            });
          } catch {
            resolve({ intent: 'unknown', entities: {} });
          }
        },
        onError: () => {
          resolve({ intent: 'unknown', entities: {} });
        }
      });
    });
  }
}

// 导出单例
export const aiService = AIService.getInstance()
export default aiService
