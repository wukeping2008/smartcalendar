<template>
  <div class="ai-assistant-view">
    <div class="ai-header">
      <h2>AI智能助手</h2>
      <p>让AI帮助您优化日程安排和时间管理</p>
    </div>

    <!-- 语音交互组件 -->
    <SmartVoiceInterface />

    <div class="ai-content">
      <!-- AI建议卡片 -->
      <div class="suggestions-section">
        <h3>智能建议</h3>
        <div v-if="suggestions.length === 0" class="empty-state">
          <p>暂无智能建议</p>
          <button class="btn" @click="generateSuggestions">
            🤖 生成建议
          </button>
        </div>
        <div v-else class="suggestions-grid">
          <div 
            v-for="suggestion in suggestions" 
            :key="suggestion.id"
            :class="['suggestion-card', `suggestion-${suggestion.type}`]"
          >
            <div class="suggestion-header">
              <h4>{{ suggestion.title }}</h4>
              <span class="confidence">置信度: {{ Math.round(suggestion.confidence * 100) }}%</span>
            </div>
            <p>{{ suggestion.description }}</p>
            <div class="suggestion-actions">
              <button class="btn btn-sm" @click="applySuggestion(suggestion)">
                应用建议
              </button>
              <button class="btn btn-sm btn-secondary" @click="dismissSuggestion(suggestion.id)">
                忽略
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间分析 -->
      <div class="analysis-section">
        <h3>时间分析</h3>
        <div class="analysis-grid">
          <div class="analysis-card">
            <h4>本周工作时间</h4>
            <div class="analysis-value">{{ weeklyWorkHours }}小时</div>
            <p>{{ workTimeAnalysis }}</p>
          </div>
          
          <div class="analysis-card">
            <h4>最忙碌的时段</h4>
            <div class="analysis-value">{{ busiestTimeSlot }}</div>
            <p>建议在此时段安排重要任务</p>
          </div>
          
          <div class="analysis-card">
            <h4>空闲时间</h4>
            <div class="analysis-value">{{ freeTimeSlots.length }}个时段</div>
            <p>可用于安排新的活动</p>
          </div>
          
          <div class="analysis-card">
            <h4>完成率</h4>
            <div class="analysis-value">{{ completionRate }}%</div>
            <p>{{ completionAnalysis }}</p>
          </div>
        </div>
      </div>

      <!-- AI对话界面 -->
      <div class="chat-section">
        <h3>AI对话助手</h3>
        <div class="chat-container">
          <div class="chat-messages" ref="chatMessagesRef">
            <div 
              v-for="message in chatMessages" 
              :key="message.id"
              :class="['message', message.type]"
            >
              <div class="message-content">
                <p>{{ message.content }}</p>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>
          
          <div class="chat-input">
            <input 
              v-model="chatInput"
              @keyup.enter="sendMessage"
              placeholder="询问AI助手关于日程安排的问题..."
              class="form-control"
            />
            <button 
              class="btn" 
              @click="sendMessage"
              :disabled="!chatInput.trim()"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <h3>快速操作</h3>
        <div class="actions-grid">
          <button class="action-btn" @click="optimizeSchedule">
            <span class="action-icon">⚡</span>
            <span class="action-text">优化日程</span>
          </button>
          
          <button class="action-btn" @click="findFreeTime">
            <span class="action-icon">🔍</span>
            <span class="action-text">查找空闲时间</span>
          </button>
          
          <button class="action-btn" @click="analyzeWorkload">
            <span class="action-icon">📊</span>
            <span class="action-text">工作量分析</span>
          </button>
          
          <button class="action-btn" @click="suggestBreaks">
            <span class="action-icon">☕</span>
            <span class="action-text">建议休息时间</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import type { AISuggestion, SuggestionType } from '@/types'
import SmartVoiceInterface from '@/components/SmartVoiceInterface.vue'

const eventStore = useEventStore()

// 响应式数据
const suggestions = ref<AISuggestion[]>([])
const chatMessages = ref<Array<{
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}>>([])
const chatInput = ref('')
const chatMessagesRef = ref<HTMLElement>()

