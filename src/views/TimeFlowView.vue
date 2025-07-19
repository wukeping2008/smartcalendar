<template>
  <div class="time-flow-view">
    <!-- 页面头部 -->
    <div class="view-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="view-title">
            <span class="title-icon">🌊</span>
            时间流管理
          </h1>
          <p class="view-subtitle">
            革命性的流体时间管理界面，让您的日程如水般自然流动
          </p>
        </div>
        
        <div class="header-actions">
          <button @click="showQuickAdd = true" class="action-btn primary">
            <span class="btn-icon">➕</span>
            快速添加
          </button>
          
          <button @click="showSettings = true" class="action-btn">
            <span class="btn-icon">⚙️</span>
            设置
          </button>
          
          <button @click="exportData" class="action-btn">
            <span class="btn-icon">📤</span>
            导出
          </button>
        </div>
      </div>
    </div>
    
    <!-- 功能介绍卡片 -->
    <div v-if="showIntro" class="intro-section">
      <div class="intro-card">
        <div class="intro-header">
          <h3>✨ 欢迎体验时间流管理</h3>
          <button @click="showIntro = false" class="close-intro">×</button>
        </div>
        
        <div class="intro-content">
          <div class="operation-guide">
            <h4>🎯 基本操作指南</h4>
            <div class="guide-grid">
              <div class="guide-item">
                <div class="guide-icon">🖱️</div>
                <div class="guide-text">
                  <strong>拖拽事件</strong>
                  <p>点击并拖拽事件卡片到新位置</p>
                </div>
              </div>
              
              <div class="guide-item">
                <div class="guide-icon">🔍</div>
                <div class="guide-text">
                  <strong>缩放视图</strong>
                  <p>使用左上角滑块调整缩放比例</p>
                </div>
              </div>
              
              <div class="guide-item">
                <div class="guide-icon">📍</div>
                <div class="guide-text">
                  <strong>快速定位</strong>
                  <p>点击"现在"按钮回到当前时间</p>
                </div>
              </div>
              
              <div class="guide-item">
                <div class="guide-icon">⚠️</div>
                <div class="guide-text">
                  <strong>冲突提示</strong>
                  <p>红色区域表示时间冲突，绿色安全</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="feature-grid">
            <div class="feature-item">
              <div class="feature-icon">🎯</div>
              <h4>智能冲突检测</h4>
              <p>自动识别时间冲突和能量消耗模式</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🌊</div>
              <h4>流体动画</h4>
              <p>事件如水流般自然移动和交互</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🎨</div>
              <h4>直观拖拽</h4>
              <p>拖拽事件即可重新安排时间</p>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <h4>实时优化</h4>
              <p>AI助手提供最佳时间安排建议</p>
            </div>
          </div>
          
          <div class="intro-actions">
            <button @click="startTour" class="tour-btn">
              🎯 开始引导
            </button>
            <button @click="showUserGuide" class="guide-btn">
              📖 查看详细指南
            </button>
            <button @click="showIntro = false" class="skip-btn">
              跳过介绍
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作提示浮层 -->
    <div v-if="showOperationTips" class="operation-tips">
      <div class="tips-header">
        <h4>💡 操作提示</h4>
        <button @click="showOperationTips = false" class="close-tips">×</button>
      </div>
      
      <div class="tips-content">
        <div class="tip-item" v-for="tip in currentTips" :key="tip.id">
          <div class="tip-icon">{{ tip.icon }}</div>
          <div class="tip-text">
            <strong>{{ tip.title }}</strong>
            <p>{{ tip.description }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 时间流画布 -->
    <div class="canvas-section">
      <TimeFlowCanvas />
    </div>
    
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h3 v-if="!sidebarCollapsed">今日概览</h3>
        <button 
          @click="sidebarCollapsed = !sidebarCollapsed" 
          class="collapse-btn"
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>
      
      <div v-if="!sidebarCollapsed" class="sidebar-content">
        <!-- 今日统计 -->
        <div class="stats-section">
          <div class="stat-item">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <div class="stat-value">{{ todayEvents.length }}</div>
              <div class="stat-label">今日事件</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalHours }}h</div>
              <div class="stat-label">总时长</div>
            </div>
          </div>
          
          <div class="stat-item">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <div class="stat-value">{{ conflictCount }}</div>
              <div class="stat-label">冲突数</div>
            </div>
          </div>
        </div>
        
        <!-- 时间建议 -->
        <div class="suggestions-section">
          <h4>💡 智能建议</h4>
          <div class="suggestion-list">
            <div 
              v-for="suggestion in suggestions" 
              :key="suggestion.id"
              class="suggestion-item"
              :class="`type-${suggestion.type}`"
            >
              <div class="suggestion-icon">{{ suggestion.icon }}</div>
              <div class="suggestion-content">
                <div class="suggestion-title">{{ suggestion.title }}</div>
                <div class="suggestion-desc">{{ suggestion.description }}</div>
              </div>
              <button 
                @click="applySuggestion(suggestion)" 
                class="apply-btn"
                title="应用建议"
              >
                ✓
              </button>
            </div>
          </div>
        </div>
        
        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h4>🚀 快捷操作</h4>
          <div class="action-grid">
            <button @click="addBreak" class="quick-action">
              <span class="action-icon">☕</span>
              添加休息
            </button>
            
            <button @click="addMeeting" class="quick-action">
              <span class="action-icon">👥</span>
              安排会议
            </button>
            
            <button @click="findFreeTime" class="quick-action">
              <span class="action-icon">🔍</span>
              寻找空闲
            </button>
            
            <button @click="optimizeDay" class="quick-action">
              <span class="action-icon">✨</span>
              优化一天
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快速添加对话框 -->
    <div v-if="showQuickAdd" class="modal-overlay" @click="showQuickAdd = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>快速添加事件</h3>
          <button @click="showQuickAdd = false" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="addQuickEvent">
            <div class="form-group">
              <label>事件标题</label>
              <input 
                v-model="quickEvent.title" 
                type="text" 
                placeholder="输入事件标题..."
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>开始时间</label>
                <input v-model="quickEvent.startTime" type="time" required />
              </div>
              
              <div class="form-group">
                <label>结束时间</label>
                <input v-model="quickEvent.endTime" type="time" required />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>类别</label>
                <select v-model="quickEvent.category">
                  <option value="work">工作</option>
                  <option value="meeting">会议</option>
                  <option value="personal">个人</option>
                  <option value="break">休息</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>优先级</label>
                <select v-model="quickEvent.priority">
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="showQuickAdd = false" class="btn-cancel">
                取消
              </button>
              <button type="submit" class="btn-submit">
                添加事件
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- 设置对话框 -->
    <div v-if="showSettings" class="modal-overlay" @click="showSettings = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>时间流设置</h3>
          <button @click="showSettings = false" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="settings-section">
            <h4>显示设置</h4>
            <div class="setting-item">
              <label>
                <input type="checkbox" v-model="settings.showAnimation" />
                启用流体动画
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" v-model="settings.snapToGrid" />
                吸附到网格
              </label>
            </div>
            
            <div class="setting-item">
              <label>
                <input type="checkbox" v-model="settings.showConflicts" />
                显示冲突提示
              </label>
            </div>
          </div>
          
          <div class="settings-section">
            <h4>时间设置</h4>
            <div class="setting-item">
              <label>工作开始时间</label>
              <input type="time" v-model="settings.workStartTime" />
            </div>
            
            <div class="setting-item">
              <label>工作结束时间</label>
              <input type="time" v-model="settings.workEndTime" />
            </div>
          </div>
          
          <div class="settings-actions">
            <button @click="resetSettings" class="btn-reset">
              重置默认
            </button>
            <button @click="saveSettings" class="btn-save">
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TimeFlowCanvas from '@/components/TimeFlowCanvas.vue'

