<template>
  <div class="smart-voice-interface">
    <!-- 主控制区域 -->
    <div class="main-controls">
      <div class="voice-button-container">
        <button 
          @click="toggleRecording"
          :class="['voice-button', { 
            'recording': isRecording, 
            'processing': isProcessing,
            'disabled': !status.overall
          }]"
          :disabled="!status.overall"
        >
          <div class="voice-icon">
            <!-- 麦克风图标 -->
            <svg v-if="!isRecording && !isProcessing" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            
            <!-- 录音动画 -->
            <div v-if="isRecording" class="recording-waves">
              <div class="wave" v-for="i in 3" :key="i"></div>
            </div>
            
            <!-- 处理动画 -->
            <div v-if="isProcessing" class="processing-spinner"></div>
          </div>
          
          <span class="voice-status">{{ statusText }}</span>
        </button>
      </div>

      <!-- 实时转写 -->
      <div v-if="currentTranscription" class="transcription-display">
        <div class="transcription-label">正在识别：</div>
        <div class="transcription-text">{{ currentTranscription }}</div>
      </div>
    </div>

    <!-- 快捷命令区域 -->
    <div class="quick-commands-section">
      <h3>快捷命令</h3>
      <div class="command-grid">
        <button 
          v-for="command in QUICK_COMMANDS" 
          :key="command.id"
          @click="sendTextCommand(command.text)"
          class="command-button"
          :disabled="isProcessing"
        >
          <span class="command-label">{{ command.label }}</span>
        </button>
      </div>
    </div>

    <!-- 对话历史 -->
    <div v-if="messages.length > 0" class="conversation-section">
      <div class="section-header">
        <h3>对话记录</h3>
        <button @click="clearHistory" class="clear-button">清空</button>
      </div>
      
      <div class="messages-list">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message-item', `message-${message.type}`]"
        >
          <div class="message-avatar">
            <span v-if="message.type === 'user'">👤</span>
            <span v-else-if="message.type === 'command'">⚡</span>
            <span v-else>🤖</span>
          </div>
          
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div v-if="message.commandResult" class="command-result">
              {{ message.commandResult }}
            </div>
            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
          
          <button 
            v-if="message.type === 'assistant'" 
            @click="playResponse(message.content)"
            class="play-button"
            title="播放语音"
          >
            🔊
          </button>
        </div>
      </div>
    </div>

    <!-- 帮助信息 -->
    <div class="help-section">
      <details>
        <summary>可用语音命令</summary>
        <div class="help-content">
          <ul>
            <li v-for="help in commandHelp" :key="help">{{ help }}</li>
          </ul>
        </div>
      </details>
    </div>

    <!-- 服务状态 -->
    <div class="status-bar">
      <div class="status-indicators">
        <div :class="['status-indicator', { active: status.isInitialized }]">
          <span class="indicator-dot"></span>
          <span class="indicator-text">初始化</span>
        </div>
        <div :class="['status-indicator', { active: status.hasPermission }]">
          <span class="indicator-dot"></span>
          <span class="indicator-text">麦克风权限</span>
        </div>
        <div :class="['status-indicator', { active: status.isRecognitionSupported }]">
          <span class="indicator-dot"></span>
          <span class="indicator-text">语音识别</span>
        </div>
        <div :class="['status-indicator', { active: status.isSynthesisSupported }]">
          <span class="indicator-dot"></span>
          <span class="indicator-text">语音合成</span>
        </div>
      </div>
    </div>

    <!-- Toast 消息 -->
    <div class="toast-container">
      <div 
        v-for="toast in toastMessages" 
        :key="toast.message + toast.type"
        :class="['toast-message', `toast-${toast.type}`]"
      >
        <span class="toast-icon">
          <span v-if="toast.type === 'success'">✅</span>
          <span v-else-if="toast.type === 'error'">❌</span>
          <span v-else-if="toast.type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </span>
        <span class="toast-text">{{ toast.message }}</span>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-banner">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error }}</span>
      <button @click="error = null" class="error-close">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEnhancedVoiceAssistant, QUICK_COMMANDS } from '@/composables/useEnhancedVoiceAssistant'

// 使用增强版语音助手
const {
  // 状态
  isRecording,
  isProcessing,
  currentTranscription,
  error,
  messages,
  toastMessages,
  
  // 方法
  toggleRecording,
  sendTextCommand,
  playResponse,
  clearHistory,
  getCommandHelp,
  getStatus
} = useEnhancedVoiceAssistant()

