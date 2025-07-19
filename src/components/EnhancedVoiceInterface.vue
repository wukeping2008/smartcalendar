<template>
  <div class="enhanced-voice-interface">
    <!-- 语音控制按钮 -->
    <div class="voice-controls">
      <button 
        @click="toggleRecording"
        :class="['voice-btn', { 
          'recording': isRecording, 
          'processing': isProcessing,
          'playing': isPlaying 
        }]"
        :disabled="!status.overall"
      >
        <div class="voice-icon">
          <!-- 录音图标 -->
          <svg v-if="!isRecording && !isProcessing && !isPlaying" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6.92h-2z"/>
          </svg>
          
          <!-- 录音动画 -->
          <div v-if="isRecording" class="recording-animation">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
          </div>
          
          <!-- 处理动画 -->
          <div v-if="isProcessing" class="processing-spinner"></div>
          
          <!-- 播放动画 -->
          <div v-if="isPlaying" class="playing-animation">
            <div class="sound-wave"></div>
            <div class="sound-wave"></div>
            <div class="sound-wave"></div>
          </div>
        </div>
        
        <span class="voice-status">
          {{ statusText }}
        </span>
      </button>
      
      <!-- 设备选择 -->
      <div v-if="audioDevices.audioInputs.length > 1" class="device-selector">
        <select v-model="selectedDeviceId" @change="handleDeviceChange">
          <option v-for="device in audioDevices.audioInputs" :key="device.deviceId" :value="device.deviceId">
            {{ device.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- 实时转写显示 -->
    <div v-if="currentTranscription" class="transcription-display">
      <div class="transcription-text">
        {{ currentTranscription }}
      </div>
    </div>

    <!-- 对话历史 -->
    <div v-if="messages.length > 0" class="conversation-history">
      <div class="conversation-header">
        <h3>对话记录</h3>
        <button @click="clearHistory" class="clear-btn">清空</button>
      </div>
      
      <div class="messages-container">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.source]"
        >
          <div class="message-icon">
            {{ message.source === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
          <button 
            v-if="message.source === 'ai'" 
            @click="playResponse(message.content)"
            class="play-btn"
            :disabled="isPlaying"
          >
            🔊
          </button>
        </div>
      </div>
    </div>

    <!-- 快捷命令 -->
    <div class="quick-commands">
      <h4>快捷命令</h4>
      <div class="command-buttons">
        <button 
          v-for="command in quickCommands" 
          :key="command.id"
          @click="sendTextMessage(command.text)"
          class="command-btn"
          :disabled="isProcessing"
        >
          {{ command.label }}
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
        <button @click="error = null" class="error-close">×</button>
      </div>
    </div>

    <!-- 服务状态指示器 -->
    <div class="service-status">
      <div class="status-item" :class="{ active: status.audio.transcriptionReady }">
        <span class="status-dot"></span>
        语音识别
      </div>
      <div class="status-item" :class="{ active: status.audio.synthesisReady }">
        <span class="status-dot"></span>
        语音合成
      </div>
      <div class="status-item" :class="{ active: status.ai.isReady }">
        <span class="status-dot"></span>
        AI服务
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVoiceAssistant } from '@/composables/useVoiceAssistant'

// 使用语音助手组合式API
const {
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
  
  // 方法
  startRecording,
  stopRecording,
  playResponse,
  switchDevice,
  sendTextMessage,
  clearHistory,
  getStatus
} = useVoiceAssistant()

// 计算属性
const status = computed(() => getStatus())

const statusText = computed(() => {
  if (!status.value.overall) return '服务未就绪'
  if (isProcessing.value) return '处理中...'
  if (isRecording.value) return '正在听...'
  if (isPlaying.value) return '播放中...'
  return '点击说话'
})

// 快捷命令
const quickCommands = [
  { id: 'today', label: '今天安排', text: '今天有什么安排' },
  { id: 'tomorrow', label: '明天空闲', text: '明天有空闲时间吗' },
  { id: 'create', label: '创建事件', text: '帮我创建一个新事件' },
  { id: 'optimize', label: '优化日程', text: '帮我优化日程安排' },
  { id: 'tired', label: '我很疲惫', text: '我感到很疲惫，需要休息' },
  { id: 'energetic', label: '精力充沛', text: '我精力充沛，可以处理重要任务' }
]

// 切换录音状态
const toggleRecording = async () => {
  if (isRecording.value) {
    await stopRecording()
  } else {
    await startRecording()
  }
}

// 处理设备切换
const handleDeviceChange = async (event: Event) => {
  const target = event.target as HTMLSelectElement
  await switchDevice(target.value)
}

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.enhanced-voice-interface {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
  background: #fafafa;
  border-radius: 16px;
  border: 1px solid #e0e0e0;
}

.voice-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.voice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  min-height: 100px;
  box-shadow: 0 4px 20px rgba(52, 152, 219, 0.2);
}

.voice-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 6px 30px rgba(52, 152, 219, 0.3);
}

