<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>添加新事件</h3>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="event-form">
        <div class="form-group">
          <label for="title">标题 *</label>
          <input 
            id="title"
            v-model="form.title" 
            type="text" 
            class="form-control" 
            required
            placeholder="输入事件标题"
          />
        </div>
        
        <div class="form-group">
          <label for="description">描述</label>
          <textarea 
            id="description"
            v-model="form.description" 
            class="form-control" 
            rows="3"
            placeholder="输入事件描述（可选）"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="startDate">开始日期 *</label>
            <input 
              id="startDate"
              v-model="form.startDate" 
              type="date" 
              class="form-control" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="startTime">开始时间 *</label>
            <input 
              id="startTime"
              v-model="form.startTime" 
              type="time" 
              class="form-control" 
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="endDate">结束日期 *</label>
            <input 
              id="endDate"
              v-model="form.endDate" 
              type="date" 
              class="form-control" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="endTime">结束时间 *</label>
            <input 
              id="endTime"
              v-model="form.endTime" 
              type="time" 
              class="form-control" 
              required
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="category">分类 *</label>
            <select id="category" v-model="form.category" class="form-control" required>
              <option value="">选择分类</option>
              <option value="work">工作</option>
              <option value="personal">个人</option>
              <option value="health">健康</option>
              <option value="education">学习</option>
              <option value="social">社交</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="priority">优先级 *</label>
            <select id="priority" v-model="form.priority" class="form-control" required>
              <option value="">选择优先级</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="location">地点</label>
          <input 
            id="location"
            v-model="form.location" 
            type="text" 
            class="form-control" 
            placeholder="输入事件地点（可选）"
          />
        </div>
        
        <div class="form-group">
          <label for="attendees">参与者</label>
          <input 
            id="attendees"
            v-model="attendeesInput" 
            type="text" 
            class="form-control" 
            placeholder="输入参与者，用逗号分隔（可选）"
          />
        </div>
        
        <div class="form-group">
          <label>
            <input 
              v-model="form.isCompleted" 
              type="checkbox"
            />
            标记为已完成
          </label>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            取消
          </button>
          <button type="submit" class="btn">
            保存事件
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
  initialDate?: Date
}>()

const emit = defineEmits<{
  close: []
  save: [eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>]
}>()

// 表单数据
const form = ref({
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  category: '' as EventCategory | '',
  priority: '' as Priority | '',
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
const handleSubmit = () => {
  if (!validateForm()) return
  
  const startDateTime = new Date(`${form.value.startDate}T${form.value.startTime}`)
  const endDateTime = new Date(`${form.value.endDate}T${form.value.endTime}`)
  
  if (endDateTime <= startDateTime) {
    alert('结束时间必须晚于开始时间')
    return
  }
  
  const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
    title: form.value.title,
    description: form.value.description || undefined,
    startTime: startDateTime,
    endTime: endDateTime,
    category: form.value.category as EventCategory,
    priority: form.value.priority as Priority,
    isCompleted: form.value.isCompleted,
    reminders: [], // 默认无提醒
    location: form.value.location || undefined,
    attendees: attendeesList.value.length > 0 ? attendeesList.value : undefined
  }
  
  emit('save', eventData)
}

const validateForm = (): boolean => {
  if (!form.value.title.trim()) {
    alert('请输入事件标题')
    return false
  }
  
  if (!form.value.startDate || !form.value.startTime) {
    alert('请选择开始日期和时间')
    return false
  }
  
  if (!form.value.endDate || !form.value.endTime) {
    alert('请选择结束日期和时间')
    return false
  }
  
  if (!form.value.category) {
    alert('请选择事件分类')
    return false
  }
  
  if (!form.value.priority) {
    alert('请选择优先级')
    return false
  }
  
  return true
}

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const formatTimeForInput = (date: Date): string => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  const initialDate = props.initialDate || new Date()
  
  // 设置默认开始时间为当前时间的下一个整点
  const startTime = new Date(initialDate)
  startTime.setHours(startTime.getHours() + 1, 0, 0, 0)
  
  // 设置默认结束时间为开始时间后1小时
  const endTime = new Date(startTime)
  endTime.setHours(endTime.getHours() + 1)
  
  form.value.startDate = formatDateForInput(startTime)
  form.value.startTime = formatTimeForInput(startTime)
  form.value.endDate = formatDateForInput(endTime)
  form.value.endTime = formatTimeForInput(endTime)
  form.value.priority = 'medium'
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
