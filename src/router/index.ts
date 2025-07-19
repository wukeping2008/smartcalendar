import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '@/views/CalendarView.vue'
import ScheduleView from '@/views/ScheduleView.vue'
import AIAssistantView from '@/views/AIAssistantView.vue'
import TimeFlowView from '@/views/TimeFlowView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'calendar',
      component: CalendarView
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: ScheduleView
    },
    {
      path: '/ai-assistant',
      name: 'ai-assistant',
      component: AIAssistantView
    },
    {
      path: '/time-flow',
      name: 'time-flow',
      component: TimeFlowView
    }
  ]
})

export default router
