'use client'

import React, { useState, useEffect } from 'react'
import EnhancedFlowCanvas from '../../components/timeflow/FlowCanvas'
import CalendarContainer from '../../components/calendar/CalendarContainer'
import Link from 'next/link'
import { Settings, Brain, HelpCircle, Sparkles } from 'lucide-react'
import SmartEventCreator from '../../components/calendar/SmartEventCreator'
import VoiceInputButton from '../../components/voice/VoiceInputButton'
import TimeFlowGuide from '../../components/help/TimeFlowGuide'
import FeatureGuideModal from '../../components/help/FeatureGuideModal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Event, EventCategory, Priority, EventStatus, ReminderType, EnergyLevel } from '../../types/event'
import { useEventStore } from '../../lib/stores/event-store'
import { getDemoEvents } from '../../data/demo-events'
import EnhancedWorkHoursBudgetComponent from '../../components/budget/WorkHoursBudget'
import MarketStatusBar from '../../components/market/MarketStatusBar'
import ConflictResolver from '../../components/optimization/ConflictResolver'
import AIAssistant from '../../components/ai/AIAssistant'
import WeeklyPlanGenerator from '../../components/planning/WeeklyPlanGenerator'
// import RelationshipManager from '../../components/relationship/RelationshipManager' // 已合并到PersonCardPanel
// v4.0 新组件
import ContextMonitor from '../../components/context/ContextMonitor'
import SOPExecutor from '../../components/context/SOPExecutor'
import InboxPanel from '../../components/inbox/InboxPanel'
// 时间预算系统组件
import TimeTrackerWidget from '../../components/timebudget/TimeTrackerWidget'
import TimeBudgetDashboard from '../../components/timebudget/TimeBudgetDashboard'
import TimeBankPanel from '../../components/timebudget/TimeBankPanel'
// 浮动面板系统
import { FloatingPanelSystem } from '../../components/layout/FloatingPanelSystem'
// 温暖引导系统
import WarmGuidanceOverlay from '../../components/guidance/WarmGuidanceOverlay'
// 认知带宽监控store
import { useCognitiveStore } from '../../lib/stores/cognitive-store'

// 初始化演示数据
const initializeSampleEvents = (addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // 使用简化的演示数据
  const demoEvents = getDemoEvents(today)
  
  // 添加所有演示事件
  demoEvents.forEach(event => addEvent(event))
}

