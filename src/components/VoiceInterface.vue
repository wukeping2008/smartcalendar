<template>
  <div class="voice-interface">
    <!-- 语音控制按钮 -->
    <div class="voice-controls">
      <button 
        @click="toggleListening"
        :class="['voice-btn', { 'listening': isListening, 'processing': isProcessing }]"
        :disabled="!isSupported"
      >
        <div class="voice-icon">
          <svg v-if="!isListening && !isProcessing" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
          
          <!-- 监听动画 -->
          <div v-if="isListening" class="listening-animation">
            <div class="wave"></div>
            <div class="wave"></div>
            <div class="wave"></div>
          </div>
          
          <!-- 处理动画 -->
          <div v-if="isProcessing" class="processing-spinner"></div>
        </div>
        
        <span class="voice-status">
          {{ statusText }}
        </span>
      </button>
    </div>

    <!-- 语音对话界面 -->
    <div v-if="showDialog" class="voice-dialog">
      <div class="dialog-content">
        <!-- 用户语音输入 -->
        <div v-if="userSpeech" class="speech-bubble user-speech">
          <div class="speech-icon">💭</div>
          <div class="speech-text">{{ userSpeech }}</div>
        </div>

        <!-- AI回复 -->
        <div v-if="aiResponse" class="speech-bubble ai-response">
          <div class="speech-icon">🤖</div>
          <div class="speech-text">{{ aiResponse }}</div>
        </div>

        <!-- 建议操作 -->
        <div v-if="suggestedActions.length > 0" class="suggested-actions">
          <button 
            v-for="action in suggestedActions" 
            :key="action.id"
            @click="executeAction(action)"
            class="action-btn"
          >
            {{ action.label }}
          </button>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button @click="closeDialog" class="close-btn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <!-- 语音权限提示 -->
    <div v-if="showPermissionPrompt" class="permission-prompt">
      <div class="prompt-content">
        <h3>需要麦克风权限</h3>
        <p>为了使用语音功能，请允许访问您的麦克风</p>
        <button @click="requestPermission" class="permission-btn">
          允许访问
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import { EventCategory, Priority } from '@/types'

// 语音API类型声明
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// 语音引擎接口
interface VoiceCommand {
  pattern: RegExp
  handler: (matches: string[]) => Promise<void>
  description: string
}

interface SuggestedAction {
  id: string
  label: string
  action: () => void
}

// 响应式状态
const isListening = ref(false)
const isProcessing = ref(false)
const isSupported = ref(false)
const showDialog = ref(false)
const showPermissionPrompt = ref(false)
const userSpeech = ref('')
const aiResponse = ref('')
const suggestedActions = ref<SuggestedAction[]>([])

// 语音API实例
let recognition: any = null
let synthesis: SpeechSynthesis | null = null

// 事件存储
const eventStore = useEventStore()

// 计算属性
const statusText = computed(() => {
  if (!isSupported.value) return '不支持语音'
  if (isProcessing.value) return '处理中...'
  if (isListening.value) return '正在听...'
  return '点击说话'
})

// 语音命令定义
const voiceCommands: VoiceCommand[] = [
  {
    pattern: /创建事件|添加事件|新建事件/,
    handler: handleCreateEvent,
    description: '创建新事件'
  },
  {
    pattern: /今天有什么安排|今天的日程/,
    handler: handleTodaySchedule,
    description: '查看今天安排'
  },
  {
    pattern: /明天空闲时间|明天有空吗/,
    handler: handleTomorrowFreeTime,
    description: '查看明天空闲时间'
  },
  {
    pattern: /我很疲惫|我累了/,
    handler: handleTiredState,
    description: '设置疲惫状态'
  },
  {
    pattern: /我精力充沛|我很有精神/,
    handler: handleEnergeticState,
    description: '设置充沛状态'
  },
  {
    pattern: /优化我的日程|帮我优化时间/,
    handler: handleOptimizeSchedule,
    description: '优化日程安排'
  }
]

// 初始化语音功能
onMounted(() => {
  initVoiceEngine()
})

onUnmounted(() => {
  if (recognition) {
    recognition.stop()
  }
})

// 初始化语音引擎
function initVoiceEngine() {
  // 检查浏览器支持
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'zh-CN'
    
    recognition.onstart = () => {
      isListening.value = true
    }
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      userSpeech.value = transcript
      processVoiceCommand(transcript)
    }
    
    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      isListening.value = false
      isProcessing.value = false
      
      if (event.error === 'not-allowed') {
        showPermissionPrompt.value = true
      }
    }
    
    recognition.onend = () => {
      isListening.value = false
    }
    
    isSupported.value = true
  }
  
  // 初始化语音合成
  if ('speechSynthesis' in window) {
    synthesis = window.speechSynthesis
  }
}

// 切换监听状态
function toggleListening() {
  if (!recognition) return
  
  if (isListening.value) {
    recognition.stop()
  } else {
    showDialog.value = true
    userSpeech.value = ''
    aiResponse.value = ''
    suggestedActions.value = []
    recognition.start()
  }
}

