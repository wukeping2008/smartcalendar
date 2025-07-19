<template>
  <div class="loading-container" :class="{ fullscreen, overlay }">
    <div class="loading-content">
      <!-- Spinner -->
      <div class="spinner" :class="size">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      
      <!-- Loading Text -->
      <div v-if="text" class="loading-text">
        {{ text }}
      </div>
      
      <!-- Progress Bar -->
      <div v-if="showProgress" class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string
  size?: 'sm' | 'md' | 'lg'
  fullscreen?: boolean
  overlay?: boolean
  showProgress?: boolean
  progress?: number
}

withDefaults(defineProps<Props>(), {
  text: '',
  size: 'md',
  fullscreen: false,
  overlay: false,
  showProgress: false,
  progress: 0
})
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
}

.loading-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-modal);
  background: var(--white);
}

.loading-container.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal-backdrop);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

.spinner {
  position: relative;
  display: inline-block;
}

.spinner.sm {
  width: 24px;
  height: 24px;
}

.spinner.md {
  width: 40px;
  height: 40px;
}

.spinner.lg {
  width: 64px;
  height: 64px;
}

.spinner-ring {
  position: absolute;
  border: 3px solid transparent;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner.sm .spinner-ring {
  width: 24px;
  height: 24px;
  border-width: 2px;
  border-top-width: 2px;
}

.spinner.md .spinner-ring {
  width: 40px;
  height: 40px;
  border-width: 3px;
  border-top-width: 3px;
}

.spinner.lg .spinner-ring {
  width: 64px;
  height: 64px;
  border-width: 4px;
  border-top-width: 4px;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
  border-top-color: var(--primary-color);
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
  border-top-color: var(--accent-color);
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
  border-top-color: var(--primary-color);
  opacity: 0.7;
}

.spinner-ring:nth-child(4) {
  border-top-color: var(--accent-color);
  opacity: 0.5;
}

.loading-text {
  color: var(--gray-600);
  font-size: var(--text-sm);
  font-weight: 500;
  margin-top: var(--space-2);
}

.progress-container {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, var(--accent-color) 100%);
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

.progress-text {
  font-size: var(--text-xs);
  color: var(--gray-500);
  text-align: center;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .loading-container.fullscreen {
    background: var(--gray-900);
  }
  
  .loading-container.overlay {
    background: rgba(15, 23, 42, 0.9);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring {
    animation: none;
    border-top-color: var(--primary-color);
  }
  
  .progress-fill::after {
    animation: none;
  }
}
</style>