// 计算属性
const status = computed(() => getStatus())
const commandHelp = computed(() => getCommandHelp())

const statusText = computed(() => {
  if (!status.value.overall) return '服务未就绪'
  if (isProcessing.value) return '处理中...'
  if (isRecording.value) return '正在听...'
  return '点击说话'
})

// 格式化时间
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.smart-voice-interface {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* 主控制区域 */
.main-controls {
  text-align: center;
  margin-bottom: 2rem;
}

.voice-button-container {
  margin-bottom: 1.5rem;
}

.voice-button {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  min-height: 120px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.voice-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.voice-button.recording {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  animation: pulse 1.5s infinite;
}

.voice-button.processing {
  background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
}

.voice-button.disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.voice-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-icon svg {
  width: 100%;
  height: 100%;
}

.recording-waves {
  display: flex;
  gap: 4px;
  align-items: center;
}

.wave {
  width: 4px;
  height: 30px;
  background: currentColor;
  border-radius: 2px;
  animation: wave 1.2s infinite ease-in-out;
}

.wave:nth-child(2) {
  animation-delay: 0.1s;
}

.wave:nth-child(3) {
  animation-delay: 0.2s;
}

.processing-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.voice-status {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

/* 实时转写 */
.transcription-display {
  background: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  backdrop-filter: blur(10px);
}

.transcription-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.transcription-text {
  font-size: 1.1rem;
  color: #2c3e50;
  font-style: italic;
  line-height: 1.5;
}

/* 快捷命令 */
.quick-commands-section {
  margin-bottom: 2rem;
}

.quick-commands-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  text-align: center;
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.command-button {
  padding: 0.75rem 1rem;
  border: 2px solid #667eea;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.command-button:hover:not(:disabled) {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.command-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 对话历史 */
.conversation-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.clear-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e74c3c;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.clear-button:hover {
  background: #e74c3c;
  color: white;
}

.messages-list {
  max-height: 400px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.message-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: flex-start;
}

.message-item.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.message-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  max-width: 75%;
}

.message-item.message-user .message-content {
  background: rgba(102, 126, 234, 0.1);
}

.message-item.message-command .message-content {
  background: rgba(46, 204, 113, 0.1);
}

.message-text {
  line-height: 1.5;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.command-result {
  font-size: 0.8rem;
  color: #27ae60;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.message-time {
  font-size: 0.7rem;
  color: #7f8c8d;
}

.play-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.play-button:hover {
  background: rgba(0, 0, 0, 0.1);
}

/* 帮助信息 */
.help-section {
  margin-bottom: 2rem;
}

.help-section details {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.help-section summary {
  cursor: pointer;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.help-content ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.help-content li {
  margin-bottom: 0.25rem;
  color: #555;
  font-size: 0.9rem;
}

/* 状态栏 */
.status-bar {
  margin-bottom: 1rem;
}

.status-indicators {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  font-size: 0.8rem;
  color: #7f8c8d;
  backdrop-filter: blur(10px);
}

.status-indicator.active {
  color: #27ae60;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #bdc3c7;
}

.status-indicator.active .indicator-dot {
  background: #27ae60;
  animation: blink 2s infinite;
}

/* Toast 消息 */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toast-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
  max-width: 300px;
}

.toast-success {
  border-left: 4px solid #27ae60;
}

.toast-error {
  border-left: 4px solid #e74c3c;
}

.toast-warning {
  border-left: 4px solid #f39c12;
}

.toast-info {
  border-left: 4px solid #3498db;
}

.toast-text {
  font-size: 0.9rem;
  color: #2c3e50;
}

/* 错误横幅 */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fdf2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-top: 1rem;
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
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 动画 */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes wave {
  0%, 100% { height: 15px; }
  50% { height: 30px; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .smart-voice-interface {
    padding: 1rem;
  }
  
  .voice-button {
    min-width: 100px;
    min-height: 100px;
    padding: 1.5rem;
  }
  
  .command-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
  
  .status-indicators {
    flex-direction: column;
    align-items: center;
  }
  
  .toast-container {
    left: 10px;
    right: 10px;
    top: 10px;
  }
  
  .toast-message {
    max-width: none;
  }
}
</style>
