/**
 * 语音命令管理器
 * 处理日历相关的语音命令
 */

import { VoiceCommandProcessor, type VoiceCommand } from './VoiceService'
import { useEventStore } from '@/stores/eventStore'
import { useRouter } from 'vue-router'
import type { Event } from '@/types'
import { EventCategory, Priority } from '@/types'

export interface CommandContext {
  router: any
  eventStore: any
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string, duration?: number) => void
}

export class VoiceCommandManager {
  private processor: VoiceCommandProcessor
  private context: CommandContext

  constructor(context: CommandContext) {
    this.processor = new VoiceCommandProcessor()
    this.context = context
    this.registerCommands()
  }

  /**
   * 注册所有语音命令
   */
  private registerCommands(): void {
    // 事件创建命令
    this.processor.registerCommand({
      pattern: /创建|添加|新建.*?事件|会议|任务/,
      handler: this.handleCreateEvent.bind(this),
      description: '创建事件：说"创建事件"、"添加会议"或"新建任务"',
      priority: 10
    })

    // 时间查询命令
    this.processor.registerCommand({
      pattern: /今天|明天|后天.*?安排|事件|会议/,
      handler: this.handleQueryEvents.bind(this),
      description: '查询安排：说"今天有什么安排"、"明天的会议"',
      priority: 9
    })

    // 导航命令
    this.processor.registerCommand({
      pattern: /打开|切换到.*?日历|日程|时间流|助手/,
      handler: this.handleNavigation.bind(this),
      description: '页面导航：说"打开日历"、"切换到时间流"',
      priority: 8
    })

    // 事件删除命令
    this.processor.registerCommand({
      pattern: /删除|取消.*?事件|会议|任务/,
      handler: this.handleDeleteEvent.bind(this),
      description: '删除事件：说"删除事件"、"取消会议"',
      priority: 7
    })

    // 时间设置命令
    this.processor.registerCommand({
      pattern: /(上午|下午|晚上|明天|后天).*?(\d{1,2})[点时].*?(开会|会议|任务|事件)/,
      handler: this.handleTimeBasedEvent.bind(this),
      description: '时间事件：说"明天上午9点开会"、"下午2点有任务"',
      priority: 9
    })

    // 帮助命令
    this.processor.registerCommand({
      pattern: /帮助|指令|命令|怎么用/,
      handler: this.handleHelp.bind(this),
      description: '获取帮助：说"帮助"或"有什么指令"',
      priority: 5
    })

    // 状态查询命令
    this.processor.registerCommand({
      pattern: /空闲时间|有空|什么时候有时间/,
      handler: this.handleFreeTimeQuery.bind(this),
      description: '查询空闲：说"什么时候有空"、"查询空闲时间"',
      priority: 6
    })
  }

  /**
   * 处理创建事件命令
   */
  private async handleCreateEvent(matches: string[], fullText: string): Promise<void> {
    try {
      // 解析事件类型
      let eventType = 'event'
      if (fullText.includes('会议')) eventType = 'meeting'
      else if (fullText.includes('任务')) eventType = 'task'

      // 创建默认事件
      const now = new Date()
      const startTime = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 持续1小时

      const newEvent: Partial<Event> = {
        title: `新${eventType === 'meeting' ? '会议' : eventType === 'task' ? '任务' : '事件'}`,
        startTime,
        endTime,
        category: EventCategory.WORK,
        description: '通过语音创建',
        priority: Priority.MEDIUM
      }

      await this.context.eventStore.addEvent(newEvent)
      this.context.showToast('success', `${newEvent.title}已创建`)
      
      // 导航到日历页面
      this.context.router.push('/')
    } catch (error) {
      console.error('创建事件失败:', error)
      this.context.showToast('error', '创建事件失败，请重试')
    }
  }

  /**
   * 处理时间查询命令
   */
  private async handleQueryEvents(matches: string[], fullText: string): Promise<void> {
    try {
      let targetDate = new Date()
      
      // 解析日期
      if (fullText.includes('明天')) {
        targetDate.setDate(targetDate.getDate() + 1)
      } else if (fullText.includes('后天')) {
        targetDate.setDate(targetDate.getDate() + 2)
      }

      const events = this.context.eventStore.getEventsByDate(targetDate)
      
      if (events.length === 0) {
        this.context.showToast('info', '当天没有安排')
      } else {
        const eventList = events.map((e: Event) => e.title).join('、')
        this.context.showToast('info', `当天有${events.length}个安排：${eventList}`)
      }
    } catch (error) {
      console.error('查询事件失败:', error)
      this.context.showToast('error', '查询失败，请重试')
    }
  }

  /**
   * 处理导航命令
   */
  private async handleNavigation(matches: string[], fullText: string): Promise<void> {
    try {
      let route = '/'
      
      if (fullText.includes('日程')) {
        route = '/schedule'
      } else if (fullText.includes('时间流')) {
        route = '/time-flow'
      } else if (fullText.includes('助手')) {
        route = '/ai-assistant'
      }

      await this.context.router.push(route)
      this.context.showToast('success', '页面切换成功')
    } catch (error) {
      console.error('导航失败:', error)
      this.context.showToast('error', '页面切换失败')
    }
  }

