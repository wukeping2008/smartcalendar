import { WsToolsUtils, WsTranscriptionClient, WsSpeechClient } from '@coze/api/ws-tools'
import type { TranscriptionsMessageUpdateEvent } from '@coze/api'
import { WebsocketsEventType } from '@coze/api'
import { COZE_CONFIG } from '@/config/voiceAssistant'
import type { AudioDeviceInfo } from '@/types/voiceAssistant'

export class AudioService {
    private transcriptionClient: WsTranscriptionClient | null = null
    private speechClient: WsSpeechClient | null = null
    private isInitialized = false

    constructor() {
        this.checkPermissions()
    }

    // 检查设备权限
    private async checkPermissions(): Promise<boolean> {
        try {
            const permission = await WsToolsUtils.checkDevicePermission()
            if (!permission.audio) {
                console.warn('麦克风权限未授予')
                return false
            }
            return true
        } catch (error) {
            console.error('检查权限失败:', error)
            return false
        }
    }

    // 获取音频设备列表
    async getAudioDevices(): Promise<AudioDeviceInfo> {
        try {
            return await WsToolsUtils.getAudioDevices()
        } catch (error) {
            console.error('获取音频设备失败:', error)
            return { audioInputs: [], audioOutputs: [] }
        }
    }

    // 初始化语音识别客户端
    async initTranscription(deviceId?: string): Promise<void> {
        try {
            const hasPermission = await this.checkPermissions()
            if (!hasPermission) {
                throw new Error('没有麦克风权限')
            }

            // 如果没有指定设备ID，获取默认设备
            let targetDeviceId = deviceId
            if (!targetDeviceId) {
                const devices = await this.getAudioDevices()
                if (devices.audioInputs.length > 0) {
                    targetDeviceId = devices.audioInputs[0].deviceId
                } else {
                    throw new Error('没有找到可用的音频输入设备')
                }
            }

            this.transcriptionClient = new WsTranscriptionClient({
                token: COZE_CONFIG.ACCESS_TOKEN,
                allowPersonalAccessTokenInBrowser: true,
                deviceId: targetDeviceId,
                debug: false
            })

            console.log('语音识别客户端初始化成功')
        } catch (error) {
            console.error('初始化语音识别失败:', error)
            throw error
        }
    }

    // 初始化语音合成客户端
    async initSynthesis(): Promise<void> {
        try {
            if (!COZE_CONFIG.ACCESS_TOKEN) {
                throw new Error('请先配置个人访问令牌')
            }

            this.speechClient = new WsSpeechClient({
                token: COZE_CONFIG.ACCESS_TOKEN,
                allowPersonalAccessTokenInBrowser: true,
                debug: false
            })

            console.log('语音合成客户端初始化成功')
        } catch (error) {
            console.error('初始化语音合成失败:', error)
            throw error
        }
    }

    // 开始录音转写
    async startTranscription(): Promise<void> {
        if (!this.transcriptionClient) {
            throw new Error('语音识别客户端未初始化')
        }

        try {
            await this.transcriptionClient.start()
            console.log('开始语音识别')
        } catch (error) {
            console.error('开始语音识别失败:', error)
            throw error
        }
    }

    // 停止录音转写
    async stopTranscription(): Promise<void> {
        if (this.transcriptionClient) {
            try {
                await this.transcriptionClient.stop()
                console.log('停止语音识别')
            } catch (error) {
                console.error('停止语音识别失败:', error)
                throw error
            }
        }
    }

    // 语音合成播放
    async synthesizeAndPlay(text: string, voiceId?: string): Promise<void> {
        if (!this.speechClient) {
            await this.initSynthesis()
        }

        try {
            await this.speechClient!.connect({
                voiceId: voiceId || COZE_CONFIG.DEFAULT_VOICE_ID
            })

            this.speechClient!.appendAndComplete(text)
            console.log('开始语音合成播放:', text.substring(0, 50) + '...')
        } catch (error) {
            console.error('语音合成播放失败:', error)
            throw error
        }
    }

    // 暂停语音播放
    async pauseSynthesis(): Promise<void> {
        if (this.speechClient) {
            try {
                await this.speechClient.pause()
            } catch (error) {
                console.error('暂停语音播放失败:', error)
                throw error
            }
        }
    }

    // 恢复语音播放
    async resumeSynthesis(): Promise<void> {
        if (this.speechClient) {
            try {
                await this.speechClient.resume()
            } catch (error) {
                console.error('恢复语音播放失败:', error)
                throw error
            }
        }
    }

    // 中断语音播放
    async interruptSynthesis(): Promise<void> {
        if (this.speechClient) {
            try {
                await this.speechClient.interrupt()
            } catch (error) {
                console.error('中断语音播放失败:', error)
                throw error
            }
        }
    }

    // 监听转写结果
    onTranscriptionUpdate(callback: (text: string) => void): void {
        if (!this.transcriptionClient) {
            console.warn('语音识别客户端未初始化')
            return
        }

        this.transcriptionClient.on(
            WebsocketsEventType.TRANSCRIPTIONS_MESSAGE_UPDATE,
            (event: TranscriptionsMessageUpdateEvent) => {
                const transcriptionText = event.data.content
                callback(transcriptionText)
            }
        )
    }

    // 监听错误事件
    onError(callback: (error: unknown) => void): void {
        if (this.transcriptionClient) {
            this.transcriptionClient.on(WebsocketsEventType.ERROR, callback)
        }
        // 可以添加语音合成的错误监听
    }

    // 获取可用语音列表
    async getAvailableVoices(): Promise<any[]> {
        try {
            // 这里需要根据实际的 Coze API 来实现
            // 暂时返回空数组，后续可以扩展
            return []
        } catch (error) {
            console.error('获取语音列表失败:', error)
            return []
        }
    }

    // 检查服务状态
    getStatus(): {
        transcriptionReady: boolean
        synthesisReady: boolean
        hasPermission: boolean
    } {
        return {
            transcriptionReady: !!this.transcriptionClient,
            synthesisReady: !!this.speechClient,
            hasPermission: this.isInitialized
        }
    }

    // 清理资源
    destroy(): void {
        try {
            if (this.transcriptionClient) {
                this.transcriptionClient.destroy()
                this.transcriptionClient = null
            }

            if (this.speechClient) {
                this.speechClient.disconnect()
                this.speechClient = null
            }

            console.log('音频服务资源已清理')
        } catch (error) {
            console.error('清理音频服务资源失败:', error)
        }
    }
}

// 单例模式
let audioServiceInstance: AudioService | null = null

export const getAudioService = (): AudioService => {
    if (!audioServiceInstance) {
        audioServiceInstance = new AudioService()
    }
    return audioServiceInstance
}
