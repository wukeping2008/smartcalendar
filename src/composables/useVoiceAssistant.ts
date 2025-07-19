import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { getAudioService } from '@/services/audio/AudioService'
import { getAIService } from '@/services/ai/AIService'
import type { 
    Message, 
    VoiceAssistantConfig, 
    AudioDeviceInfo,
    TranscriptionResult 
} from '@/types/voiceAssistant'
import { COZE_CONFIG, DEFAULT_VOICE_ASSISTANT_CONFIG } from '@/config/voiceAssistant'

export function useVoiceAssistant(config: Partial<VoiceAssistantConfig> = {}) {
    // 服务实例
    const audioService = getAudioService()
    const aiService = getAIService()
    
    // 配置
    const assistantConfig = reactive({
        ...DEFAULT_VOICE_ASSISTANT_CONFIG,
        ...config
    })
    
    // 状态管理
    const isRecording = ref(false)
    const isPlaying = ref(false)
    const isProcessing = ref(false)
    const currentTranscription = ref('')
    const lastResponse = ref('')
    const error = ref<string | null>(null)
    
    // 设备信息
    const audioDevices = ref<AudioDeviceInfo>({ audioInputs: [], audioOutputs: [] })
    const selectedDeviceId = ref<string>('')
    
    // 消息历史
    const messages = ref<Message[]>([])
    const conversationHistory = ref<any[]>([])
    
    // 初始化
    const initialize = async () => {
        try {
            error.value = null
            
            // 获取音频设备
            audioDevices.value = await audioService.getAudioDevices()
            
            // 设置默认设备
            if (audioDevices.value.audioInputs.length > 0 && !selectedDeviceId.value) {
                selectedDeviceId.value = audioDevices.value.audioInputs[0].deviceId
            }
            
            // 初始化语音识别
            await audioService.initTranscription(selectedDeviceId.value)
            
            // 初始化语音合成
            await audioService.initSynthesis()
            
            // 设置事件监听
            setupEventListeners()
            
            console.log('语音助手初始化成功')
        } catch (err) {
            error.value = `初始化失败: ${err instanceof Error ? err.message : '未知错误'}`
            console.error('语音助手初始化失败:', err)
        }
    }
    
    // 设置事件监听
    const setupEventListeners = () => {
        // 监听转写结果
        audioService.onTranscriptionUpdate((text: string) => {
            currentTranscription.value = text
        })
        
        // 监听错误
        audioService.onError((err: unknown) => {
            error.value = `语音服务错误: ${err}`
            console.error('语音服务错误:', err)
        })
    }
    
    // 开始录音
    const startRecording = async () => {
        try {
            error.value = null
            currentTranscription.value = ''
            
            await audioService.startTranscription()
            isRecording.value = true
            
            console.log('开始录音')
        } catch (err) {
            error.value = `开始录音失败: ${err instanceof Error ? err.message : '未知错误'}`
            console.error('开始录音失败:', err)
        }
    }
    
    // 停止录音
    const stopRecording = async () => {
        try {
            await audioService.stopTranscription()
            isRecording.value = false
            
            // 如果有转写结果，处理它
            if (currentTranscription.value.trim()) {
                await processTranscription(currentTranscription.value)
            }
            
            console.log('停止录音')
        } catch (err) {
            error.value = `停止录音失败: ${err instanceof Error ? err.message : '未知错误'}`
            console.error('停止录音失败:', err)
        }
    }
    
    // 处理转写结果
    const processTranscription = async (text: string) => {
        try {
            isProcessing.value = true
            error.value = null
            
            // 添加用户消息到历史
            const userMessage: Message = {
                id: Date.now().toString(),
                content: text,
                type: 'text',
                source: 'user',
                timestamp: Date.now()
            }
            messages.value.push(userMessage)
            
            // 准备对话历史
            const chatHistory = messages.value.map(msg => ({
                role: (msg.source === 'user' ? 'user' : 'assistant') as 'user' | 'assistant' | 'system',
                content: msg.content,
                content_type: 'text'
            }))
            
            // 发送到AI服务处理
            const response = await aiService.chat(chatHistory, assistantConfig.botId)
            lastResponse.value = response
            
            // 添加AI回复到历史
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: response,
                type: 'text',
                source: 'ai',
                timestamp: Date.now()
            }
            messages.value.push(aiMessage)
            
            // 如果启用自动播放，播放回复
            if (assistantConfig.autoPlay) {
                await playResponse(response)
            }
            
        } catch (err) {
            error.value = `处理语音失败: ${err instanceof Error ? err.message : '未知错误'}`
            console.error('处理语音失败:', err)
        } finally {
            isProcessing.value = false
        }
    }
    
    // 播放回复
    const playResponse = async (text: string) => {
        try {
            isPlaying.value = true
            await audioService.synthesizeAndPlay(text, assistantConfig.voiceId)
        } catch (err) {
            error.value = `播放回复失败: ${err instanceof Error ? err.message : '未知错误'}`
            console.error('播放回复失败:', err)
        } finally {
            isPlaying.value = false
        }
    }
    
    // 暂停播放
    const pausePlaying = async () => {
        try {
            await audioService.pauseSynthesis()
        } catch (err) {
            console.error('暂停播放失败:', err)
        }
    }
    
    // 恢复播放
    const resumePlaying = async () => {
        try {
            await audioService.resumeSynthesis()
        } catch (err) {
            console.error('恢复播放失败:', err)
        }
    }
    
    // 停止播放
    const stopPlaying = async () => {
        try {
            await audioService.interruptSynthesis()
            isPlaying.value = false
        } catch (err) {
            console.error('停止播放失败:', err)
        }
    }
    
    // 切换设备
    const switchDevice = async (deviceId: string) => {
        try {
            selectedDeviceId.value = deviceId
            await audioService.initTranscription(deviceId)
            console.log('切换设备成功:', deviceId)
        } catch (err) {
            error.value = `切换设备失败: ${err instanceof Error ? err.message : '未知错误'}`
            console.error('切换设备失败:', err)
        }
    }
    
    // 发送文本消息
    const sendTextMessage = async (text: string) => {
        try {
            currentTranscription.value = text
            await processTranscription(text)
        } catch (err) {
            error.value = `发送消息失败: ${err instanceof Error ? err.message : '未知错误'}`
            console.error('发送消息失败:', err)
        }
    }
    
    // 清空对话历史
    const clearHistory = () => {
        messages.value = []
        conversationHistory.value = []
        currentTranscription.value = ''
        lastResponse.value = ''
        error.value = null
    }
    
    // 获取服务状态
    const getStatus = () => {
        const audioStatus = audioService.getStatus()
        const aiReady = aiService.isReady()
        
        return {
            audio: audioStatus,
            ai: { isReady: aiReady },
            overall: audioStatus.transcriptionReady && audioStatus.synthesisReady && aiReady
        }
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
        if (isPlaying.value) {
            stopPlaying()
        }
        audioService.destroy()
    })
    
    return {
        // 状态
        isRecording,
        isPlaying,
        isProcessing,
        currentTranscription,
        lastResponse,
        error,
        messages,
        audioDevices,
        selectedDeviceId,
        assistantConfig,
        
        // 方法
        initialize,
        startRecording,
        stopRecording,
        playResponse,
        pausePlaying,
        resumePlaying,
        stopPlaying,
        switchDevice,
        sendTextMessage,
        clearHistory,
        getStatus,
        
        // 服务实例（用于高级用法）
        audioService,
        aiService
    }
}
