<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <h2>日历视图</h2>
      <div class="view-controls">
        <button 
          v-for="view in viewOptions" 
          :key="view.value"
          :class="['btn', { 'btn-active': currentView === view.value }]"
          @click="currentView = view.value"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <div class="calendar-navigation">
      <button class="btn btn-secondary" @click="previousPeriod">
        ← 上一个
      </button>
      <h3>{{ currentPeriodTitle }}</h3>
      <button class="btn btn-secondary" @click="nextPeriod">
        下一个 →
      </button>
    </div>

    <div class="calendar-content">
      <!-- 月视图 -->
      <div v-if="currentView === 'month'" class="month-view">
        <div class="weekdays">
          <div v-for="day in weekdays" :key="day" class="weekday">
            {{ day }}
          </div>
        </div>
        <div class="days-grid">
          <div 
            v-for="day in monthDays" 
            :key="day.date.toISOString()"
            :class="['day-cell', {
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'has-events': day.events.length > 0
            }]"
            @click="selectDate(day.date)"
          >
            <div class="day-number">{{ day.date.getDate() }}</div>
            <div class="day-events">
              <div 
                v-for="event in day.events.slice(0, 3)" 
                :key="event.id"
                :class="['event-item', `event-${event.category}`]"
                @click.stop="selectEvent(event)"
              >
                {{ event.title }}
              </div>
              <div v-if="day.events.length > 3" class="more-events">
                +{{ day.events.length - 3 }} 更多
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 周视图 -->
      <div v-else-if="currentView === 'week'" class="week-view">
        <div class="week-header">
          <div class="time-column"></div>
          <div 
            v-for="day in weekDays" 
            :key="day.date.toISOString()"
            :class="['day-header', { 'today': day.isToday }]"
          >
            <div class="day-name">{{ day.dayName }}</div>
            <div class="day-date">{{ day.date.getDate() }}</div>
          </div>
        </div>
        <div class="week-body">
          <div class="time-slots">
            <div v-for="hour in 24" :key="hour" class="time-slot">
              {{ String(hour - 1).padStart(2, '0') }}:00
            </div>
          </div>
          <div class="week-days">
            <div 
              v-for="day in weekDays" 
              :key="day.date.toISOString()"
              class="week-day-column"
            >
              <div 
                v-for="event in day.events" 
                :key="event.id"
                :class="['week-event', `event-${event.category}`]"
                :style="getEventStyle(event)"
                @click="selectEvent(event)"
              >
                <div class="event-time">
                  {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
                </div>
                <div class="event-title">{{ event.title }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 日视图 -->
      <div v-else-if="currentView === 'day'" class="day-view">
        <div class="day-header">
          <h3>{{ formatDate(selectedDate) }}</h3>
        </div>
        <div class="day-events">
          <div 
            v-for="event in dayEvents" 
            :key="event.id"
            :class="['day-event', `event-${event.category}`]"
            @click="selectEvent(event)"
          >
            <div class="event-time">
              {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
            </div>
            <div class="event-details">
              <h4>{{ event.title }}</h4>
              <p v-if="event.description">{{ event.description }}</p>
              <p v-if="event.location">📍 {{ event.location }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加事件按钮 -->
    <button class="add-event-btn" @click="showAddEventModal = true">
      + 添加事件
    </button>

    <!-- 事件详情模态框 -->
    <EventModal 
      v-if="selectedEvent"
      :event="selectedEvent"
      @close="selectedEvent = null"
      @save="handleEventSave"
      @delete="handleEventDelete"
    />

    <!-- 添加事件模态框 -->
    <AddEventModal 
      v-if="showAddEventModal"
      :initial-date="selectedDate"
      @close="showAddEventModal = false"
      @save="handleEventAdd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import type { Event, CalendarView } from '@/types'
import EventModal from '@/components/EventModal.vue'
import AddEventModal from '@/components/AddEventModal.vue'

const eventStore = useEventStore()

// 响应式数据
const currentView = ref<CalendarView>('month' as CalendarView)
const selectedDate = ref(new Date())
const selectedEvent = ref<Event | null>(null)
const showAddEventModal = ref(false)

// 视图选项
const viewOptions = [
  { value: 'month' as CalendarView, label: '月' },
  { value: 'week' as CalendarView, label: '周' },
  { value: 'day' as CalendarView, label: '日' }
]

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 计算属性
const currentPeriodTitle = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = selectedDate.value.getMonth() + 1
  
  switch (currentView.value) {
    case 'month':
      return `${year}年${month}月`
    case 'week':
      const weekStart = getWeekStart(selectedDate.value)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
    case 'day':
      return formatDate(selectedDate.value)
    default:
      return ''
  }
})

const monthDays = computed(() => {
  const year = selectedDate.value.getFullYear()
  const month = selectedDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dayEvents = eventStore.getEventsByDateRange(
      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    )
    
    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: date.getTime() === today.getTime(),
      events: dayEvents
    })
  }
  
  return days
})

