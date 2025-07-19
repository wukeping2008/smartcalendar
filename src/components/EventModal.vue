<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? '编辑事件' : '事件详情' }}</h3>
        <div class="header-actions">
          <button v-if="!isEditing" class="btn-icon" @click="isEditing = true" title="编辑">
            ✏️
          </button>
          <button class="btn-close" @click="$emit('close')">×</button>
        </div>
      </div>
      
      <!-- 查看模式 -->
      <div v-if="!isEditing" class="event-details">
        <div class="detail-section">
          <h4>{{ event.title }}</h4>
          <span :class="['priority-badge', `priority-${event.priority}`]">
            {{ getPriorityLabel(event.priority) }}
          </span>
          <span :class="['category-badge', `category-${event.category}`]">
            {{ getCategoryLabel(event.category) }}
          </span>
        </div>
        
        <div v-if="event.description" class="detail-section">
          <label>描述</label>
          <p>{{ event.description }}</p>
        </div>
        
        <div class="detail-section">
          <label>时间</label>
          <p>
            📅 {{ formatDate(event.startTime) }}<br>
            🕐 {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
          </p>
        </div>
        
        <div v-if="event.location" class="detail-section">
          <label>地点</label>
          <p>📍 {{ event.location }}</p>
        </div>
        
        <div v-if="event.attendees && event.attendees.length > 0" class="detail-section">
          <label>参与者</label>
          <p>👥 {{ event.attendees.join(', ') }}</p>
        </div>
        
        <div v-if="event.reminders && event.reminders.length > 0" class="detail-section">
          <label>提醒</label>
          <p>🔔 {{ event.reminders.length }} 个提醒</p>
        </div>
        
        <div class="detail-section">
          <label>状态</label>
          <p>{{ event.isCompleted ? '✅ 已完成' : '⏳ 待完成' }}</p>
        </div>
        
        <div class="modal-actions">
          <button 
            class="btn" 
            @click="toggleComplete"
            :class="{ 'btn-secondary': event.isCompleted }"
          >
            {{ event.isCompleted ? '标记为未完成' : '标记为已完成' }}
          </button>
          <button class="btn btn-danger" @click="handleDelete">
            删除事件
          </button>
        </div>
      </div>
      
      <!-- 编辑模式 -->
      <form v-else @submit.prevent="handleSave" class="event-form">
        <div class="form-group">
          <label for="edit-title">标题 *</label>
          <input 
            id="edit-title"
            v-model="editForm.title" 
            type="text" 
            class="form-control" 
            required
          />
        </div>
        
        <div class="form-group">
          <label for="edit-description">描述</label>
          <textarea 
            id="edit-description"
            v-model="editForm.description" 
            class="form-control" 
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="edit-startDate">开始日期 *</label>
            <input 
              id="edit-startDate"
              v-model="editForm.startDate" 
              type="date" 
              class="form-control" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="edit-startTime">开始时间 *</label>
            <input 
              id="edit-startTime"
              v-model="editForm.startTime" 
              type="time" 
              class="form-control" 
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="edit-endDate">结束日期 *</label>
            <input 
              id="edit-endDate"
              v-model="editForm.endDate" 
              type="date" 
              class="form-control" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="edit-endTime">结束时间 *</label>
            <input 
              id="edit-endTime"
              v-model="editForm.endTime" 
              type="time" 
              class="form-control" 
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="edit-category">分类 *</label>
            <select id="edit-category" v-model="editForm.category" class="form-control" required>
              <option value="work">工作</option>
              <option value="personal">个人</option>
              <option value="health">健康</option>
              <option value="education">学习</option>
              <option value="social">社交</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="edit-priority">优先级 *</label>
            <select id="edit-priority" v-model="editForm.priority" class="form-control" required>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="edit-location">地点</label>
          <input 
            id="edit-location"
            v-model="editForm.location" 
            type="text" 
            class="form-control" 
          />
        </div>
        
        <div class="form-group">
          <label for="edit-attendees">参与者</label>
          <input 
            id="edit-attendees"
            v-model="attendeesInput" 
            type="text" 
            class="form-control" 
            placeholder="用逗号分隔"
          />
        </div>
        
        <div class="form-group">
          <label>
            <input 
              v-model="editForm.isCompleted" 
              type="checkbox"
            />
            标记为已完成
          </label>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="cancelEdit">
            取消
          </button>
          <button type="submit" class="btn">
            保存更改
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Event, EventCategory, Priority } from '@/types'