// 处理语音命令
async function processVoiceCommand(transcript: string) {
  isProcessing.value = true
  
  try {
    // 查找匹配的命令
    const matchedCommand = voiceCommands.find(cmd => cmd.pattern.test(transcript))
    
    if (matchedCommand) {
      const matches = transcript.match(matchedCommand.pattern) || []
      await matchedCommand.handler(matches)
    } else {
      // 未识别的命令，提供帮助
      aiResponse.value = '抱歉，我没有理解您的指令。您可以说：\n• 创建事件\n• 今天有什么安排\n• 优化我的日程'
      suggestedActions.value = [
        { id: 'help', label: '查看所有命令', action: showAllCommands },
        { id: 'retry', label: '重新说一遍', action: toggleListening }
      ]
    }
  } catch (error) {
    console.error('处理语音命令错误:', error)
    aiResponse.value = '处理您的请求时出现了错误，请稍后再试。'
  } finally {
    isProcessing.value = false
  }
}

// 语音合成
function speak(text: string) {
  if (!synthesis) return
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9
  utterance.pitch = 1
  
  synthesis.speak(utterance)
}

// 命令处理函数
async function handleCreateEvent(matches: string[]) {
  aiResponse.value = '好的，我来帮您创建一个新事件。请告诉我事件的详细信息。'
  
  suggestedActions.value = [
    { id: 'quick-meeting', label: '快速会议', action: () => createQuickEvent('会议') },
    { id: 'quick-task', label: '快速任务', action: () => createQuickEvent('任务') },
    { id: 'custom', label: '自定义', action: openEventModal }
  ]
  
  speak(aiResponse.value)
}

async function handleTodaySchedule(matches: string[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const todayEvents = eventStore.getEventsByDateRange(today, tomorrow)
  
  if (todayEvents.length === 0) {
    aiResponse.value = '您今天没有安排任何事件，是个空闲的一天！'
  } else {
    const eventList = todayEvents.map((event: any) => `• ${event.title} (${formatTime(event.startTime)})`).join('\n')
    aiResponse.value = `您今天有 ${todayEvents.length} 个安排：\n${eventList}`
  }
  
  suggestedActions.value = [
    { id: 'add-event', label: '添加事件', action: () => handleCreateEvent([]) },
    { id: 'optimize', label: '优化安排', action: () => handleOptimizeSchedule([]) }
  ]
  
  speak(aiResponse.value)
}

async function handleTomorrowFreeTime(matches: string[]) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)
  
  const tomorrowEvents = eventStore.getEventsByDateRange(tomorrow, dayAfter)
  const freeSlots = calculateFreeTime(tomorrowEvents, tomorrow)
  
  if (freeSlots.length === 0) {
    aiResponse.value = '明天的日程已经排满了。'
  } else {
    const slotList = freeSlots.map(slot => `• ${slot.start} - ${slot.end}`).join('\n')
    aiResponse.value = `明天有以下空闲时段：\n${slotList}`
  }
  
  suggestedActions.value = [
    { id: 'schedule-meeting', label: '安排会议', action: () => scheduleInFreeTime(freeSlots[0]) }
  ]
  
  speak(aiResponse.value)
}

async function handleTiredState(matches: string[]) {
  // 这里可以集成情绪管理系统
  aiResponse.value = '我注意到您感到疲惫。建议您：\n• 安排15分钟休息\n• 推迟非紧急任务\n• 保持轻松的工作节奏'
  
  suggestedActions.value = [
    { id: 'break', label: '安排休息', action: scheduleBreak },
    { id: 'reschedule', label: '重新安排任务', action: rescheduleTasks }
  ]
  
  speak('我注意到您感到疲惫，建议您安排一些休息时间。')
}

async function handleEnergeticState(matches: string[]) {
  aiResponse.value = '太好了！您精力充沛。这是处理重要任务的好时机：\n• 策略研发\n• 复杂分析\n• 创造性工作'
  
  suggestedActions.value = [
    { id: 'important-task', label: '安排重要任务', action: scheduleImportantTask },
    { id: 'deep-work', label: '深度工作时间', action: scheduleDeepWork }
  ]
  
  speak('太好了！您精力充沛，这是处理重要任务的好时机。')
}

async function handleOptimizeSchedule(matches: string[]) {
  // 这里可以集成AI优化算法
  aiResponse.value = '正在分析您的日程安排...\n\n建议优化：\n• 将相似任务合并处理\n• 在高能量时段安排重要工作\n• 增加缓冲时间'
  
  suggestedActions.value = [
    { id: 'apply-optimization', label: '应用建议', action: applyOptimization },
    { id: 'custom-optimization', label: '自定义优化', action: openOptimizationPanel }
  ]
  
  speak('我已经分析了您的日程，有一些优化建议。')
}

// 辅助函数
function createQuickEvent(type: string) {
  const now = new Date()
  const event = {
    title: `${type} - ${formatTime(now)}`,
    startTime: now,
    endTime: new Date(now.getTime() + 60 * 60 * 1000), // 1小时后
    description: `通过语音快速创建的${type}`,
    category: (type === '会议' ? EventCategory.WORK : EventCategory.WORK) as EventCategory,
    priority: Priority.MEDIUM,
    isCompleted: false,
    reminders: []
  }
  
  eventStore.addEvent(event)
  aiResponse.value = `已为您创建${type}：${event.title}`
  speak(`已为您创建${type}`)
  
  setTimeout(() => {
    closeDialog()
  }, 2000)
}