export default function HomePage() {
  const { events, selectEvent, addEvent, deleteEvent, loadEvents, isLoaded, removeDuplicates, clearAllEvents } = useEventStore()
  const { enterTradingMode, exitTradingMode, isInTradingMode } = useCognitiveStore()
  const [currentTime] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [initialized, setInitialized] = useState(false)
  const [viewMode, setViewMode] = useState<'flow' | 'calendar'>('calendar')
  const [showFeatureGuide, setShowFeatureGuide] = useState(false)
  const [tradingMode, setTradingMode] = useState(false)

  // 初始化：加载存储的事件或创建样本数据
  useEffect(() => {
    // 不再自动显示功能指南，需要用户手动点击
    // const hasSeenGuide = localStorage.getItem('hasSeenV4Guide')
    // if (!hasSeenGuide) {
    //   setShowFeatureGuide(true)
    //   localStorage.setItem('hasSeenV4Guide', 'true')
    // }
    
    // 加载存储的事件
    const initializeData = async () => {
      if (!isLoaded) {
        await loadEvents()
        
        // 获取加载后的事件
        const currentEvents = useEventStore.getState().events
        
        // 如果有事件，执行去重
        if (currentEvents.length > 0) {
          removeDuplicates()
        }
        
        // 检查是否已经初始化过演示数据
        const hasInitializedDemo = localStorage.getItem('hasInitializedDemoData')
        
        // 只在第一次访问且没有任何事件时添加演示数据
        if (!hasInitializedDemo && currentEvents.length === 0) {
          initializeSampleEvents(addEvent)
          localStorage.setItem('hasInitializedDemoData', 'true')
        }
      }
    }
    
    initializeData()
  }, [isLoaded, loadEvents, addEvent, removeDuplicates]) // 添加removeDuplicates依赖

  const timeRange = {
    start: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 0, 0),
    end: new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), 23, 59)
  }

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event)
    selectEvent(event.id)
    // Event selected
  }

  const handleEventDrag = (eventId: string, newPosition: { x: number; y: number; z: number }) => {
    // Event dragged
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId)
    // 如果删除的是当前选中的事件，清除选中状态
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* 头部导航 - 响应式设计优化 */}
      <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-700/50 shadow-xl sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                <span className="hidden sm:inline">智能日历系统</span>
                <span className="sm:hidden">智能日历</span>
              </h1>
              <div className="hidden sm:flex px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30">
                <span className="text-sm text-cyan-300 font-medium">
                  {viewMode === 'calendar' ? '📅 日历视图' : '🌊 时间流'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className="flex bg-gray-800/50 rounded-lg border border-gray-600/50 p-1 shadow-inner">
                <Button
                  size="sm"
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  className={viewMode === 'calendar' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg text-xs sm:text-sm px-2 sm:px-3' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white transition-safe text-xs sm:text-sm px-2 sm:px-3'}
                  onClick={() => setViewMode('calendar')}
                >
                  <span className="sm:hidden">📅</span>
                  <span className="hidden sm:inline">📅 日历视图</span>
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'flow' ? 'default' : 'ghost'}
                  className={viewMode === 'flow' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg text-xs sm:text-sm px-2 sm:px-3' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white transition-safe text-xs sm:text-sm px-2 sm:px-3'}
                  onClick={() => setViewMode('flow')}
                >
                  <span className="sm:hidden">🌊</span>
                  <span className="hidden sm:inline">🌊 时间流</span>
                </Button>
              </div>
              
              <Link 
                href="/settings" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50 text-white transition-safe hover:shadow-lg hover:shadow-blue-500/20"
              >
                <Brain className="h-4 w-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">AI助手</span>
              </Link>
              <Link 
                href="/settings" 
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-safe border border-gray-600/50 hover:border-gray-500/50"
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">设置</span>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFeatureGuide(true)}
                className="flex items-center gap-1 sm:gap-2 text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500/50 transition-safe px-2 sm:px-3"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs sm:text-sm hidden lg:inline">功能指南</span>
              </Button>
              
              {/* 临时：清理重复数据按钮 */}
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 px-2 sm:px-3"
                onClick={() => {
                  if (confirm('是否清除所有历史数据并重新初始化？')) {
                    clearAllEvents().then(() => {
                      localStorage.removeItem('hasInitializedDemoData')
                      window.location.reload()
                    })
                  }
                }}
                title="清理重复数据"
              >
                <span className="text-xs sm:text-sm">清理重复</span>
              </Button>
              
              <div className="hidden sm:flex px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
                <span className="text-sm text-purple-300 font-medium">✨ v4.0</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 - 响应式优化 */}
      <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 p-3 sm:p-6">
            {viewMode === 'calendar' ? (
              /* 传统日历视图 - 主视图 */
              <>
                {/* 主日历区域 - 全宽显示 */}
                <div className="h-full">
                  <CalendarContainer
                    initialDate={currentTime}
                    initialView="day"
                  />
                </div>
                
                {/* 日历视图中的浮动语音按钮 - 仅在日历模式下显示 */}
                
                {/* 空状态提示 - 移除，让用户直接看到日历界面 */}
              </>
            ) : (
              /* 3D时间流视图 - 辅助功能 */
              <>
                <div className="w-full h-full rounded-xl bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 overflow-hidden relative shadow-2xl">
                  <EnhancedFlowCanvas
                    events={events}
                    currentTime={currentTime}
                    timeRange={timeRange}
                    onEventSelect={handleEventSelect}
                    onEventDrag={handleEventDrag}
                    riverFlow={{
                      enabled: true,
                      flowSpeed: 1.0,
                      currentTimeCenter: true,
                      rippleEffects: true
                    }}
                    smartInteraction={{
                      dragPreview: true,
                      conflictAvoidance: true,
                      snapToSlots: true,
                      energyOptimization: true
                    }}
                    className="w-full h-full"
                  />
                  
                  {/* 3D视图说明 */}
                  <div className="absolute top-4 left-4">
                    <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700/50 p-3 shadow-lg">
                      <p className="text-xs text-cyan-400">
                        🌊 3D时间流可视化 • 拖拽旋转 • 滚轮缩放 • 点击选择
                      </p>
                    </Card>
                  </div>
                  
                  {/* 空状态提示 - 移除，让用户直接看到3D视图 */}
                </div>
                
                {/* 时间流控制器 */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700/50 p-4 shadow-xl">
                    <div className="text-center mb-3">
                      <p className="text-xs text-gray-500">时间流控制器</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="回到今天"
                      >
                        ⏮️ 今天
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="暂停时间流动画"
                      >
                        ⏸️ 暂停
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="播放时间流动画"
                      >
                        ⏯️ 播放
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-gray-300 hover:text-white border-gray-600/50 hover:bg-gray-700/50 transition-safe"
                        title="查看明天"
                      >
                        ⏭️ 明天
                      </Button>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-xs text-gray-500/80">切换到日历视图可获得更好的规划体验</p>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
      </main>

      {/* 浮动面板系统 - 替代原有侧边栏 */}
      <FloatingPanelSystem 
        selectedEvent={selectedEvent}
        onTaskSchedule={(task: unknown) => {
          // Schedule task
        }}
      />

      {/* v4.0 功能指南弹窗 - 只通过点击导航栏按钮显示 */}
      <FeatureGuideModal 
        isOpen={showFeatureGuide}
        onClose={() => setShowFeatureGuide(false)}
      />
      
      {/* 温暖引导系统 */}
      <WarmGuidanceOverlay />
    </div>
  )
}