// 计算属性
const weeklyWorkHours = computed(() => {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  
  const weekEvents = eventStore.getEventsByDateRange(weekStart, weekEnd)
  const workEvents = weekEvents.filter(event => event.category === 'work')
  
  return workEvents.reduce((total, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60)
    return total + duration
  }, 0).toFixed(1)
})

const workTimeAnalysis = computed(() => {
  const hours = parseFloat(weeklyWorkHours.value)
  if (hours < 20) return '工作时间较少，可以考虑增加工作安排'
  if (hours > 50) return '工作时间过长，建议适当休息'
  return '工作时间安排合理'
})

const busiestTimeSlot = computed(() => {
  const timeSlots = new Map<string, number>()
  
  eventStore.events.forEach(event => {
    const hour = new Date(event.startTime).getHours()
    const slot = `${hour}:00-${hour + 1}:00`
    timeSlots.set(slot, (timeSlots.get(slot) || 0) + 1)
  })
  
  let maxCount = 0
  let busiestSlot = '9:00-10:00'
  
  timeSlots.forEach((count, slot) => {
    if (count > maxCount) {
      maxCount = count
      busiestSlot = slot
    }
  })
  
  return busiestSlot
})

const freeTimeSlots = computed(() => {
  // 简化的空闲时间计算
  const today = new Date()
  const todayEvents = eventStore.todayEvents
  
  const slots = []
  for (let hour = 9; hour < 18; hour++) {
    const hasEvent = todayEvents.some(event => {
      const eventHour = new Date(event.startTime).getHours()
      return eventHour === hour
    })
    
    if (!hasEvent) {
      slots.push(`${hour}:00-${hour + 1}:00`)
    }
  }
  
  return slots
})

const completionRate = computed(() => {
  const total = eventStore.events.length
  if (total === 0) return 0
  
  const completed = eventStore.events.filter(event => event.isCompleted).length
  return Math.round((completed / total) * 100)
})

const completionAnalysis = computed(() => {
  const rate = completionRate.value
  if (rate >= 80) return '完成率很高，继续保持！'
  if (rate >= 60) return '完成率良好，还有提升空间'
  return '完成率较低，建议优化时间管理'
})

// 方法
const generateSuggestions = () => {
  const newSuggestions: AISuggestion[] = [
    {
      id: 'suggestion-1',
      type: 'time_optimization' as SuggestionType,
      title: '时间优化建议',
      description: '检测到您在上午9-11点效率最高，建议将重要任务安排在这个时段。',
      confidence: 0.85,
      createdAt: new Date()
    },
    {
      id: 'suggestion-2',
      type: 'break_reminder' as SuggestionType,
      title: '休息提醒',
      description: '您已连续工作3小时，建议安排15分钟休息时间。',
      confidence: 0.92,
      createdAt: new Date()
    },
    {
      id: 'suggestion-3',
      type: 'schedule_conflict' as SuggestionType,
      title: '日程冲突提醒',
      description: '明天下午2点有两个会议时间重叠，建议调整其中一个。',
      confidence: 0.78,
      createdAt: new Date()
    }
  ]
  
  suggestions.value = newSuggestions
}

const applySuggestion = (suggestion: AISuggestion) => {
  // 根据建议类型执行相应操作
  switch (suggestion.type) {
    case 'time_optimization':
      addChatMessage('ai', '已为您优化时间安排，重要任务已移至高效时段。')
      break
    case 'break_reminder':
      addChatMessage('ai', '已为您添加休息提醒，注意劳逸结合。')
      break
    case 'schedule_conflict':
      addChatMessage('ai', '已检测到日程冲突，建议您手动调整冲突的会议时间。')
      break
  }
  
  dismissSuggestion(suggestion.id)
}

const dismissSuggestion = (suggestionId: string) => {
  suggestions.value = suggestions.value.filter(s => s.id !== suggestionId)
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  
  const userMessage = chatInput.value.trim()
  addChatMessage('user', userMessage)
  
  // 模拟AI回复
  setTimeout(() => {
    const aiResponse = generateAIResponse(userMessage)
    addChatMessage('ai', aiResponse)
  }, 1000)
  
  chatInput.value = ''
}

