import { VoiceRecognitionEngine, VoiceCommand, VoiceResponse } from '../../types/voice'
import { Event, EventCategory, Priority, EventStatus, Reminder, ReminderType } from '../../types/event'

// 扩展Web Speech API类型定义
interface ExtendedWindow extends Window {
  webkitSpeechRecognition?: typeof SpeechRecognition
  SpeechRecognition?: typeof SpeechRecognition
}

declare const window: ExtendedWindow

// 语音识别服务类
export class VoiceService {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis
  private isListening = false
  private onResultCallback?: (result: string) => void
  private onErrorCallback?: (error: string) => void

  constructor() {
    this.synthesis = window.speechSynthesis
    this.initSpeechRecognition()
  }

  // 初始化语音识别
  private initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new window.webkitSpeechRecognition!()
    } else if ('SpeechRecognition' in window) {
      this.recognition = new window.SpeechRecognition!()
    }

    if (this.recognition) {
      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = 'zh-CN'

      this.recognition.onresult = (event) => {
        const result = event.results[0][0].transcript
        // 语音识别结果获取成功
        this.onResultCallback?.(result)
      }

      this.recognition.onerror = (event) => {
        // 语音识别错误
        this.onErrorCallback?.(event.error)
        this.isListening = false
      }

      this.recognition.onend = () => {
        this.isListening = false
      }
    }
  }

  // 开始语音识别
  startListening(onResult: (result: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('浏览器不支持语音识别')
      return
    }

    if (this.isListening) {
      this.stopListening()
      return
    }

    this.onResultCallback = onResult
    this.onErrorCallback = onError

    try {
      this.recognition.start()
      this.isListening = true
    } catch (error) {
      // 启动语音识别失败
      onError?.('启动语音识别失败')
    }
  }

  // 停止语音识别
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  // 语音合成（文字转语音）
  speak(text: string, options?: { lang?: string; rate?: number; pitch?: number }) {
    if (!this.synthesis) {
      // 浏览器不支持语音合成
      return
    }

    // 停止当前播放
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options?.lang || 'zh-CN'
    utterance.rate = options?.rate || 1
    utterance.pitch = options?.pitch || 1

    this.synthesis.speak(utterance)
  }

  // 停止语音播放
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  // 获取当前状态
  getStatus() {
    return {
      isListening: this.isListening,
      isSpeaking: this.synthesis?.speaking || false,
      isSupported: !!this.recognition
    }
  }
}