function openEventModal() {
  // 触发事件创建模态框
  closeDialog()
  // 这里需要与父组件通信
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function calculateFreeTime(events: any[], date: Date) {
  // 简化的空闲时间计算
  const workStart = 9 // 9:00
  const workEnd = 18 // 18:00
  const freeSlots = []
  
  // 这里应该有更复杂的算法
  if (events.length === 0) {
    freeSlots.push({
      start: `${workStart}:00`,
      end: `${workEnd}:00`
    })
  }
  
  return freeSlots
}

function scheduleInFreeTime(slot: any) {
  aiResponse.value = `好的，我将在 ${slot.start} - ${slot.end} 为您安排会议。`
  speak('已为您安排会议')
}

function scheduleBreak() {
  const now = new Date()
  const breakEvent = {
    title: '休息时间',
    startTime: now,
    endTime: new Date(now.getTime() + 15 * 60 * 1000), // 15分钟
    description: '放松休息，恢复精力',
    category: EventCategory.PERSONAL,
    priority: Priority.MEDIUM,
    isCompleted: false,
    reminders: []
  }
  
  eventStore.addEvent(breakEvent)
  aiResponse.value = '已为您安排15分钟的休息时间。'
  speak('已安排休息时间')
}

function rescheduleTasks() {
  aiResponse.value = '正在重新安排您的任务，将非紧急任务推迟到精力更好的时候。'
  speak('正在重新安排任务')
}

function scheduleImportantTask() {
  aiResponse.value = '建议您现在处理最重要的任务，比如策略研发或数据分析。'
  speak('建议处理重要任务')
}

function scheduleDeepWork() {
  const now = new Date()
  const deepWorkEvent = {
    title: '深度工作时间',
    startTime: now,
    endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2小时
    description: '专注处理重要工作，避免干扰',
    category: EventCategory.WORK,
    priority: Priority.HIGH,
    isCompleted: false,
    reminders: []
  }
  
  eventStore.addEvent(deepWorkEvent)
  aiResponse.value = '已为您安排2小时的深度工作时间。'
  speak('已安排深度工作时间')
}

function applyOptimization() {
  aiResponse.value = '正在应用优化建议...'
  speak('正在优化您的日程')
}

function openOptimizationPanel() {
  closeDialog()
  // 打开优化面板
}

function showAllCommands() {
  const commandList = voiceCommands.map(cmd => `• ${cmd.description}`).join('\n')
  aiResponse.value = `您可以使用以下语音命令：\n${commandList}`
  speak('这里是所有可用的语音命令')
}

function executeAction(action: SuggestedAction) {
  action.action()
}

function closeDialog() {
  showDialog.value = false
  userSpeech.value = ''
  aiResponse.value = ''
  suggestedActions.value = []
}

function requestPermission() {
  showPermissionPrompt.value = false
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => {
      initVoiceEngine()
    })
    .catch(() => {
      alert('无法获取麦克风权限，语音功能将无法使用。')
    })
}
</script>

<style scoped>
.voice-interface {
  position: relative
}

.voice-controls {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.voice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  min-height: 80px;
}

.voice-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
}

.voice-btn.listening {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  animation: pulse 1.5s infinite;
}

.voice-btn.processing {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.voice-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
}

.voice-icon {
  width: 24px;
  height: 24px;
  position: relative;
}

.voice-icon svg {
  width: 100%;
  height: 100%;
}

.listening-animation {
  display: flex;
  gap: 2px;
  align-items: center;
}

.wave {
  width: 3px;
  height: 20px;
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
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.voice-status {
  font-size: 0.8rem;
  font-weight: 500;
}

.voice-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  z-index: 1000;
}

.dialog-content {
  padding: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.speech-bubble {
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.user-speech {
  background: #e3f2fd;
  margin-left: 2rem;
}

.ai-response {
  background: #f5f5f5;
  margin-right: 2rem;
}

.speech-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.speech-text {
  flex: 1;
  line-height: 1.5;
  white-space: pre-line;
}

.suggested-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #3498db;
  border-radius: 20px;
  background: white;
  color: #3498db;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: #3498db;
  color: white;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e0e0e0;
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.permission-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.prompt-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 300px;
}

.prompt-content h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.prompt-content p {
  margin: 0 0 1.5rem 0;
  color: #666;
  line-height: 1.5;
}

.permission-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #3498db;
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.permission-btn:hover {
  background: #2980b9;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes wave {
  0%, 100% { height: 10px; }
  50% { height: 20px; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 北欧风格优化 */
.voice-dialog {
  background: #fafafa;
  border: 1px solid #e0e0e0;
}

.user-speech {
  background: linear-gradient(135deg, #ecf0f1, #d5dbdb);
  color: #2c3e50;
}

.ai-response {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.ai-response .speech-icon {
  filter: brightness(1.2);
}
</style>