.voice-btn.recording {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  animation: pulse 1.5s infinite;
}

.voice-btn.processing {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.voice-btn.playing {
  background: linear-gradient(135deg, #27ae60, #229954);
}

.voice-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.voice-icon {
  width: 32px;
  height: 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-icon svg {
  width: 100%;
  height: 100%;
}

.recording-animation {
  display: flex;
  gap: 3px;
  align-items: center;
}

.wave {
  width: 4px;
  height: 24px;
  background: currentColor;
  border-radius: 2px;
  animation: wave 1s infinite ease-in-out;
}

.wave:nth-child(2) {
  animation-delay: 0.1s;
}

.wave:nth-child(3) {
  animation-delay: 0.2s;
}

.processing-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.playing-animation {
  display: flex;
  gap: 2px;
  align-items: center;
}

.sound-wave {
  width: 3px;
  height: 20px;
  background: currentColor;
  border-radius: 2px;
  animation: soundWave 0.8s infinite ease-in-out;
}

.sound-wave:nth-child(2) {
  animation-delay: 0.1s;
}

.sound-wave:nth-child(3) {
  animation-delay: 0.2s;
}

.voice-status {
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.device-selector select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
}

.transcription-display {
  background: #e3f2fd;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  border-left: 4px solid #3498db;
}

.transcription-text {
  font-style: italic;
  color: #2c3e50;
  line-height: 1.5;
}

.conversation-history {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.conversation-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.clear-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  background: white;
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #e74c3c;
  color: white;
}

.messages-container {
  max-height: 300px;
  overflow-y: auto;
}

.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.message-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
}

.message.user .message-icon {
  background: #e3f2fd;
}

.message-content {
  flex: 1;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 12px;
  max-width: 70%;
}

.message.user .message-content {
  background: #e3f2fd;
}

.message-text {
  line-height: 1.5;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.message-time {
  font-size: 0.7rem;
  color: #7f8c8d;
}

.play-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.play-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.play-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quick-commands {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e0e0e0;
}

.quick-commands h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.command-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.command-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #3498db;
  border-radius: 8px;
  background: white;
  color: #3498db;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.command-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
}

.command-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-icon {
  font-size: 1.1rem;
}

.error-text {
  flex: 1;
  color: #dc2626;
  font-size: 0.9rem;
}

.error-close {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-status {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 0.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.status-item.active {
  color: #27ae60;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #bdc3c7;
}

.status-item.active .status-dot {
  background: #27ae60;
  animation: blink 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes wave {
  0%, 100% { height: 12px; }
  50% { height: 24px; }
}

@keyframes soundWave {
  0%, 100% { height: 8px; }
  50% { height: 20px; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .enhanced-voice-interface {
    padding: 0.75rem;
  }
  
  .voice-btn {
    min-width: 80px;
    min-height: 80px;
    padding: 1rem;
  }
  
  .command-buttons {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
  
  .service-status {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