  /**
   * 处理删除事件命令
   */
  private async handleDeleteEvent(matches: string[], fullText: string): Promise<void> {
    try {
      const events = this.context.eventStore.getAllEvents()
      
      if (events.length === 0) {
        this.context.showToast('info', '没有可删除的事件')
        return
      }

      // 删除最近的事件（简化处理）
      const latestEvent = events[events.length - 1]
      await this.context.eventStore.deleteEvent(latestEvent.id)
      this.context.showToast('success', `已删除事件：${latestEvent.title}`)
    } catch (error) {
      console.error('删除事件失败:', error)
      this.context.showToast('error', '删除事件失败')
    }
  }

  /**
   * 处理基于时间的事件创建
   */
  private async handleTimeBasedEvent(matches: string[], fullText: string): Promise<void> {
    try {
      // 解析时间信息
      const timeMatch = fullText.match(/(\d{1,2})[点时]/)
      const hour = timeMatch ? parseInt(timeMatch[1]) : 9
      
      // 解析日期
      let targetDate = new Date()
      if (fullText.includes('明天')) {
        targetDate.setDate(targetDate.getDate() + 1)
      } else if (fullText.includes('后天')) {
        targetDate.setDate(targetDate.getDate() + 2)
      }

      // 设置时间
      targetDate.setHours(hour, 0, 0, 0)
      
      // 调整上午/下午
      if (fullText.includes('下午') && hour < 12) {
        targetDate.setHours(hour + 12)
      } else if (fullText.includes('晚上')) {
        targetDate.setHours(hour < 12 ? hour + 12 : hour)
      }

      const endTime = new Date(targetDate.getTime() + 60 * 60 * 1000)

      // 确定事件类型
      let title = '新事件'
      let category = 'event'
      if (fullText.includes('会议')) {
        title = '会议'
        category = 'meeting'
      } else if (fullText.includes('任务')) {
        title = '任务'
        category = 'task'
      }

      const newEvent: Partial<Event> = {
        title,
        startTime: targetDate,
        endTime,
        category: EventCategory.WORK,
        description: '通过语音创建',
        priority: Priority.MEDIUM
      }

      await this.context.eventStore.addEvent(newEvent)
      
      const timeStr = targetDate.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
      
      this.context.showToast('success', `已创建${title}：${timeStr}`)
    } catch (error) {
      console.error('创建时间事件失败:', error)
      this.context.showToast('error', '创建事件失败，请重试')
    }
  }

  /**
   * 处理帮助命令
   */
  private async handleHelp(matches: string[], fullText: string): Promise<void> {
    const commands = this.processor.getCommandDescriptions()
    const helpText = '可用语音命令：\n' + commands.slice(0, 5).join('\n')
    this.context.showToast('info', helpText)
  }

  /**
   * 处理空闲时间查询
   */
  private async handleFreeTimeQuery(matches: string[], fullText: string): Promise<void> {
    try {
      const today = new Date()
      const events = this.context.eventStore.getEventsByDate(today)
      
      if (events.length === 0) {
        this.context.showToast('info', '今天全天空闲')
        return
      }

      // 简化的空闲时间计算
      const busyHours = events.map((e: Event) => e.startTime.getHours())
      const freeHours = []
      
      for (let hour = 9; hour <= 18; hour++) {
        if (!busyHours.includes(hour)) {
          freeHours.push(hour)
        }
      }

      if (freeHours.length > 0) {
        const freeTimeStr = freeHours.map(h => `${h}:00`).join('、')
        this.context.showToast('info', `空闲时间：${freeTimeStr}`)
      } else {
        this.context.showToast('info', '今天比较忙，没有空闲时间')
      }
    } catch (error) {
      console.error('查询空闲时间失败:', error)
      this.context.showToast('error', '查询失败，请重试')
    }
  }

  /**
   * 处理语音文本
   */
  async processVoiceText(text: string): Promise<boolean> {
    console.log('处理语音命令:', text)
    return await this.processor.processText(text)
  }

  /**
   * 获取命令帮助
   */
  getCommandHelp(): string[] {
    return this.processor.getCommandDescriptions()
  }

  /**
   * 添加自定义命令
   */
  addCustomCommand(command: VoiceCommand): void {
    this.processor.registerCommand(command)
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.processor.clearCommands()
  }
}

// 语音命令快捷方式
export const VOICE_SHORTCUTS = {
  CREATE_EVENT: ['创建事件', '添加事件', '新建事件'],
  CREATE_MEETING: ['创建会议', '添加会议', '安排会议'],
  CREATE_TASK: ['创建任务', '添加任务', '新建任务'],
  QUERY_TODAY: ['今天安排', '今天事件', '今天有什么'],
  QUERY_TOMORROW: ['明天安排', '明天事件', '明天有什么'],
  OPEN_CALENDAR: ['打开日历', '切换日历', '日历页面'],
  OPEN_SCHEDULE: ['打开日程', '切换日程', '日程页面'],
  OPEN_TIMEFLOW: ['打开时间流', '切换时间流', '时间流页面'],
  OPEN_ASSISTANT: ['打开助手', 'AI助手', '语音助手'],
  DELETE_EVENT: ['删除事件', '取消事件', '移除事件'],
  HELP: ['帮助', '指令', '命令列表', '怎么用']
}

// 语音命令模板
export const VOICE_TEMPLATES = {
  TIME_EVENT: '{时间} {事件类型}',
  DATE_EVENT: '{日期} {时间} {事件类型}',
  QUERY_DATE: '{日期} 有什么安排',
  NAVIGATION: '打开 {页面名称}',
  DELETE: '删除 {事件名称}'
}
