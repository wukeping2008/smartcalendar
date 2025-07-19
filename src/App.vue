<template>
  <div id="app">
    <header class="app-header">
      <h1>智能日历助手</h1>
      <nav>
        <router-link to="/">日历</router-link>
        <router-link to="/schedule">日程管理</router-link>
        <router-link to="/time-flow">🌊 时间流</router-link>
        <router-link to="/ai-assistant">AI助手</router-link>
      </nav>
    </header>
    
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// 主应用组件
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.app-header nav {
  display: flex;
  gap: 2rem;
}

.app-header nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.app-header nav a:hover,
.app-header nav a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.app-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