// 响应式数据
const showIntro = ref(true)
const showQuickAdd = ref(false)
const showSettings = ref(false)
const showOperationTips = ref(false)
const sidebarCollapsed = ref(false)

// 示例数据
const todayEvents = ref([
  { id: 1, title: '晨会', startTime: '09:00', endTime: '09:30', category: 'meeting' },
  { id: 2, title: '项目开发', startTime: '10:00', endTime: '12:00', category: 'work' },
  { id: 3, title: '午餐', startTime: '12:00', endTime: '13:00', category: 'break' },
])

const conflictCount = ref(2)

const suggestions = ref([
  {
    id: 1,
    type: 'optimization',
    icon: '⚡',
    title: '优化午后安排',
    description: '建议将高强度任务移至上午，午后安排轻松工作'
  },
  {
    id: 2,
    type: 'break',
    icon: '☕',
    title: '添加休息时间',
    description: '连续工作3小时，建议安排15分钟休息'
  },
  {
    id: 3,
    type: 'conflict',
    icon: '⚠️',
    title: '解决时间冲突',
    description: '下午2点有两个会议重叠，需要调整时间'
  }
])

// 快速添加表单
const quickEvent = ref({
  title: '',
  startTime: '',
  endTime: '',
  category: 'work',
  priority: 'medium'
})

// 设置
const settings = ref({
  showAnimation: true,
  snapToGrid: true,
  showConflicts: true,
  workStartTime: '09:00',
  workEndTime: '18:00'
})

// 操作提示数据
const currentTips = ref([
  {
    id: 1,
    icon: '🖱️',
    title: '拖拽事件',
    description: '点击并拖拽事件卡片到新的时间位置'
  },
  {
    id: 2,
    icon: '🔍',
    title: '缩放视图',
    description: '使用左上角的缩放滑块调整视图大小'
  },
  {
    id: 3,
    icon: '⚠️',
    title: '冲突提示',
    description: '红色区域表示时间冲突，绿色区域安全'
  }
])

// 计算属性
const totalHours = computed(() => {
  return todayEvents.value.reduce((total, event) => {
    const start = new Date(`2000-01-01 ${event.startTime}`)
    const end = new Date(`2000-01-01 ${event.endTime}`)
    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }, 0).toFixed(1)
})

// 生命周期
onMounted(() => {
  // 检查是否是首次访问
  const hasVisited = localStorage.getItem('timeflow-visited')
  if (hasVisited) {
    showIntro.value = false
  }
})

