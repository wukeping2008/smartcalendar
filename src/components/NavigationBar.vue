<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo and Brand -->
      <div class="navbar-brand">
        <div class="brand-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="url(#gradient)" />
            <path d="M8 12h16M8 16h16M8 20h12" stroke="white" stroke-width="2" stroke-linecap="round" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6366f1" />
                <stop offset="100%" style="stop-color:#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="brand-text">Smart Calendar</span>
      </div>

      <!-- Desktop Navigation -->
      <div class="navbar-nav desktop-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: $route.path === item.path }"
        >
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.label }}</span>
        </router-link>
      </div>

      <!-- User Actions -->
      <div class="navbar-actions">
        <!-- Theme Toggle -->
        <button 
          class="btn btn-icon btn-ghost theme-toggle"
          @click="toggleTheme"
          :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
        >
          <SunIcon v-if="isDark" class="icon" />
          <MoonIcon v-else class="icon" />
        </button>

        <!-- Notifications -->
        <button 
          class="btn btn-icon btn-ghost notification-btn"
          @click="toggleNotifications"
          title="通知"
        >
          <BellIcon class="icon" />
          <span v-if="notificationCount > 0" class="notification-badge">
            {{ notificationCount > 99 ? '99+' : notificationCount }}
          </span>
        </button>

        <!-- Mobile Menu Toggle -->
        <button 
          class="btn btn-icon btn-ghost mobile-menu-toggle"
          @click="toggleMobileMenu"
          title="菜单"
        >
          <MenuIcon v-if="!isMobileMenuOpen" class="icon" />
          <XIcon v-else class="icon" />
        </button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div class="mobile-nav" :class="{ open: isMobileMenuOpen }">
      <div class="mobile-nav-content">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="mobile-nav-link"
          :class="{ active: $route.path === item.path }"
          @click="closeMobileMenu"
        >
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </div>

    <!-- Notifications Panel -->
    <div v-if="showNotifications" class="notifications-panel" @click.self="closeNotifications">
      <div class="notifications-content">
        <div class="notifications-header">
          <h3>通知</h3>
          <button class="btn btn-sm btn-ghost" @click="markAllAsRead">
            全部标记为已读
          </button>
        </div>
        <div class="notifications-list">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
          >
            <div class="notification-icon">
              <component :is="notification.icon" class="icon" />
            </div>
            <div class="notification-content">
              <p class="notification-title">{{ notification.title }}</p>
              <p class="notification-message">{{ notification.message }}</p>
              <span class="notification-time">{{ formatTime(notification.time) }}</span>
            </div>
          </div>
          <div v-if="notifications.length === 0" class="no-notifications">
            <BellIcon class="icon" />
            <p>暂无通知</p>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

// Icons (using simple SVG components for now)
const CalendarIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' }
const ClockIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' }
const MicrophoneIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>' }
const FlowIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>' }
const SunIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>' }
const MoonIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>' }
const BellIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"></path></svg>' }
const MenuIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>' }
const XIcon = { template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>' }

const route = useRoute()

// Navigation items
const navItems = [
  { path: '/', label: '日历', icon: CalendarIcon },
  { path: '/schedule', label: '日程', icon: ClockIcon },
  { path: '/time-flow', label: 'TimeFlow', icon: FlowIcon },
  { path: '/ai-assistant', label: 'AI助手', icon: MicrophoneIcon }
]

// State
const isMobileMenuOpen = ref(false)
const showNotifications = ref(false)
const isDark = ref(false)

// Sample notifications
const notifications = ref([
  {
    id: 1,
    title: '会议提醒',
    message: '您有一个会议将在15分钟后开始',
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    icon: CalendarIcon
  },
  {
    id: 2,
    title: 'AI建议',
    message: '检测到您的日程冲突，建议调整时间',
    time: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
    icon: FlowIcon
  },
  {
    id: 3,
    title: '任务完成',
    message: '您已完成今日80%的任务',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    icon: ClockIcon
  }
])

// Computed
const notificationCount = computed(() => 
  notifications.value.filter(n => !n.read).length
)

// Methods
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    showNotifications.value = false
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    isMobileMenuOpen.value = false
  }
}

const closeNotifications = () => {
  showNotifications.value = false
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

// Handle clicks outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.navbar')) {
    isMobileMenuOpen.value = false
    showNotifications.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Load theme preference
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }

  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: rgba(255, 255, 255, 0.95);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gray-200);
  transition: all var(--transition-fast);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  color: var(--gray-800);
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-text {
  font-size: var(--text-lg);
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--gray-600);
  font-weight: 500;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  color: var(--primary-color);
  background-color: var(--primary-light);
}

.nav-link.active {
  color: var(--primary-color);
  background-color: var(--primary-light);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--accent-color) 100%);
  border-radius: 1px;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.theme-toggle,
.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--error-color);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.mobile-menu-toggle {
  display: none;
}

.mobile-nav {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--white);
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-lg);
  transform: translateY(-100%);
  opacity: 0;
  transition: all var(--transition-normal);
  pointer-events: none;
}

.mobile-nav.open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.mobile-nav-content {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--gray-600);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.mobile-nav-link:hover,
.mobile-nav-link.active {
  color: var(--primary-color);
  background-color: var(--primary-light);
}

.notifications-panel {
  position: fixed;
  top: 64px;
  right: 0;
  width: 100vw;
  height: calc(100vh - 64px);
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--z-modal-backdrop);
  display: flex;
  justify-content: flex-end;
  padding: var(--space-4);
}

.notifications-content {
  width: 100%;
  max-width: 400px;
  background: var(--white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown var(--transition-normal) ease-out;
}

.notifications-header {
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notifications-header h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--gray-800);
}

.notifications-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) 0;
}

.notification-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-left: 3px solid transparent;
  transition: all var(--transition-fast);
}

.notification-item.unread {
  background-color: var(--primary-light);
  border-left-color: var(--primary-color);
}

.notification-item:hover {
  background-color: var(--gray-50);
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-1);
}

.notification-message {
  color: var(--gray-600);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
  line-height: 1.4;
}

.notification-time {
  color: var(--gray-400);
  font-size: var(--text-xs);
}

.no-notifications {
  text-align: center;
  padding: var(--space-8);
  color: var(--gray-400);
}

.no-notifications .icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.icon {
  width: 20px;
  height: 20px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .mobile-nav {
    display: block;
  }

  .notifications-panel {
    padding: var(--space-2);
  }

  .notifications-content {
    max-width: none;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .navbar {
    background: rgba(30, 41, 59, 0.95);
    border-bottom-color: var(--gray-700);
  }

  .mobile-nav {
    background: var(--gray-800);
    border-bottom-color: var(--gray-700);
  }

  .notifications-content {
    background: var(--gray-800);
  }

  .notifications-header {
    border-bottom-color: var(--gray-700);
  }

  .notification-item.unread {
    background-color: rgba(99, 102, 241, 0.1);
  }

  .notification-item:hover {
    background-color: var(--gray-700);
  }
}
</style>
