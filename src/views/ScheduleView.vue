<template>
  <div class="schedule-view">
    <div class="schedule-header">
      <h2>日程管理</h2>
      <button class="btn" @click="showAddModal = true">
        + 添加日程
      </button>
    </div>

    <div class="schedule-filters">
      <div class="filter-group">
        <label>分类筛选:</label>
        <select v-model="selectedCategory" class="form-control">
          <option value="">全部分类</option>
          <option v-for="category in categories" :key="category.value" :value="category.value">
            {{ category.label }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>优先级筛选:</label>
        <select v-model="selectedPriority" class="form-control">
          <option value="">全部优先级</option>
          <option v-for="priority in priorities" :key="priority.value" :value="priority.value">
            {{ priority.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>状态筛选:</label>
        <select v-model="selectedStatus" class="form-control">
          <option value="">全部状态</option>
          <option value="pending">待完成</option>
          <option value="completed">已完成</option>
        </select>
      </div>
    </div>

    <div class="schedule-stats">
      <div class="stat-card">
        <h3>{{ todayEvents.length }}</h3>
        <p>今日事件</p>
      </div>
      <div class="stat-card">
        <h3>{{ upcomingEvents.length }}</h3>
        <p>即将到来</p>
      </div>
      <div class="stat-card">
        <h3>{{ completedEvents.length }}</h3>
        <p>已完成</p>
      </div>
      <div class="stat-card">
        <h3>{{ overdueEvents.length }}</h3>
        <p>已过期</p>
      </div>
    </div>

    <div class="schedule-content">
      <div class="schedule-section">
        <h3>今日事件</h3>
        <div v-if="todayEvents.length === 0" class="empty-state">
          今天没有安排事件
        </div>
        <div v-else class="event-list">
          <EventCard
            v-for="event in todayEvents"
            :key="event.id"
            :event="event"
            @edit="editEvent"
            @delete="deleteEvent"
            @toggle-complete="toggleEventComplete"
          />
        </div>
      </div>

      <div class="schedule-section">
        <h3>即将到来</h3>
        <div v-if="upcomingEvents.length === 0" class="empty-state">
          暂无即将到来的事件
        </div>
        <div v-else class="event-list">
          <EventCard
            v-for="event in upcomingEvents"
            :key="event.id"
            :event="event"
            @edit="editEvent"
            @delete="deleteEvent"
            @toggle-complete="toggleEventComplete"
          />
        </div>
      </div>

      <div class="schedule-section">
        <h3>所有事件</h3>
        <div class="event-list">
          <EventCard
            v-for="event in filteredEvents"
            :key="event.id"
            :event="event"
            @edit="editEvent"
            @delete="deleteEvent"
            @toggle-complete="toggleEventComplete"
          />
        </div>
      </div>
    </div>

    <!-- 添加/编辑事件模态框 -->
    <AddEventModal
      v-if="showAddModal"
      :initial-date="new Date()"
      @close="showAddModal = false"
      @save="handleEventAdd"
    />

    <EventModal
      v-if="editingEvent"
      :event="editingEvent"
      @close="editingEvent = null"
      @save="handleEventSave"
      @delete="handleEventDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEventStore } from '@/stores/eventStore'
import type { Event, EventCategory, Priority } from '@/types'
import EventCard from '@/components/EventCard.vue'
import AddEventModal from '@/components/AddEventModal.vue'
import EventModal from '@/components/EventModal.vue'

const eventStore = useEventStore()

// 响应式数据
const showAddModal = ref(false)
const editingEvent = ref<Event | null>(null)
const selectedCategory = ref<EventCategory | ''>('')
const selectedPriority = ref<Priority | ''>('')
const selectedStatus = ref<'pending' | 'completed' | ''>('')

// 选项数据
const categories = [
  { value: 'work', label: '工作' },
  { value: 'personal', label: '个人' },
  { value: 'health', label: '健康' },
  { value: 'education', label: '学习' },
  { value: 'social', label: '社交' },
  { value: 'other', label: '其他' }
]

const priorities = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' }
]

// 计算属性
const todayEvents = computed(() => {
  return eventStore.todayEvents
})

const upcomingEvents = computed(() => {
  return eventStore.upcomingEvents
})

const completedEvents = computed(() => {
  return eventStore.events.filter(event => event.isCompleted)
})

const overdueEvents = computed(() => {
  const now = new Date()
  return eventStore.events.filter(event => 
    !event.isCompleted && new Date(event.endTime) < now
  )
})

const filteredEvents = computed(() => {
  let filtered = [...eventStore.events]

  if (selectedCategory.value) {
    filtered = filtered.filter(event => event.category === selectedCategory.value)
  }

  if (selectedPriority.value) {
    filtered = filtered.filter(event => event.priority === selectedPriority.value)
  }

  if (selectedStatus.value) {
    if (selectedStatus.value === 'completed') {
      filtered = filtered.filter(event => event.isCompleted)
    } else if (selectedStatus.value === 'pending') {
      filtered = filtered.filter(event => !event.isCompleted)
    }
  }

  return filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

// 方法
const editEvent = (event: Event) => {
  editingEvent.value = event
}

const deleteEvent = async (eventId: string) => {
  if (confirm('确定要删除这个事件吗？')) {
    await eventStore.deleteEvent(eventId)
  }
}

const toggleEventComplete = async (event: Event) => {
  await eventStore.updateEvent(event.id, {
    isCompleted: !event.isCompleted
  })
}

const handleEventAdd = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
  await eventStore.addEvent(eventData)
  showAddModal.value = false
}

const handleEventSave = async (event: Event) => {
  await eventStore.updateEvent(event.id, event)
  editingEvent.value = null
}

const handleEventDelete = async (eventId: string) => {
  await eventStore.deleteEvent(eventId)
  editingEvent.value = null
}

// 生命周期
onMounted(() => {
  eventStore.loadEventsFromStorage()
})
</script>

<style scoped>
.schedule-view {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.schedule-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  font-size: 0.9rem;
}

.filter-group select {
  min-width: 150px;
}

.schedule-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: #007bff;
}

.stat-card p {
  margin: 0;
  color: #6c757d;
  font-weight: 500;
}

.schedule-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.schedule-section h3 {
  margin-bottom: 1rem;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
}

.empty-state {
  text-align: center;
  color: #6c757d;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-style: italic;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .schedule-filters {
    flex-direction: column;
  }
  
  .filter-group select {
    min-width: 100%;
  }
  
  .schedule-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