// 方法
const startTour = () => {
  showIntro.value = false
  // 这里可以启动引导教程
  console.log('开始引导教程')
}

const addQuickEvent = () => {
  console.log('添加快速事件:', quickEvent.value)
  // 这里添加事件到时间流
  showQuickAdd.value = false
  
  // 重置表单
  quickEvent.value = {
    title: '',
    startTime: '',
    endTime: '',
    category: 'work',
    priority: 'medium'
  }
}

const applySuggestion = (suggestion: any) => {
  console.log('应用建议:', suggestion.title)
  // 这里实现建议的应用逻辑
}

const addBreak = () => {
  console.log('添加休息时间')
}

const addMeeting = () => {
  console.log('安排会议')
}

const findFreeTime = () => {
  console.log('寻找空闲时间')
}

const optimizeDay = () => {
  console.log('优化一天安排')
}

const exportData = () => {
  console.log('导出数据')
}

const saveSettings = () => {
  localStorage.setItem('timeflow-settings', JSON.stringify(settings.value))
  showSettings.value = false
  console.log('设置已保存')
}

const resetSettings = () => {
  settings.value = {
    showAnimation: true,
    snapToGrid: true,
    showConflicts: true,
    workStartTime: '09:00',
    workEndTime: '18:00'
  }
}

const showUserGuide = () => {
  // 打开用户指南
  showIntro.value = false
  showOperationTips.value = true
  console.log('显示用户指南')
}

// 标记已访问
localStorage.setItem('timeflow-visited', 'true')
</script>

<style scoped>
.time-flow-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.view-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  color: white;
}

.view-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-icon {
  font-size: 3rem;
}

.view-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
  font-weight: 300;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.action-btn.primary {
  background: rgba(52, 152, 219, 0.8);
  border-color: #3498db;
}

.action-btn.primary:hover {
  background: rgba(52, 152, 219, 1);
}

.intro-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.intro-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.intro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.intro-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.close-intro {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.close-intro:hover {
  background: rgba(255, 255, 255, 0.2);
}

.intro-content {
  padding: 2rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.feature-item {
  text-align: center;
  padding: 1.5rem;
  border-radius: 12px;
  background: #f8f9fa;
  transition: transform 0.2s ease;
}

.feature-item:hover {
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-item h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.feature-item p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.intro-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.tour-btn, .skip-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tour-btn {
  background: #3498db;
  color: white;
}

.tour-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.skip-btn {
  background: #e9ecef;
  color: #6c757d;
}

.skip-btn:hover {
  background: #dee2e6;
}

.guide-btn {
  padding: 0.75rem 2rem;
  border: 2px solid #3498db;
  border-radius: 50px;
  background: white;
  color: #3498db;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.guide-btn:hover {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
}

.operation-guide {
  margin-bottom: 2rem;
}

.operation-guide h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.guide-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.guide-text strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.guide-text p {
  margin: 0;
  color: #6c757d;
  font-size: 0.8rem;
  line-height: 1.4;
}

.operation-tips {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 2000;
  overflow: hidden;
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.tips-header h4 {
  margin: 0;
  font-size: 1.2rem;
}

.close-tips {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.close-tips:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tips-content {
  padding: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #f8f9fa;
  border-left: 4px solid #3498db;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.tip-text strong {
  display: block;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.tip-text p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.5;
}

.canvas-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  position: relative;
}

.sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
}

.sidebar.collapsed {
  transform: translateX(280px);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.sidebar-header h3 {
  margin: 0;
  color: #2c3e50;
}

.collapse-btn {
  background: #3498db;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: #2980b9;
  transform: scale(1.1);
}

.sidebar-content {
  padding: 1.5rem;
}

.stats-section {
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.stat-label {
  font-size: 0.8rem;
  color: #6c757d;
}

.suggestions-section, .quick-actions {
  margin-bottom: 2rem;
}

.suggestions-section h4, .quick-actions h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border-left: 4px solid #3498db;
  background: #f8f9fa;
}

.suggestion-icon {
  font-size: 1.2rem;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
}

.suggestion-desc {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.apply-btn {
  background: #28a745;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.apply-btn:hover {
  background: #218838;
  transform: scale(1.1);
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.quick-action:hover {
  background: #f8f9fa;
  border-color: #3498db;
  transform: translateY(-2px);
}

.action-icon {
  font-size: 1.2rem;
}

/* 模态框样式 */
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
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel, .btn-submit, .btn-reset, .btn-save {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-cancel, .btn-reset {
  background: #e9ecef;
  color: #6c757d;
}

.btn-cancel:hover, .btn-reset:hover {
  background: #dee2e6;
}

.btn-submit, .btn-save {
  background: #3498db;
  color: white;
}

.btn-submit:hover, .btn-save:hover {
  background: #2980b9;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h4 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.settings-actions {
  display: flex;
  justify-content: space-between;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .view-title {
    font-size: 2rem;
  }
  
  .sidebar {
    width: 100%;
    transform: translateY(100%);
  }
  
  .sidebar.collapsed {
    transform: translateY(calc(100% - 60px));
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
