<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`, { 'toast-dismissible': toast.dismissible }]"
          @click="toast.dismissible && removeToast(toast.id)"
        >
          <div class="toast-icon">
            <component :is="getIcon(toast.type)" class="icon" />
          </div>
          
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">
              {{ toast.title }}
            </div>
            <div class="toast-message">
              {{ toast.message }}
            </div>
          </div>
          
          <button
            v-if="toast.dismissible"
            class="toast-close"
            @click.stop="removeToast(toast.id)"
            aria-label="关闭通知"
          >
            <XIcon class="icon" />
          </button>
          
          <div
            v-if="toast.duration && toast.duration > 0"
            class="toast-progress"
            :style="{ animationDuration: `${toast.duration}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Icons
const CheckCircleIcon = { template: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' }
const ExclamationCircleIcon = { template: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>' }
const XCircleIcon = { template: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>' }
const InformationCircleIcon = { template: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>' }
const XIcon = { template: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>' }

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
}

// State
const toasts = ref<Toast[]>([])
const timers = new Map<string, number>()

// Methods
const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
  const newToast: Toast = {
    id,
    dismissible: true,
    duration: 5000,
    ...toast
  }
  
  toasts.value.push(newToast)
  
  if (newToast.duration && newToast.duration > 0) {
    const timer = window.setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
    timers.set(id, timer)
  }
  
  return id
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
    
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }
}

const clearAllToasts = () => {
  toasts.value = []
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
}

const getIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'warning':
      return ExclamationCircleIcon
    case 'info':
      return InformationCircleIcon
    default:
      return InformationCircleIcon
  }
}

// Expose methods for external use
defineExpose({
  addToast,
  removeToast,
  clearAllToasts
})

// Global toast methods
const showSuccess = (message: string, title?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'success', message, title, ...options })
}

const showError = (message: string, title?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'error', message, title, duration: 0, ...options })
}

const showWarning = (message: string, title?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'warning', message, title, ...options })
}

const showInfo = (message: string, title?: string, options?: Partial<Toast>) => {
  return addToast({ type: 'info', message, title, ...options })
}

// Make toast methods globally available
onMounted(() => {
  // Add to global app instance if needed
  if (typeof window !== 'undefined') {
    (window as any).$toast = {
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo,
      clear: clearAllToasts
    }
  }
})

onUnmounted(() => {
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: var(--z-tooltip);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 400px;
  width: 100%;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--gray-200);
  position: relative;
  overflow: hidden;
  min-height: 64px;
}

.toast-dismissible {
  cursor: pointer;
}

.toast-dismissible:hover {
  transform: translateX(-2px);
  box-shadow: var(--shadow-2xl);
}

.toast-success {
  border-left: 4px solid var(--success-color);
}

.toast-error {
  border-left: 4px solid var(--error-color);
}

.toast-warning {
  border-left: 4px solid var(--warning-color);
}

.toast-info {
  border-left: 4px solid var(--info-color);
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.toast-success .toast-icon {
  color: var(--success-color);
}

.toast-error .toast-icon {
  color: var(--error-color);
}

.toast-warning .toast-icon {
  color: var(--warning-color);
}

.toast-info .toast-icon {
  color: var(--info-color);
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
}

.toast-message {
  color: var(--gray-600);
  font-size: var(--text-sm);
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  margin-top: -2px;
}

.toast-close:hover {
  background-color: var(--gray-100);
  color: var(--gray-600);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--accent-color) 100%);
  animation: toast-progress linear forwards;
  transform-origin: left;
}

.toast-success .toast-progress {
  background: var(--success-color);
}

.toast-error .toast-progress {
  background: var(--error-color);
}

.toast-warning .toast-progress {
  background: var(--warning-color);
}

.toast-info .toast-progress {
  background: var(--info-color);
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}

/* Transitions */
.toast-enter-active {
  transition: all var(--transition-normal);
}

.toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform var(--transition-normal);
}

.icon {
  width: 20px;
  height: 20px;
}

/* Responsive */
@media (max-width: 480px) {
  .toast-container {
    top: var(--space-2);
    right: var(--space-2);
    left: var(--space-2);
    max-width: none;
  }
  
  .toast {
    padding: var(--space-3);
  }
  
  .toast-title,
  .toast-message {
    font-size: var(--text-xs);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .toast {
    background: var(--gray-800);
    border-color: var(--gray-700);
  }
  
  .toast-title {
    color: var(--gray-100);
  }
  
  .toast-message {
    color: var(--gray-300);
  }
  
  .toast-close:hover {
    background-color: var(--gray-700);
    color: var(--gray-300);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: none;
  }
  
  .toast-progress {
    animation: none;
  }
  
  .toast-dismissible:hover {
    transform: none;
  }
}
</style>
