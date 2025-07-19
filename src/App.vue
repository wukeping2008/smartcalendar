<template>
  <div id="app">
    <NavigationBar />
    
    <main class="app-main">
      <router-view />
    </main>
    
    <ToastNotification />
  </div>
</template>

<script setup lang="ts">
import NavigationBar from './components/NavigationBar.vue'
import ToastNotification from './components/ToastNotification.vue'
</script>

<style scoped>
.app-main {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}

@media (max-width: 768px) {
  .app-main {
    padding: var(--space-4);
  }
}
</style>
