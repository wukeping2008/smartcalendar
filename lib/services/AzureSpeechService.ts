import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'
import type { IAudioService, AudioDeviceInfo, VoiceInfo } from './IAudioService'

export class AzureSpeechService implements IAudioService {
  private speechConfig: SpeechSDK.SpeechConfig | null = null
  private audioConfig: SpeechSDK.AudioConfig | null = null
  private recognizer: SpeechSDK.SpeechRecognizer | null = null
  private synthesizer: SpeechSDK.SpeechSynthesizer | null = null
  private isInitialized = false
  private transcriptionCallback?: (text: string, isFinal: boolean) => void
  private errorCallback?: (error: unknown) => void

  constructor(speechKey?: string, speechRegion?: string) {
    const key = speechKey || process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || ''
    const region = speechRegion || process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || 'southeastasia'
    
    if (key && region) {
      this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region)
      this.speechConfig.speechRecognitionLanguage = 'zh-CN'
    }
    
    this.checkPermissions()
  }

  private async checkPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      this.isInitialized = true
      return true
    } catch (error) {
      // 检查权限失败
      return false
    }
  }

  async getAudioDevices(): Promise<AudioDeviceInfo> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
      return { audioInputs, audioOutputs }
    } catch (error) {
      // 获取音频设备失败
      return { audioInputs: [], audioOutputs: [] }
    }
  }

  async initTranscription(deviceId?: string): Promise<void> {
    if (!this.speechConfig) {
      throw new Error('Azure Speech Config未初始化，请检查API密钥和区域配置')
    }

    const hasPermission = await this.checkPermissions()
    if (!hasPermission) {
      throw new Error('没有麦克风权限')
    }

    if (deviceId) {
      this.audioConfig = SpeechSDK.AudioConfig.fromMicrophoneInput(deviceId)
    } else {
      this.audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
    }

    this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, this.audioConfig)
    this.setupRecognitionEvents()
    
    // Azure 语音识别客户端初始化成功
  }

  private setupRecognitionEvents(): void {
    if (!this.recognizer) return

    this.recognizer.recognizing = (sender, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech && this.transcriptionCallback) {
        this.transcriptionCallback(e.result.text, false)
      }
    }

    this.recognizer.recognized = (sender, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && this.transcriptionCallback) {
        this.transcriptionCallback(e.result.text, true)
      }
    }

    this.recognizer.canceled = (sender, e) => {
      // 语音识别取消
      if (this.errorCallback) {
        this.errorCallback(new Error(`语音识别错误: ${e.errorDetails}`))
      }
    }
  }

  async initSynthesis(): Promise<void> {
    if (!this.speechConfig) {
      throw new Error('Azure Speech Config未初始化')
    }

    this.synthesizer = new SpeechSDK.SpeechSynthesizer(this.speechConfig)
    // Azure 语音合成客户端初始化成功
  }

  async startTranscription(): Promise<void> {
    if (!this.recognizer) {
      throw new Error('Azure 语音识别客户端未初始化')
    }

    await new Promise<void>((resolve, reject) => {
      this.recognizer!.startContinuousRecognitionAsync(
        () => {
          // 开始 Azure 语音识别
          resolve()
        },
        (error) => {
          // 开始 Azure 语音识别失败
          reject(new Error(error))
        }
      )
    })
  }

  async stopTranscription(): Promise<void> {
    if (this.recognizer) {
      await new Promise<void>((resolve, reject) => {
        this.recognizer!.stopContinuousRecognitionAsync(
          () => {
            // 停止 Azure 语音识别
            resolve()
          },
          (error) => {
            // 停止 Azure 语音识别失败
            reject(new Error(error))
          }
        )
      })
    }
  }

  async synthesizeAndPlay(text: string, voiceId?: string): Promise<void> {
    if (!this.synthesizer) {
      await this.initSynthesis()
    }

    if (!text.trim()) {
      throw new Error('合成文本不能为空')
    }

    const voiceName = voiceId || 'zh-CN-XiaoxiaoNeural'
    
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="${voiceName}">
          <prosody rate="0.9" pitch="+0Hz">
            ${this.escapeXml(text)}
          </prosody>
        </voice>
      </speak>
    `

    await new Promise<void>((resolve, reject) => {
      this.synthesizer!.speakSsmlAsync(
        ssml,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            // Azure 语音合成播放成功
            resolve()
          } else {
            reject(new Error(`语音合成失败: ${result.errorDetails}`))
          }
        },
        (error) => {
          reject(new Error(error))
        }
      )
    })
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  async pauseSynthesis(): Promise<void> {
    // Azure Speech SDK 不直接支持暂停/恢复
  }

  async resumeSynthesis(): Promise<void> {
    // Azure Speech SDK 不直接支持暂停/恢复
  }

  async interruptSynthesis(): Promise<void> {
    if (this.synthesizer) {
      this.synthesizer.close()
      await this.initSynthesis()
    }
  }

  onTranscriptionUpdate(callback: (text: string, isFinal: boolean) => void): void {
    this.transcriptionCallback = callback
  }

  onError(callback: (error: unknown) => void): void {
    this.errorCallback = callback
  }

  async getAvailableVoices(): Promise<VoiceInfo[]> {
    // Mock implementation to satisfy the interface
    return [
      {
        id: 'zh-CN-XiaoxiaoNeural',
        name: 'zh-CN-XiaoxiaoNeural',
        language: 'zh-CN',
        gender: 'female',
        locale: 'zh-CN',
        isDefault: true,
      },
      {
        id: 'zh-CN-YunxiNeural',
        name: 'zh-CN-YunxiNeural',
        language: 'zh-CN',
        gender: 'male',
        locale: 'zh-CN',
      },
    ];
  }

  getStatus(): {
    transcriptionReady: boolean
    synthesisReady: boolean
    hasPermission: boolean
  } {
    return {
      transcriptionReady: !!this.recognizer,
      synthesisReady: !!this.synthesizer,
      hasPermission: this.isInitialized
    }
  }

  destroy(): void {
    try {
      if (this.recognizer) {
        this.recognizer.close()
        this.recognizer = null
      }

      if (this.synthesizer) {
        this.synthesizer.close()
        this.synthesizer = null
      }

      // Azure 音频服务资源已清理
    } catch (error) {
      // 清理 Azure 音频服务资源失败
    }
  }
}