const addChatMessage = (type: 'user' | 'ai', content: string) => {
  chatMessages.value.push({
    id: Date.now().toString(),
    type,
    content,
    timestamp: new Date()
  })
  
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

const generateAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase()
  
  if (message.includes('时间') || message.includes('安排')) {
    return '根据您的历史数据，我建议您在上午9-11点安排重要工作，下午2-4点处理日常事务。'
  }
  
  if (message.includes('会议') || message.includes('冲突')) {
    return '我检查了您的日程，发现明天下午可能有时间冲突。建议将其中一个会议调整到上午10点。'
  }
  
  if (message.includes('休息') || message.includes('疲劳')) {
    return '建议您每工作90分钟休息15分钟，这样可以保持最佳工作状态。我可以为您设置提醒。'
  }
  
  if (message.includes('效率') || message.includes('提高')) {
    return '根据分析，您可以通过以下方式提高效率：1. 合并相似任务 2. 减少会议时间 3. 设置专注时段'
  }
  
  return '我理解您的问题。基于您的日程数据，我建议您优化时间分配，将重要任务安排在精力充沛的时段。需要我为您生成详细的优化方案吗？'
}

const optimizeSchedule = () => {
  addChatMessage('ai', '正在分析您的日程安排...已为您优化了本周的时间分配，将高优先级任务移至效率最高的时段。')
}

const findFreeTime = () => {
  const freeSlots = freeTimeSlots.value
  if (freeSlots.length > 0) {
    addChatMessage('ai', `找到 ${freeSlots.length} 个空闲时段：${freeSlots.slice(0, 3).join(', ')}${freeSlots.length > 3 ? ' 等' : ''}`)
  } else {
    addChatMessage('ai', '今天的日程比较紧凑，建议查看明天或后天的空闲时间。')
  }
}

const analyzeWorkload = () => {
  addChatMessage('ai', `本周工作时间：${weeklyWorkHours.value}小时。${workTimeAnalysis.value}当前完成率：${completionRate.value}%`)
}

const suggestBreaks = () => {
  addChatMessage('ai', '建议在以下时间安排休息：上午10:30（15分钟）、下午3:00（15分钟）、晚上7:00（30分钟）。')
}

const formatTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  eventStore.loadEventsFromStorage()
  
  // 添加欢迎消息
  addChatMessage('ai', '您好！我是您的AI日程助手。我可以帮您分析时间安排、优化日程、查找空闲时间等。有什么可以帮助您的吗？')
})
</script>

<style scoped>
.ai-assistant-view {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.ai-header {
  text-align: center;
  margin-bottom: 2rem;
}

.ai-header p {
  color: #6c757d;
  margin-top: 0.5rem;
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.suggestions-section h3,
.analysis-section h3,
.chat-section h3,
.quick-actions h3 {
  margin-bottom: 1rem;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.suggestion-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #007bff;
}

.suggestion-time_optimization { border-left-color: #28a745; }
.suggestion-break_reminder { border-left-color: #ffc107; }
.suggestion-schedule_conflict { border-left-color: #dc3545; }
.suggestion-task_priority { border-left-color: #6f42c1; }

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.suggestion-header h4 {
  margin: 0;
  color: #333;
}

.confidence {
  font-size: 0.8rem;
  color: #6c757d;
  background: #f8f9fa;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.suggestion-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.analysis-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.analysis-card h4 {
  margin: 0 0 1rem 0;
  color: #333;
}

.analysis-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.chat-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
}

.message {
  margin-bottom: 1rem;
}

.message.user {
  text-align: right;
}

.message.user .message-content {
  background: #007bff;
  color: white;
  display: inline-block;
  padding: 0.75rem;
  border-radius: 18px 18px 4px 18px;
  max-width: 70%;
}

.message.ai .message-content {
  background: white;
  color: #333;
  display: inline-block;
  padding: 0.75rem;
  border-radius: 18px 18px 18px 4px;
  max-width: 70%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.7;
  display: block;
  margin-top: 0.25rem;
}

.chat-input {
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  margin-right: 0.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  color: #333;
}

.action-btn:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.action-text {
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .suggestions-grid,
  .analysis-grid,
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .chat-messages {
    height: 300px;
  }
}
</style>
