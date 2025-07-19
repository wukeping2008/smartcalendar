/**
 * 增强版语音服务
 * 结合Web Speech API和专业语音SDK的优势
 */

export interface VoiceServiceConfig {
  deviceId?: string
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

export interface AudioDevice {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

export interface VoiceRecognitionResult {
  text: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

export class VoiceService {
  private recognition: any = null
  private synthesis: SpeechSynthesis | null = null
  private isInitialized = false
  private currentStream: MediaStream | null = null
  
  // 事件回调
  private onResultCallback?: (result: VoiceRecognitionResult) => void
  private onErrorCallback?: (error: Error) => void
  private onStartCallback?: () => void
  private onEndCallback?: () => void

  constructor(private config: VoiceServiceConfig = {}) {
    this.initializeServices()
  }

  /**
   * 初始化语音服务
   */
  private async initializeServices(): Promise<void> {
    try {
      // 检查浏览器支持
      if (!this.checkBrowserSupport()) {
        throw new Error('浏览器不支持语音功能')
      }

      // 初始化语音识别
      await this.initSpeechRecognition()
      
      // 初始化语音合成
      this.initSpeechSynthesis()
      
      this.isInitialized = true
      console.log('语音服务初始化成功')
    } catch (error) {
      console.error('语音服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 检查浏览器支持
   */
  private checkBrowserSupport(): boolean {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    const hasSynthesis = 'speechSynthesis' in window
    return hasRecognition && hasSynthesis
  }

  /**
   * 初始化语音识别
   */
  private async initSpeechRecognition(): Promise<void> {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
    
    // 配置语音识别
    this.recognition.continuous = this.config.continuous ?? false
    this.recognition.interimResults = this.config.interimResults ?? true
    this.recognition.lang = this.config.language ?? 'zh-CN'
    
    // 设置事件监听
    this.recognition.onstart = () => {
      console.log('语音识别开始')
      this.onStartCallback?.()
    }
    
    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      const confidence = result[0].confidence
      
      const voiceResult: VoiceRecognitionResult = {
        text: transcript,
        confidence: confidence || 0.9,
        isFinal: result.isFinal,
        timestamp: Date.now()
      }
      
      this.onResultCallback?.(voiceResult)
    }
    
    this.recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      const error = new Error(`语音识别错误: ${event.error}`)
      this.onErrorCallback?.(error)
    }
    
    this.recognition.onend = () => {
      console.log('语音识别结束')
      this.onEndCallback?.()
    }
  }

  /**
   * 初始化语音合成
   */
  private initSpeechSynthesis(): void {
    this.synthesis = window.speechSynthesis
  }

  /**
   * 检查麦克风权限
   */
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('麦克风权限检查失败:', error)
      return false
    }
  }

  /**
   * 获取音频设备列表
   */
  async getAudioDevices(): Promise<AudioDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
        .filter(device => device.kind === 'audioinput' || device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
          kind: device.kind as 'audioinput' | 'audiooutput'
        }))
    } catch (error) {
      console.error('获取音频设备失败:', error)
      return []
    }
  }

  /**
   * 开始语音识别
   */
  async startRecognition(): Promise<void> {
    if (!this.isInitialized || !this.recognition) {
      throw new Error('语音服务未初始化')
    }

    // 检查权限
    const hasPermission = await this.checkMicrophonePermission()
    if (!hasPermission) {
      throw new Error('没有麦克风权限')
    }

    try {
      this.recognition.start()
    } catch (error) {
      console.error('开始语音识别失败:', error)
      throw error
    }
  }

  /**
   * 停止语音识别
   */
  stopRecognition(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  /**
   * 语音合成
   */
  async speak(text: string, options: {
    voice?: SpeechSynthesisVoice
    rate?: number
    pitch?: number
    volume?: number
  } = {}): Promise<void> {
    if (!this.synthesis) {
      throw new Error('语音合成服务未初始化')
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // 设置语音参数
      utterance.rate = options.rate ?? 0.9
      utterance.pitch = options.pitch ?? 1
      utterance.volume = options.volume ?? 1
      utterance.lang = 'zh-CN'
      
      if (options.voice) {
        utterance.voice = options.voice
      }
      
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`语音合成失败: ${event.error}`))
      
      this.synthesis!.speak(utterance)
    })
  }

  /**
   * 停止语音合成
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  /**
   * 暂停语音合成
   */
  pauseSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.pause()
    }
  }

  /**
   * 恢复语音合成
   */
  resumeSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.resume()
    }
  }

  /**
   * 获取可用语音列表
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  /**
   * 设置事件监听器
   */
  onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResultCallback = callback
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback
  }

  onStart(callback: () => void): void {
    this.onStartCallback = callback
  }

  onEnd(callback: () => void): void {
    this.onEndCallback = callback
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    isInitialized: boolean
    isRecognitionSupported: boolean
    isSynthesisSupported: boolean
    hasPermission: boolean
  } {
    return {
      isInitialized: this.isInitialized,
      isRecognitionSupported: !!this.recognition,
      isSynthesisSupported: !!this.synthesis,
      hasPermission: false // 需要异步检查
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    try {
      this.stopRecognition()
      this.stopSpeaking()
      
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop())
        this.currentStream = null
      }
      
      this.recognition = null
      this.synthesis = null
      this.isInitialized = false
      
      console.log('语音服务资源已清理')
    } catch (error) {
      console.error('清理语音服务资源失败:', error)
    }
  }
}

// 单例模式
let voiceServiceInstance: VoiceService | null = null

export const getVoiceService = (config?: VoiceServiceConfig): VoiceService => {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(config)
  }
  return voiceServiceInstance
}

// 语音命令处理器
export interface VoiceCommand {
  pattern: RegExp | string
  handler: (matches: string[], fullText: string) => Promise<void> | void
  description: string
  priority?: number
}

export class VoiceCommandProcessor {
  private commands: VoiceCommand[] = []

  /**
   * 注册语音命令
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.push(command)
    // 按优先级排序
    this.commands.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }

  /**
   * 处理语音文本
   */
  async processText(text: string): Promise<boolean> {
    const normalizedText = text.toLowerCase().trim()
    
    for (const command of this.commands) {
      let matches: string[] = []
      let isMatch = false
      
      if (command.pattern instanceof RegExp) {
        const regexMatch = normalizedText.match(command.pattern)
        if (regexMatch) {
          matches = Array.from(regexMatch)
          isMatch = true
        }
      } else {
        if (normalizedText.includes(command.pattern.toLowerCase())) {
          matches = [command.pattern]
          isMatch = true
        }
      }
      
      if (isMatch) {
        try {
          await command.handler(matches, text)
          return true
        } catch (error) {
          console.error('执行语音命令失败:', error)
        }
      }
    }
    
    return false
  }

  /**
   * 获取所有命令描述
   */
  getCommandDescriptions(): string[] {
    return this.commands.map(cmd => cmd.description)
  }

  /**
   * 清空所有命令
   */
  clearCommands(): void {
    this.commands = []
  }
}