// 语音命令解析器
export class VoiceCommandParser {
  // 解析语音命令创建事件
  parseCreateEventCommand(text: string): Partial<Event> | null {
    const normalizedText = text.toLowerCase().trim()
    
    // 事件标题提取
    let title = ''
    let description = ''
    let category = EventCategory.OTHER
    let priority = Priority.MEDIUM
    let startTime = new Date()
    let endTime = new Date()
    let reminders: Reminder[] = []

    // 增强的时间解析模式
    const timePatterns = [
      // 基础时间
      /(\\d{1,2})[点时](\\d{0,2})[分]?/g,
      /上午(\\d{1,2})[点时]/g,
      /下午(\\d{1,2})[点时]/g,
      /晚上(\\d{1,2})[点时]/g,
      // 日期相对表达
      /明天/g,
      /后天/g,
      /下周/g,
      /今天/g,
      // 复杂时间表达
      /明天(上午|下午|晚上)(\\d{1,2})[点时]/g,
      /后天(上午|下午|晚上)(\\d{1,2})[点时]/g,
      // 提醒时间表达
      /提前(\\d+)(分钟|小时)/g,
      /提前(\\d+)(分|小时)/g
    ]

    // 增强的类别识别（包含Trading类别）
    if (normalizedText.includes('会议') || normalizedText.includes('开会')) {
      category = EventCategory.MEETING
      title = title || '会议'
    } else if (normalizedText.includes('工作') || normalizedText.includes('项目')) {
      category = EventCategory.WORK
      title = title || '工作任务'
    } else if (normalizedText.includes('运动') || normalizedText.includes('锻炼') || normalizedText.includes('tabata')) {
      category = EventCategory.EXERCISE
      title = title || '运动时间'
    } else if (normalizedText.includes('吃饭') || normalizedText.includes('午餐') || normalizedText.includes('晚餐')) {
      category = EventCategory.MEAL
      title = title || '用餐时间'
    } else if (normalizedText.includes('休息') || normalizedText.includes('break')) {
      category = EventCategory.BREAK
      title = title || '休息时间'
    } else if (normalizedText.includes('出行') || normalizedText.includes('旅行')) {
      category = EventCategory.TRAVEL
      title = title || '出行安排'
    } else if (normalizedText.includes('扫watchlist') || normalizedText.includes('watchlist')) {
      category = EventCategory.TRADING
      title = title || '扫watchlist'
    } else if (normalizedText.includes('key in') || normalizedText.includes('数据录入')) {
      category = EventCategory.TRADING
      title = title || 'key in 数据'
    } else if (normalizedText.includes('捕兽夹')) {
      category = EventCategory.TRADING
      title = title || '捕兽夹'
    } else if (normalizedText.includes('valhalla')) {
      category = EventCategory.TRADING
      title = title || '看valhalla'
    }

    // 优先级识别
    if (normalizedText.includes('紧急') || normalizedText.includes('重要') || normalizedText.includes('urgent')) {
      priority = Priority.URGENT
    } else if (normalizedText.includes('高优先级') || normalizedText.includes('高')) {
      priority = Priority.HIGH
    } else if (normalizedText.includes('低优先级') || normalizedText.includes('低')) {
      priority = Priority.LOW
    }

    // 增强的时间解析
    const now = new Date()
    startTime = this.parseComplexTime(normalizedText, now)
    endTime = new Date(startTime.getTime() + this.getEventDuration(normalizedText, category))
    
    // 解析多重提醒
    reminders = this.parseReminders(normalizedText, startTime)

    // 提取标题
    if (!title) {
      // 去除时间和关键词，提取主要内容作为标题
      title = normalizedText
        .replace(/创建|新建|添加|安排|预约/g, '')
        .replace(/\d{1,2}[点时]\d{0,2}[分]?/g, '')
        .replace(/上午|下午|晚上|明天|后天/g, '')
        .trim()
      
      if (!title) {
        title = '新事件'
      }
    }

    return {
      title,
      description: description || `通过语音创建：${text}`,
      startTime,
      endTime,
      category,
      priority,
      status: EventStatus.PLANNED,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 200, height: 80, depth: 20 },
      color: this.getCategoryColor(category),
      opacity: 0.8,
      isSelected: false,
      isDragging: false,
      isHovered: false,
      isConflicted: false,
      tags: ['语音创建'],
      reminders: []
    }
  }

  // 获取类别对应颜色
  private getCategoryColor(category: EventCategory): string {
    const colors = {
      [EventCategory.WORK]: '#3b82f6',
      [EventCategory.PERSONAL]: '#10b981',
      [EventCategory.MEETING]: '#f59e0b',
      [EventCategory.BREAK]: '#8b5cf6',
      [EventCategory.EXERCISE]: '#ef4444',
      [EventCategory.MEAL]: '#f97316',
      [EventCategory.TRAVEL]: '#06b6d4',
      [EventCategory.OTHER]: '#6b7280',
      // Trading专业类别颜色
      [EventCategory.TRADING]: '#dc2626',        // 红色 - 交易相关
      [EventCategory.LIFE_ROUTINE]: '#059669',   // 绿色 - 生活例程
      [EventCategory.PREPARATION]: '#7c3aed'     // 紫色 - 准备工作
    }
    return colors[category]
  }

  // 解析复杂时间表达
  private parseComplexTime(text: string, baseTime: Date): Date {
    const now = baseTime
    let targetTime = new Date(now)

    // 明天/后天解析
    if (text.includes('明天')) {
      targetTime.setDate(targetTime.getDate() + 1)
    } else if (text.includes('后天')) {
      targetTime.setDate(targetTime.getDate() + 2)
    } else if (text.includes('下周')) {
      targetTime.setDate(targetTime.getDate() + 7)
    }

    // 时间点解析
    const timePatterns = [
      /明天(上午|下午|晚上)(\d{1,2})[点时]/,
      /后天(上午|下午|晚上)(\d{1,2})[点时]/,
      /(上午|下午|晚上)(\d{1,2})[点时]/,
      /(\d{1,2})[点时]/
    ]

    for (const pattern of timePatterns) {
      const match = text.match(pattern)
      if (match) {
        let hour = parseInt(match[match.length - 1]) // 最后一个捕获组是小时
        
        // 处理上午/下午
        if (match.length > 2) {
          const period = match[match.length - 2] // 倒数第二个是时间段
          if (period === '下午' && hour < 12) {
            hour += 12
          } else if (period === '晚上' && hour < 12) {
            hour += 12
          } else if (period === '上午' && hour === 12) {
            hour = 0
          }
        }

        targetTime.setHours(hour, 0, 0, 0)
        break
      }
    }

    // 如果没有找到具体时间，使用默认时间
    if (targetTime.getTime() === now.getTime()) {
      targetTime = new Date(now.getTime() + 60 * 60 * 1000) // 1小时后
    }

    return targetTime
  }

  // 获取事件持续时间（毫秒）
  private getEventDuration(text: string, category: EventCategory): number {
    // Trading任务的特定持续时间
    if (category === EventCategory.TRADING) {
      if (text.includes('扫watchlist') || text.includes('valhalla')) {
        return 5 * 60 * 1000 // 5分钟
      } else if (text.includes('key in') || text.includes('数据录入')) {
        return 2 * 60 * 1000 // 2分钟
      } else if (text.includes('捕兽夹')) {
        if (text.includes('精简')) {
          return 5 * 60 * 1000 // 5分钟
        } else {
          return 30 * 60 * 1000 // 30分钟
        }
      }
    }

    // TABATA锻炼
    if (text.includes('tabata')) {
      return 5 * 60 * 1000 // 5分钟
    }

    // 会议默认时间
    if (category === EventCategory.MEETING) {
      return 60 * 60 * 1000 // 1小时
    }

    // 用餐时间
    if (category === EventCategory.MEAL) {
      return 50 * 60 * 1000 // 50分钟
    }

    // 默认1小时
    return 60 * 60 * 1000
  }

  // 解析多重提醒
  private parseReminders(text: string, startTime: Date): Reminder[] {
    const reminders: Reminder[] = []

    // 解析自定义提醒时间
    const reminderPatterns = [
      /提前(\d+)小时/g,
      /提前(\d+)分钟/g,
      /提前(\d+)分/g
    ]

    for (const pattern of reminderPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const amount = parseInt(match[1])
        const unit = match[0].includes('小时') ? 'hours' : 'minutes'
        const minutes = unit === 'hours' ? amount * 60 : amount

        reminders.push({
          id: `custom-${minutes}m`,
          eventId: '',
          type: ReminderType.NOTIFICATION,
          time: new Date(startTime.getTime() - minutes * 60 * 1000),
          message: `${minutes}分钟后开始`,
          isTriggered: false
        })
      }
    }

    // 如果没有自定义提醒，添加默认的30分钟+5分钟提醒
    if (reminders.length === 0) {
      reminders.push(
        {
          id: 'default-30m',
          eventId: '',
          type: ReminderType.NOTIFICATION,
          time: new Date(startTime.getTime() - 30 * 60 * 1000),
          message: '30分钟后开始',
          isTriggered: false
        },
        {
          id: 'default-5m',
          eventId: '',
          type: ReminderType.NOTIFICATION,
          time: new Date(startTime.getTime() - 5 * 60 * 1000),
          message: '5分钟后开始',
          isTriggered: false
        }
      )
    }

    return reminders
  }

  // 解析其他语音命令
  parseCommand(text: string): VoiceCommand | null {
    const normalizedText = text.toLowerCase().trim()

    // 创建事件命令
    if (normalizedText.includes('创建') || normalizedText.includes('新建') || normalizedText.includes('添加')) {
      return {
        type: 'create_event',
        parameters: { text: normalizedText },
        confidence: 0.8
      }
    }

    // 查看命令
    if (normalizedText.includes('查看') || normalizedText.includes('显示')) {
      return {
        type: 'view_events',
        parameters: { filter: normalizedText },
        confidence: 0.7
      }
    }

    // 删除命令
    if (normalizedText.includes('删除') || normalizedText.includes('取消')) {
      return {
        type: 'delete_event',
        parameters: { text: normalizedText },
        confidence: 0.6
      }
    }

    // 切换视图命令
    if (normalizedText.includes('切换') || normalizedText.includes('改变视图')) {
      return {
        type: 'switch_view',
        parameters: { view: normalizedText.includes('传统') ? 'calendar' : 'flow' },
        confidence: 0.9
      }
    }

    return null
  }
}

// 创建全局实例
export const voiceService = new VoiceService()
export const voiceCommandParser = new VoiceCommandParser()
