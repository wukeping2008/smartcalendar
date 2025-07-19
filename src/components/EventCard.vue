<template>
  <div :class="['event-card', `event-${event.category}`, { 'completed': event.isCompleted }]">
    <div class="event-header">
      <div class="event-title-section">
        <h4>{{ event.title }}</h4>
        <span :class="['priority-badge', `priority-${event.priority}`]">
          {{ getPriorityLabel(event.priority) }}
        </span>
      </div>
      <div class="event-actions">
        <button class="btn-icon" @click="$emit('toggle-complete', event)" :title="event.isCompleted ? '标记为未完成' : '标记为已完成'">
          {{ event.isCompleted ? '✓' : '○' }}
        </button>
        <button class="btn-icon" @click="$emit('edit', event)" title="编辑">
          ✏️
        </button>
        <button class="btn-icon" @click="$emit('delete', event.id)" title="删除">
          🗑️
        </button>
      </div>
    </div>
    
    <div class="event-time">
      <span class="time-info">
        📅 {{ formatDate(event.startTime) }}
      </span>
      <span class="time-info">
        🕐 {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
      </span>
    </div>
    
    <div v-if="event.description" class="event-description">
      {{ event.description }}
    </div>
    
    <div v-if="event.location" class="event-location">
      📍 {{ event.location }}
    </div>
    
    <div v-if="event.attendees && event.attendees.length > 0" class="event-attendees">
      👥 {{ event.attendees.join(', ') }}
    </div>
    
    <div v-if="event.reminders && event.reminders.length > 0" class="event-reminders">
      🔔 {{ event.reminders.length }} 个提醒
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Event, Priority } from '@/types'

defineProps<{
  event: Event
}>()

defineEmits<{
  edit: [event: Event]
  delete: [eventId: string]
  'toggle-complete': [event: Event]
}>()

const getPriorityLabel = (priority: Priority): string => {
  const labels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return labels[priority] || '中'
}

const formatDate = (date: Date): string => {
  const d = new Date(date)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const formatTime = (date: Date): string => {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.event-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #007bff;
  transition: transform 0.2s, box-shadow 0.2s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.event-card.completed {
  opacity: 0.7;
  background: #f8f9fa;
}

.event-card.completed .event-title-section h4 {
  text-decoration: line-through;
  color: #6c757d;
}

/* 分类颜色 */
.event-work { border-left-color: #007bff; }
.event-personal { border-left-color: #7b1fa2; }
.event-health { border-left-color: #388e3c; }
.event-education { border-left-color: #f57c00; }
.event-social { border-left-color: #c2185b; }
.event-other { border-left-color: #616161; }

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.event-title-section {
  flex: 1;
}

.event-title-section h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
}

.priority-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
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

.event-actions {
  display: flex;
  gap: 0.5rem;
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

.event-time {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.time-info {
  font-size: 0.9rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.event-description {
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.event-location,
.event-attendees,
.event-reminders {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

@media (max-width: 768px) {
  .event-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .event-actions {
    align-self: flex-end;
  }
  
  .event-time {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
