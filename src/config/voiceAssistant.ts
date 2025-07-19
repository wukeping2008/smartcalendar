import { COZE_CN_BASE_URL } from '@coze/api'

// Coze 配置
export const COZE_CONFIG = {
    ACCESS_TOKEN: import.meta.env.VITE_COZE_ACCESS_TOKEN || '',
    DEFAULT_BOT_ID: import.meta.env.VITE_COZE_BOT_ID || '',
    ANALYSIS_BOT_ID: import.meta.env.VITE_COZE_ANALYSIS_BOT_ID || '',
    DEFAULT_VOICE_ID: import.meta.env.VITE_COZE_VOICE_ID || '',
    BASE_URL: COZE_CN_BASE_URL,

    // 功能开关
    FEATURES: {
        VOICE_RECOGNITION: true,
        VOICE_SYNTHESIS: true,
        REAL_TIME_ANALYSIS: true,
        BATCH_PROCESSING: true,
        CONVERSATION_HISTORY: true
    },

    // 性能配置
    PERFORMANCE: {
        MAX_MESSAGE_HISTORY: 100,
        MAX_TRANSCRIPTION_LENGTH: 10000,
        ANALYSIS_DEBOUNCE_MS: 1000,
        AUTO_SAVE_INTERVAL_MS: 30000
    }
}

// 生成唯一的uuid
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// 获取用户UUID
export const getUserUUID = () => {
    const userUUID = localStorage.getItem('userUUID')
    if (!userUUID) {
        const uuid = generateUUID()
        localStorage.setItem('userUUID', uuid)
        return uuid
    }
    return userUUID
}

// 默认语音助手配置
export const DEFAULT_VOICE_ASSISTANT_CONFIG = {
    deviceId: '',
    botId: COZE_CONFIG.DEFAULT_BOT_ID,
    voiceId: COZE_CONFIG.DEFAULT_VOICE_ID,
    autoPlay: false,
    autoSave: true
}
