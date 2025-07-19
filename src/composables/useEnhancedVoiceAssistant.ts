/**
 * 增强版语音助手组合式API
 * 集成语音命令管理器和事件存储
 */

import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/eventStore'
import { getVoiceService } from '@/services/VoiceService'
import { VoiceCommandManager, type CommandContext } from '@/services/VoiceCommandManager'
import type { VoiceRecognitionResult } from '@/services/VoiceService'

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export interface VoiceMessage {
  id: string
  content: string
  type: 'user' | 'assistant' | 'command'
  timestamp: number
  isCommand?: boolean
  commandResult?: string
}

export function useEnhancedVoiceAssistant() {
  const router = useRouter()
  const eventStore = useEventStore()
  const voiceService = getVoiceService()
  
  // 状态管理
  const isRecording = ref(false)
  const isProcessing = ref(false)
  const currentTranscription = ref('')
  const error = ref<string | null>(null)
  const messages = ref<VoiceMessage[]>([])
  const toastMessages = ref<ToastMessage[]>([])
  
  // 语音命令管理器
  let commandManager: VoiceCommandManager | null = null

  // 初始化
  const initialize = async () => {
    try {
      error.value = null
      
      // 检查麦克风权限
      const hasPermission = await voiceService.checkMicrophonePermission()
      if (!hasPermission) {
        throw new Error('需要麦克风权限才能使用语音功能')
      }

      // 创建命令上下文
      const commandContext: CommandContext = {
        router,
        eventStore,
        showToast
      }

      // 初始化语音命令管理器
      commandManager = new VoiceCommandManager(commandContext)

      // 设置语音服务事件监听
      setupVoiceEventListeners()

      console.log('增强版语音助手初始化成功')
      showToast('success', '语音助手已就绪')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      error.value = `初始化失败: ${errorMessage}`
      showToast('error', errorMessage)
      console.error('语音助手初始化失败:', err)
    }
  }

  // 设置语音事件监听
  const setupVoiceEventListeners = () => {
    // 监听语音识别结果
    voiceService.onResult((result: VoiceRecognitionResult) => {
      currentTranscription.value = result.text
      
      if (result.isFinal) {
        processVoiceInput(result.text)
      }
    })

    // 监听错误
    voiceService.onError((err: Error) => {
      error.value = err.message
      showToast('error', `语音识别错误: ${err.message}`)
      isRecording.value = false
      isProcessing.value = false
    })

    // 监听开始
    voiceService.onStart(() => {
      isRecording.value = true
      currentTranscription.value = ''
      error.value = null
    })

    // 监听结束
    voiceService.onEnd(() => {
      isRecording.value = false
    })
  }

  // 处理语音输入
  const processVoiceInput = async (text: string) => {
    if (!text.trim() || !commandManager) return

    try {
      isProcessing.value = true
      
      // 添加用户消息
      const userMessage: VoiceMessage = {
        id: generateId(),
        content: text,
        type: 'user',
        timestamp: Date.now()
      }
      messages.value.push(userMessage)

      // 尝试处理为语音命令
      const isCommand = await commandManager.processVoiceText(text)
      
      if (isCommand) {
        // 添加命令执行消息
        const commandMessage: VoiceMessage = {
          id: generateId(),
          content: '命令已执行',
          type: 'command',
          timestamp: Date.now(),
          isCommand: true,
          commandResult: '✓ 语音命令执行成功'
        }
        messages.value.push(commandMessage)
        
        // 语音反馈
        await voiceService.speak('好的，已为您执行')
      } else {
        // 如果不是命令，提供帮助信息
        const helpMessage: VoiceMessage = {
          id: generateId(),
          content: '抱歉，我没有理解您的指令。您可以说"帮助"查看可用命令。',
          type: 'assistant',
          timestamp: Date.now()
        }
        messages.value.push(helpMessage)
        
        await voiceService.speak('抱歉，我没有理解您的指令。您可以说帮助查看可用命令。')
      }
    } catch (err) {
      console.error('处理语音输入失败:', err)
      showToast('error', '处理语音输入失败')
    } finally {
      isProcessing.value = false
      currentTranscription.value = ''
    }
  }

  // 开始录音
  const startRecording = async () => {
    try {
      await voiceService.startRecognition()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '开始录音失败'
      error.value = errorMessage
      showToast('error', errorMessage)
    }
  }

  // 停止录音
  const stopRecording = async () => {
    try {
      voiceService.stopRecognition()
    } catch (err) {
      console.error('停止录音失败:', err)
    }
  }

  // 切换录音状态
  const toggleRecording = async () => {
    if (isRecording.value) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  // 发送文本命令
  const sendTextCommand = async (text: string) => {
    if (!commandManager) return

    try {
      isProcessing.value = true
      
      // 添加用户消息
      const userMessage: VoiceMessage = {
        id: generateId(),
        content: text,
        type: 'user',
        timestamp: Date.now()
      }
      messages.value.push(userMessage)

      // 处理命令
      const isCommand = await commandManager.processVoiceText(text)
      
      if (isCommand) {
        const commandMessage: VoiceMessage = {
          id: generateId(),
          content: '命令已执行',
          type: 'command',
          timestamp: Date.now(),
          isCommand: true,
          commandResult: '✓ 文本命令执行成功'
        }
        messages.value.push(commandMessage)
      } else {
        showToast('warning', '未识别的命令')
      }
    } catch (err) {
      console.error('发送文本命令失败:', err)
      showToast('error', '命令执行失败')
    } finally {
      isProcessing.value = false
    }
  }

  // 播放语音回复
  const playResponse = async (text: string) => {
    try {
      await voiceService.speak(text)
    } catch (err) {
      console.error('播放语音失败:', err)
      showToast('error', '语音播放失败')
    }
  }

  // 显示提示消息
  const showToast = (type: ToastMessage['type'], message: string, duration = 3000) => {
    const toast: ToastMessage = {
      type,
      message,
      duration
    }
    toastMessages.value.push(toast)
    
    // 自动移除
    setTimeout(() => {
      const index = toastMessages.value.indexOf(toast)
      if (index > -1) {
        toastMessages.value.splice(index, 1)
      }
    }, duration)
  }

  // 清空消息历史
  const clearHistory = () => {
    messages.value = []
    currentTranscription.value = ''
    error.value = null
  }

  // 获取可用命令帮助
  const getCommandHelp = (): string[] => {
    return commandManager?.getCommandHelp() || []
  }

  // 获取服务状态
  const getStatus = () => {
    const voiceStatus = voiceService.getStatus()
    return {
      isInitialized: voiceStatus.isInitialized,
      hasPermission: voiceStatus.hasPermission,
      isRecognitionSupported: voiceStatus.isRecognitionSupported,
      isSynthesisSupported: voiceStatus.isSynthesisSupported,
      overall: voiceStatus.isInitialized && voiceStatus.isRecognitionSupported && voiceStatus.isSynthesisSupported
    }
  }

  // 获取音频设备
  const getAudioDevices = async () => {
    try {
      return await voiceService.getAudioDevices()
    } catch (err) {
      console.error('获取音频设备失败:', err)
      return []
    }
  }

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 生命周期管理
  onMounted(() => {
    initialize()
  })

  onUnmounted(() => {
    // 清理资源
    if (isRecording.value) {
      stopRecording()
    }
    voiceService.destroy()
    commandManager?.destroy()
  })

  return {
    // 状态
    isRecording,
    isProcessing,
    currentTranscription,
    error,
    messages,
    toastMessages,

    // 方法
    initialize,
    startRecording,
    stopRecording,
    toggleRecording,
    sendTextCommand,
    playResponse,
    clearHistory,
    getCommandHelp,
    getStatus,
    getAudioDevices,
    showToast,

    // 服务实例
    voiceService,
    commandManager
  }
}

// 快捷命令预设
export const QUICK_COMMANDS = [
  { id: 'today', label: '今天安排', text: '今天有什么安排' },
  { id: 'tomorrow', label: '明天空闲', text: '明天有空闲时间吗' },
  { id: 'create-event', label: '创建事件', text: '创建一个新事件' },
  { id: 'create-meeting', label: '创建会议', text: '创建一个会议' },
  { id: 'delete-event', label: '删除事件', text: '删除最近的事件' },
  { id: 'help', label: '帮助', text: '帮助' },
  { id: 'calendar', label: '打开日历', text: '打开日历' },
  { id: 'timeflow', label: '时间流', text: '打开时间流' },
  { id: 'free-time', label: '空闲时间', text: '什么时候有空' }
]