const weekDays = computed(() => {
  const weekStart = getWeekStart(selectedDate.value)
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    
    const dayEvents = eventStore.getEventsByDateRange(
      new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    )
    
    days.push({
      date,
      dayName: weekdays[date.getDay()],
      isToday: date.getTime() === today.getTime(),
      events: dayEvents
    })
  }
  
  return days
})

const dayEvents = computed(() => {
  return eventStore.getEventsByDateRange(
    new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate()),
    new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate(), 23, 59, 59)
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

// 方法
const getWeekStart = (date: Date) => {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

const previousPeriod = () => {
  const newDate = new Date(selectedDate.value)
  
  switch (currentView.value) {
    case 'month':
      newDate.setMonth(newDate.getMonth() - 1)
      break
    case 'week':
      newDate.setDate(newDate.getDate() - 7)
      break
    case 'day':
      newDate.setDate(newDate.getDate() - 1)
      break
  }
  
  selectedDate.value = newDate
}

const nextPeriod = () => {
  const newDate = new Date(selectedDate.value)
  
  switch (currentView.value) {
    case 'month':
      newDate.setMonth(newDate.getMonth() + 1)
      break
    case 'week':
      newDate.setDate(newDate.getDate() + 7)
      break
    case 'day':
      newDate.setDate(newDate.getDate() + 1)
      break
  }
  
  selectedDate.value = newDate
}

const selectDate = (date: Date) => {
  selectedDate.value = date
  if (currentView.value !== 'day') {
    currentView.value = 'day' as CalendarView
  }
}

const selectEvent = (event: Event) => {
  selectedEvent.value = event
}

const formatDate = (date: Date) => {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const formatTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getEventStyle = (event: Event) => {
  const startHour = event.startTime.getHours()
  const startMinute = event.startTime.getMinutes()
  const endHour = event.endTime.getHours()
  const endMinute = event.endTime.getMinutes()
  
  const top = (startHour + startMinute / 60) * 60 // 每小时60px
  const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60
  
  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

const handleEventSave = async (event: Event) => {
  await eventStore.updateEvent(event.id, event)
  selectedEvent.value = null
}

const handleEventDelete = async (eventId: string) => {
  await eventStore.deleteEvent(eventId)
  selectedEvent.value = null
}

const handleEventAdd = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
  await eventStore.addEvent(eventData)
  showAddEventModal.value = false
}

// 生命周期
onMounted(() => {
  eventStore.loadEventsFromStorage()
})
</script>

<style scoped>
.calendar-view {
  padding: 1rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.view-controls {
  display: flex;
  gap: 0.5rem;
}

.btn-active {
  background-color: #0056b3 !important;
}

.calendar-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.month-view .weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #ddd;
  margin-bottom: 1px;
}

.weekday {
  background-color: #f8f9fa;
  padding: 1rem;
  text-align: center;
  font-weight: 600;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #ddd;
}

.day-cell {
  background-color: white;
  min-height: 120px;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.day-cell:hover {
  background-color: #f8f9fa;
}

.day-cell.other-month {
  background-color: #f8f9fa;
  color: #6c757d;
}

.day-cell.today {
  background-color: #e3f2fd;
}

.day-cell.has-events {
  border-left: 4px solid #007bff;
}

.day-number {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.event-item {
  font-size: 0.75rem;
  padding: 0.25rem;
  margin-bottom: 0.25rem;
  border-radius: 3px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-work { background-color: #e3f2fd; color: #1976d2; }
.event-personal { background-color: #f3e5f5; color: #7b1fa2; }
.event-health { background-color: #e8f5e8; color: #388e3c; }
.event-education { background-color: #fff3e0; color: #f57c00; }
.event-social { background-color: #fce4ec; color: #c2185b; }
.event-other { background-color: #f5f5f5; color: #616161; }

.more-events {
  font-size: 0.7rem;
  color: #6c757d;
  text-align: center;
}

.week-view {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.week-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.day-header {
  padding: 1rem;
  text-align: center;
  border-right: 1px solid #ddd;
}

.day-header.today {
  background-color: #e3f2fd;
}

.week-body {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  min-height: 600px;
}

.time-slots {
  border-right: 1px solid #ddd;
}

.time-slot {
  height: 60px;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.8rem;
  color: #6c757d;
}

.week-days {
  display: contents;
}

.week-day-column {
  position: relative;
  border-right: 1px solid #ddd;
  border-bottom: 1px solid #eee;
}

.week-event {
  position: absolute;
  left: 2px;
  right: 2px;
  padding: 0.25rem;
  border-radius: 3px;
  font-size: 0.75rem;
  cursor: pointer;
  overflow: hidden;
}

.day-view {
  max-width: 600px;
  margin: 0 auto;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.day-event {
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.day-event:hover {
  transform: translateY(-2px);
}

.add-event-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  transition: transform 0.2s;
}

.add-event-btn:hover {
  transform: scale(1.1);
}
</style>