const props = defineProps<{
  event: Event
}>()

const emit = defineEmits<{
  close: []
  save: [event: Event]
  delete: [eventId: string]
}>()

// 响应式数据
const isEditing = ref(false)
const editForm = ref({
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  category: '' as EventCategory,
  priority: '' as Priority,
  location: '',
  isCompleted: false
})
const attendeesInput = ref('')

// 计算属性
const attendeesList = computed(() => {
  return attendeesInput.value
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
})

// 方法
const getPriorityLabel = (priority: Priority): string => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return labels[priority] || '中'
}

const getCategoryLabel = (category: EventCategory): string => {
  const labels = {
    work: '工作',
    personal: '个人',
    health: '健康',
    education: '学习',
    social: '社交',
    other: '其他'
  }
  return labels[category] || '其他'
}

const formatDate = (date: Date): string => {
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const formatTime = (date: Date): string => {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const formatTimeForInput = (date: Date): string => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const initEditForm = () => {
  editForm.value = {
    title: props.event.title,
    description: props.event.description || '',
    startDate: formatDateForInput(new Date(props.event.startTime)),
    startTime: formatTimeForInput(new Date(props.event.startTime)),
    endDate: formatDateForInput(new Date(props.event.endTime)),
    endTime: formatTimeForInput(new Date(props.event.endTime)),
    category: props.event.category,
    priority: props.event.priority,
    location: props.event.location || '',
    isCompleted: props.event.isCompleted
  }
  
  attendeesInput.value = props.event.attendees ? props.event.attendees.join(', ') : ''
}

const handleSave = () => {
  const startDateTime = new Date(`${editForm.value.startDate}T${editForm.value.startTime}`)
  const endDateTime = new Date(`${editForm.value.endDate}T${editForm.value.endTime}`)
  
  if (endDateTime <= startDateTime) {
    alert('结束时间必须晚于开始时间')
    return
  }
  
  const updatedEvent: Event = {
    ...props.event,
    title: editForm.value.title,
    description: editForm.value.description || undefined,
    startTime: startDateTime,
    endTime: endDateTime,
    category: editForm.value.category,
    priority: editForm.value.priority,
    location: editForm.value.location || undefined,
    attendees: attendeesList.value.length > 0 ? attendeesList.value : undefined,
    isCompleted: editForm.value.isCompleted,
    updatedAt: new Date()
  }
  
  emit('save', updatedEvent)
}

const cancelEdit = () => {
  isEditing.value = false
  initEditForm()
}

const toggleComplete = () => {
  const updatedEvent: Event = {
    ...props.event,
    isCompleted: !props.event.isCompleted,
    updatedAt: new Date()
  }
  
  emit('save', updatedEvent)
}

const handleDelete = () => {
  if (confirm('确定要删除这个事件吗？此操作无法撤销。')) {
    emit('delete', props.event.id)
  }
}

// 生命周期
onMounted(() => {
  initEditForm()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #ddd;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 1rem;
}

.btn-icon:hover {
  background: #f8f9fa;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.btn-close:hover {
  background: #f8f9fa;
}

.event-details {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.detail-section label {
  display: block;
  font-weight: 600;
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.detail-section p {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

.priority-badge,
.category-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  margin-left: 0.5rem;
}

.priority-low {
  background: #e8f5e8;
  color: #388e3c;
}

.priority-medium {
  background: #fff3e0;
  color: #f57c00;
}

.priority-high {
  background: #fce4ec;
  color: #c2185b;
}

.priority-urgent {
  background: #ffebee;
  color: #d32f2f;
}

.category-work { background: #e3f2fd; color: #1976d2; }
.category-personal { background: #f3e5f5; color: #7b1fa2; }
.category-health { background: #e8f5e8; color: #388e3c; }
.category-education { background: #fff3e0; color: #f57c00; }
.category-social { background: #fce4ec; color: #c2185b; }
.category-other { background: #f5f5f5; color: #616161; }

.event-form {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group label input[type="checkbox"] {
  margin-right: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
