import { CozeAPI, ChatEventType, RoleType } from '@coze/api'
import { COZE_CONFIG } from '@/config/voiceAssistant'
import type { ChatMessage } from '@/types/voiceAssistant'

export class AIService {
    private client: CozeAPI
    private serviceReady = false

    constructor() {
        this.client = new CozeAPI({
            token: COZE_CONFIG.ACCESS_TOKEN,
            baseURL: COZE_CONFIG.BASE_URL,
            allowPersonalAccessTokenInBrowser: true
        })
        this.serviceReady = true
    }

    /**
     * 流式聊天
     */
    async streamChat(
        messages: ChatMessage[],
        botId: string = COZE_CONFIG.DEFAULT_BOT_ID,
        onChunk?: (chunk: string) => void,
        onComplete?: (fullResponse: string) => void
    ): Promise<void> {
        if (!this.serviceReady) {
            throw new Error('AI服务未就绪')
        }

        try {
            let fullResponse = ''

            const stream = await this.client.chat.stream({
                bot_id: botId,
                user_id: 'calendar-user',
                additional_messages: messages.map(msg => ({
                    role: msg.role as RoleType,
                    content: msg.content,
                    content_type: 'text'
                }))
            })

            for await (const chunk of stream) {
                if (chunk.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                    const content = chunk.data.content || ''
                    fullResponse += content
                    onChunk?.(content)
                }
            }

            onComplete?.(fullResponse)
        } catch (error) {
            console.error('流式聊天失败:', error)
            throw error
        }
    }

    /**
     * 普通聊天
     */
    async chat(
        messages: ChatMessage[],
        botId: string = COZE_CONFIG.DEFAULT_BOT_ID
    ): Promise<string> {
        if (!this.serviceReady) {
            throw new Error('AI服务未就绪')
        }

        try {
            const response = await this.client.chat.create({
                bot_id: botId,
                user_id: 'calendar-user',
                additional_messages: messages.map((msg: ChatMessage) => ({
                    role: msg.role as RoleType,
                    content: msg.content,
                    content_type: 'text'
                }))
            })

            // 获取最后一条助手消息
            const lastMessage = (response as any).messages
                ?.filter((msg: any) => msg.role === RoleType.Assistant)
                .pop()

            return lastMessage?.content || '抱歉，我没有理解您的问题。'
        } catch (error) {
            console.error('聊天失败:', error)
            throw error
        }
    }

    /**
     * 分析文本
     */
    async analyzeText(
        text: string,
        analysisType: 'sentiment' | 'keywords' | 'summary' | 'calendar' = 'calendar'
    ): Promise<any> {
        if (!this.serviceReady) {
            throw new Error('AI服务未就绪')
        }

        const prompts = {
            sentiment: '请分析以下文本的情感倾向，返回积极、消极或中性：',
            keywords: '请提取以下文本的关键词，用逗号分隔：',
            summary: '请总结以下文本的主要内容：',
            calendar: '请分析以下文本中的日程信息，提取时间、地点、事件等信息，以JSON格式返回：'
        }

        try {
            const messages: ChatMessage[] = [
                {
                    role: 'user',
                    content: `${prompts[analysisType]}\n\n${text}`,
                    content_type: 'text'
                }
            ]

            const result = await this.chat(messages, COZE_CONFIG.ANALYSIS_BOT_ID)
            return result
        } catch (error) {
            console.error('文本分析失败:', error)
            throw error
        }
    }

    /**
     * 生成日程建议
     */
    async generateScheduleSuggestions(
        currentEvents: any[],
        userPreferences?: any
    ): Promise<string[]> {
        if (!this.serviceReady) {
            throw new Error('AI服务未就绪')
        }

        try {
            const eventsText = currentEvents.map(event => 
                `${event.title} - ${event.startTime} 到 ${event.endTime}`
            ).join('\n')

            const messages: ChatMessage[] = [
                {
                    role: 'user',
                    content: `基于以下现有日程，请为用户提供3-5个优化建议：\n\n${eventsText}`,
                    content_type: 'text'
                }
            ]

            const result = await this.chat(messages)
            
            // 简单解析建议（实际项目中可能需要更复杂的解析）
            return result.split('\n').filter(line => line.trim().length > 0)
        } catch (error) {
            console.error('生成日程建议失败:', error)
            return ['暂时无法生成建议，请稍后重试。']
        }
    }

    /**
     * 处理语音命令
     */
    async processVoiceCommand(command: string): Promise<{
        action: string
        parameters: any
        response: string
    }> {
        if (!this.serviceReady) {
            throw new Error('AI服务未就绪')
        }

        try {
            const messages: ChatMessage[] = [
                {
                    role: 'user',
                    content: `请分析以下语音命令，识别用户意图并返回JSON格式的结果，包含action（动作）、parameters（参数）和response（回复）字段：\n\n"${command}"`,
                    content_type: 'text'
                }
            ]

            const result = await this.chat(messages)
            
            try {
                return JSON.parse(result)
            } catch {
                // 如果解析失败，返回默认结构
                return {
                    action: 'unknown',
                    parameters: {},
                    response: result
                }
            }
        } catch (error) {
            console.error('处理语音命令失败:', error)
            return {
                action: 'error',
                parameters: {},
                response: '抱歉，我无法理解您的指令。'
            }
        }
    }

    /**
     * 检查服务状态
     */
    isReady(): boolean {
        return this.serviceReady
    }

    /**
     * 获取配置信息
     */
    getConfig() {
        return {
            botId: COZE_CONFIG.DEFAULT_BOT_ID,
            analysisBot: COZE_CONFIG.ANALYSIS_BOT_ID,
            features: COZE_CONFIG.FEATURES
        }
    }
}

// 单例模式
let aiServiceInstance: AIService | null = null

export const getAIService = (): AIService => {
    if (!aiServiceInstance) {
        aiServiceInstance = new AIService()
    }
    return aiServiceInstance
}
